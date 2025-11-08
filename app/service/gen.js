'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;
// 引入配置常量
const { dbTablePrefix, genConfig, nodeConstants, genConstants, sqlConstants, htmlConstants } = require('../extend/config');
const util = require('../util'); // 自定义工具函数
const Sequelize = require('sequelize');
const Op = Sequelize.Op; // Sequelize操作符
const templateUtil = require('../util/templateUtil'); // 模板处理工具
const fs = require('fs'); // 文件系统模块
const archiver = require('archiver'); // 压缩包生成库

/**
 * 代码生成器服务类
 * 功能：自动化生成前后端代码，包括模型、控制器、服务、路由、前端页面等
 * 基于数据库表结构自动生成完整的CRUD代码
 */
class GenService extends Service {

  /**
   * 获取已生成的表列表（分页）
   * @param {Object} listReq 请求参数 {pageNo, pageSize, tableName, tableComment, startTime, endTime}
   * @return {Object} 分页结果 {pageNo, pageSize, count, lists}
   */
  async list(listReq) {
    const { app } = this;
    const { GenTable } = app.model;

    try {
      const { pageSize, pageNo, tableName, tableComment, startTime, endTime } = listReq;

      // 计算分页参数
      const limit = parseInt(pageSize, 10);
      const offset = pageSize * (pageNo - 1);

      // 构建查询条件
      const whereClause = {};
      if (tableName) {
        whereClause.tableName = { [Op.like]: `%${tableName}%` };
      }
      if (tableComment) {
        whereClause.tableComment = { [Op.like]: `%${tableComment}%` };
      }
      if (startTime) {
        whereClause.createTime = { [Op.gte]: startTime };
      }
      if (endTime) {
        whereClause.createTime = { [Op.lte]: endTime };
      }

      // 查询已生成的表列表
      const { count, rows: genResp } = await GenTable.findAndCountAll({
        where: whereClause,
        limit,
        offset,
      });

      const data = {
        pageNo,
        pageSize,
        count,
        lists: genResp,
      };
      return data;
    } catch (err) {
      throw new Error(`GenService.list error: ${err}`);
    }
  }

  /**
   * 获取数据库表列表（分页）
   * @param {Object} listReq 请求参数 {pageNo, pageSize, tableName, tableComment}
   * @return {Object} 分页结果 {pageNo, pageSize, count, lists}
   */
  async dbTables(listReq) {
    const { pageSize, pageNo, tableName, tableComment } = listReq;
    const limit = parseInt(pageSize, 10);
    const offset = pageSize * (pageNo - 1);

    // 查询数据库中的表信息
    const result = await this.getDbTablesQuery(tableName, tableComment, limit, offset);

    const count = result.total;
    const tbResp = result.data;

    return {
      pageNo,
      pageSize,
      count,
      lists: tbResp,
    };
  }

  /**
   * 导入数据库表结构
   * @param {Array} tableNames 表名数组
   */
  async importTable(tableNames) {
    const { app } = this;
    const { GenTable, GenTableColumn } = app.model;
    let dbTbs;
    try {
      // 根据表名获取数据库表信息
      dbTbs = await this.getDbTablesQueryByNames(tableNames);
    } catch (err) {
      throw new Error('ImportTable Find tables err');
    }

    if (dbTbs.length === 0) {
      throw new Error('表不存在!');
    }

    try {
      // 使用事务确保数据一致性
      await this.ctx.model.transaction(async transaction => {
        for (let i = 0; i < dbTbs.length; i++) {
          // 初始化表信息
          const genTable = await this.initTable(dbTbs[i]);
          let genTableId = '';
          try {
            // 创建表记录
            const result = await GenTable.create(genTable, { transaction });
            genTableId = result.id;
          } catch (err) {
            throw new Error(`ImportTable Create table err: ${err}`);
          }

          // 获取表的列信息
          const columns = await this.getDbTableColumnsQueryByName(dbTbs[i].tableName);

          // 为每个列创建记录
          for (let j = 0; j < columns.length; j++) {
            const column = await this.initColumn(genTableId, columns[j]);
            try {
              await GenTableColumn.create(column, { transaction });
            } catch (err) {
              throw new Error(`ImportTable Create column err: ${err}`);
            }
          }
        }
      });
    } catch (err) {
      throw new Error('ImportTable Transaction err');
    }
  }

  /**
   * 删除已导入的表
   * @param {Array} ids 表ID数组
   */
  async delTable(ids) {
    const { app } = this;
    const { GenTable, GenTableColumn } = app.model;

    try {
      // 使用事务删除表及其列信息
      await app.model.transaction(async t => {
        // 删除表记录
        await GenTable.destroy({
          where: {
            id: ids,
          },
          transaction: t,
        });

        // 删除关联的列记录
        await GenTableColumn.destroy({
          where: {
            tableId: ids,
          },
          transaction: t,
        });
      });
    } catch (err) {
      throw new Error('DelTable Transaction failed');
    }
  }

  /**
   * 同步表结构（当数据库表结构发生变化时）
   * @param {number} id 表ID
   */
  async syncTable(id) {
    const { app } = this;
    const { GenTable, GenTableColumn } = app.model;

    try {
      // 获取旧数据
      const genTable = await GenTable.findOne({
        where: {
          id,
        },
      });
      if (!genTable) {
        throw new Error('生成数据不存在！');
      }

      // 获取旧的列信息
      const genTableCols = await GenTableColumn.findAll({
        where: {
          tableId: id,
        },
        order: [[ 'sort', 'ASC' ]],
      });
      if (genTableCols.length <= 0) {
        throw new Error('旧数据异常！');
      }

      // 构建旧列映射
      const prevColMap = {};
      for (let i = 0; i < genTableCols.length; i++) {
        prevColMap[genTableCols[i].columnName] = genTableCols[i];
      }

      // 获取新的数据库列信息
      const columns = await this.getDbTableColumnsQueryByName(genTable.tableName);

      if (columns.length <= 0) {
        throw new Error('同步结构失败，原表结构不存在！');
      }

      // 事务处理同步操作
      await app.model.transaction(async t => {
        // 处理新增和更新
        for (let i = 0; i < columns.length; i++) {
          const col = this.initColumn(id, columns[i]);
          if (prevColMap.hasOwnProperty(columns[i].columnName)) {
            // 更新已有列
            const prevCol = prevColMap[columns[i].columnName];
            col.id = prevCol.id;

            // 保留原有的配置信息
            if (col.isList === 0) {
              col.dictType = prevCol.dictType;
              col.queryType = prevCol.queryType;
            }
            if ((prevCol.isRequired === 1 && prevCol.isPk === 0 && prevCol.isInsert === 1) || prevCol.isEdit === 1) {
              col.htmlType = prevCol.htmlType;
              col.isRequired = prevCol.isRequired;
            }

            await GenTableColumn.update(col, {
              where: {
                id: prevCol.id,
              },
              transaction: t,
            });
          } else {
            // 新增列
            await col.save({ transaction: t });
          }
        }

        // 处理删除的列
        const colNames = columns.map(col => col.columnName);
        const delColIds = [];
        for (const prevCol of Object.values(prevColMap)) {
          if (!colNames.includes(prevCol.columnName)) {
            delColIds.push(prevCol.id);
          }
        }
        await GenTableColumn.destroy({
          where: {
            id: delColIds,
          },
          transaction: t,
        });
      });
    } catch (err) {
      throw new Error('SyncTable Transaction err');
    }
  }

  /**
   * 预览生成的代码
   * @param {number} id 表ID
   * @return {Object} 生成的代码内容
   */
  async previewCode(id) {
    const { app } = this;
    const { GenTable } = app.model;

    // 获取表信息
    const genTable = await GenTable.findOne({ where: { id } });

    if (!genTable) {
      throw new Error('记录丢失！');
    }

    // 渲染代码
    const tplCodeMap = await this.renderCodeByTable(genTable);

    // 处理返回结果
    const res = {};
    for (const tplPath in tplCodeMap) {
      res[tplPath.replace('.tpl', '')] = tplCodeMap[tplPath];
    }

    return res;
  }

  /**
   * 下载生成的代码（压缩包）
   * @param {string} zipPath 压缩包路径
   * @param {Array} tableNames 表名数组
   * @return {string} 压缩包路径
   */
  async downloadCode(zipPath, tableNames) {
    try {
      // 为每个表生成代码并打包
      for (const tableName of tableNames) {
        await this.genZipCode(zipPath, tableName);
      }
      return zipPath;
    } catch (err) {
      throw new Error(`DownloadCode error: ${err.message}`);
    }
  }

  // ==================== 通用方法 ====================

  /**
   * 查询数据库表列表（原生SQL查询）
   * @param {string} tableName 表名筛选
   * @param {string} tableComment 表注释筛选
   * @param {number} limit 分页大小
   * @param {number} offset 偏移量
   * @return {Object} 查询结果 {total, data}
   */
  async getDbTablesQuery(tableName, tableComment, limit, offset) {
    const { app } = this;
    const sequelize = app.model; // 获取 Sequelize 实例

    let whereStr = '';
    if (tableName) {
      whereStr += `AND lower(table_name) like lower("%${tableName}%")`;
    }
    if (tableComment) {
      whereStr += `AND lower(table_comment) like lower("%${tableComment}%")`;
    }

    try {
      // 查询总数
      const countResult = await sequelize.query(`
        SELECT COUNT(*) AS total
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_name NOT LIKE 'qrtz_%'
        AND table_name NOT LIKE 'gen_%'
        AND table_name NOT IN (SELECT table_name FROM la_gen_table)
        ${whereStr}
      `, {
        type: sequelize.QueryTypes.SELECT,
      });
      const totalCount = countResult[0].total;

      // 查询表数据
      const queryResult = await sequelize.query(`
        SELECT table_name AS tableName, table_comment AS tableComment, DATE_FORMAT(create_time, '%Y-%m-%d %H:%i:%s') AS createTime, update_time AS updateTime
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_name NOT LIKE 'qrtz_%'
        AND table_name NOT LIKE 'gen_%'
        AND table_name NOT IN (SELECT table_name FROM la_gen_table)
        ${whereStr}
        LIMIT ${limit} OFFSET ${offset}`, {
        type: sequelize.QueryTypes.SELECT,
      });

      return {
        total: totalCount,
        data: queryResult,
      };
    } catch (err) {
      throw new Error('Failed to get database tables query.');
    }
  }

  /**
   * 根据表名查询数据库表信息
   * @param {Array} tableNames 表名数组
   * @return {Array} 表信息数组
   */
  async getDbTablesQueryByNames(tableNames) {
    const { app } = this;
    const sequelize = app.model;

    try {
      const query = await sequelize.query(`
        SELECT table_name AS tableName, table_comment AS tableComment, create_time AS createTime, update_time AS updateTime
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name NOT LIKE 'qrtz_%'
          AND table_name NOT LIKE 'gen_%'
          AND table_name IN (:tableNames)
      `, {
        replacements: { tableNames },
        type: sequelize.QueryTypes.SELECT,
      });

      return query;
    } catch (err) {
      throw new Error('Failed to get database tables query by names.');
    }
  }

  /**
   * 根据表名查询数据库表列信息
   * @param {string} tableName 表名
   * @return {Array} 列信息数组
   */
  async getDbTableColumnsQueryByName(tableName) {
    console.log(tableName, 'tableName...');
    const { app } = this;
    const sequelize = app.model;

    const query = await sequelize.query(`
      SELECT column_name AS columnName,
        (CASE WHEN (is_nullable = "no" AND column_key != "PRI") THEN "1" ELSE "0" END) AS isRequired,
        (CASE WHEN column_key = "PRI" THEN "1" ELSE "0" END) AS isPk,
        ordinal_position AS sort, column_comment AS columnComment,
        (CASE WHEN extra = "auto_increment" THEN "1" ELSE "0" END) AS isIncrement, column_type AS columnType
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = :tableName
      ORDER BY ordinal_position
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { tableName },
    });

    return query;
  }

  /**
   * 初始化列信息
   * @param {number} tableId 表ID
   * @param {Object} column 列信息
   * @return {Object} 初始化的列对象
   */
  async initColumn(tableId, column) {
    // 获取列类型和长度
    const columnType = await this.getDbType(column.columnType);
    const columnLen = await this.getColumnLength(column.columnType);

    // 构建基础列信息
    const col = {
      tableId,
      columnName: column.columnName,
      columnComment: column.columnComment,
      columnType,
      columnLength: columnLen,
      javaField: column.columnName, // 默认Java字段名与列名相同
      javaType: nodeConstants.typeString, // 默认字符串类型
      queryType: genConstants.queryEq, // 默认等值查询
      sort: column.sort,
      isPk: column.isPk, // 是否主键
      isIncrement: column.isIncrement, // 是否自增
      isRequired: column.isRequired, // 是否必填
      createTime: Math.floor(Date.now() / 1000),
      updateTime: Math.floor(Date.now() / 1000),
    };

    // 根据列类型设置HTML类型和Java类型
    if (util.contains([ ...sqlConstants.columnTypeStr, ...sqlConstants.columnTypeText ], columnType)) {
      // 字符串和文本类型
      if (columnLen >= 500 || util.contains(sqlConstants.columnTypeText, columnType)) {
        col.htmlType = htmlConstants.htmlTextarea; // 长文本使用textarea
      } else {
        col.htmlType = htmlConstants.htmlInput; // 短文本使用input
      }
    } else if (util.contains(sqlConstants.columnTypeTime, columnType)) {
      // 时间类型
      col.javaType = nodeConstants.typeDate;
      col.htmlType = htmlConstants.htmlDatetime;
    } else if (util.contains(sqlConstants.columnTimeName, col.columnName)) {
      // 时间字段名
      col.javaType = nodeConstants.typeDate;
      col.htmlType = htmlConstants.htmlDatetime;
    } else if (util.contains(sqlConstants.columnTypeNumber, columnType)) {
      // 数字类型
      col.htmlType = htmlConstants.htmlInput;
      if (columnType.includes(',')) {
        col.javaType = nodeConstants.typeFloat; // 浮点数
      } else {
        col.javaType = nodeConstants.typeInt; // 整数
      }
    }

    // 特殊字段处理
    if (util.contains(sqlConstants.columnNameNotEdit, col.columnName)) {
      col.isRequired = 0; // 不可编辑字段不设为必填
    }

    // 设置CRUD操作权限
    if (!util.contains(sqlConstants.columnNameNotAdd, col.columnName)) {
      col.isInsert = genConstants.require; // 可插入
    }

    if (!util.contains(sqlConstants.columnNameNotEdit, col.columnName)) {
      col.isEdit = genConstants.require; // 可编辑
      col.isRequired = genConstants.require; // 必填
    }

    if (!util.contains(sqlConstants.columnNameNotList, col.columnName) && col.isPk === 0) {
      col.isList = genConstants.require; // 可列表显示
    }

    if (!util.contains(sqlConstants.columnNameNotQuery, col.columnName) && col.isPk === 0) {
      col.isQuery = genConstants.require; // 可查询
    }

    const lowerColName = col.columnName.toLowerCase();

    // 根据字段名设置查询类型
    if (lowerColName.endsWith('name') || util.contains([ 'title', 'mobile' ], lowerColName)) {
      col.queryType = genConstants.queryLike; // 模糊查询
    }

    // 根据字段名设置HTML控件类型
    if (lowerColName.endsWith('status') || util.contains([ 'is_show', 'is_disable' ], lowerColName)) {
      col.htmlType = htmlConstants.htmlRadio; // 单选框
    } else if (lowerColName.endsWith('type') || lowerColName.endsWith('sex')) {
      col.htmlType = htmlConstants.htmlSelect; // 下拉框
    } else if (lowerColName.endsWith('image')) {
      col.htmlType = htmlConstants.htmlImageUpload; // 图片上传
    } else if (lowerColName.endsWith('file')) {
      col.htmlType = htmlConstants.htmlFileUpload; // 文件上传
    } else if (lowerColName.endsWith('content')) {
      col.htmlType = htmlConstants.htmlEditor; // 富文本编辑器
    }

    return col;
  }

  /**
   * 初始化表信息
   * @param {Object} table 表信息
   * @return {Object} 初始化的表对象
   */
  async initTable(table) {
    return {
      tableName: table.tableName,
      tableComment: table.tableComment,
      authorName: '', // 作者名（可配置）
      entityName: await this.toClassName(table.tableName), // 实体类名
      moduleName: await this.toModuleName(table.tableName), // 模块名
      functionName: table.tableComment.replace('表', ''), // 功能名
      createTime: Math.floor(Date.now() / 1000),
      updateTime: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 转换为类名（驼峰命名）
   * @param {string} name 表名
   * @return {string} 类名
   */
  async toClassName(name) {
    const tablePrefix = dbTablePrefix;

    // 移除表前缀
    if (genConfig.isRemoveTablePrefix && tablePrefix !== '' && name.startsWith(tablePrefix)) {
      name = name.slice(tablePrefix.length);
    }

    return util.toCamelCase(name);
  }

  /**
   * 转换为模块名
   * @param {string} name 表名
   * @return {string} 模块名
   */
  async toModuleName(name) {
    const names = name.split('_');
    return names[names.length - 1]; // 取最后一段作为模块名
  }

  /**
   * 获取数据库类型（去除长度信息）
   * @param {string} columnType 列类型
   * @return {string} 纯类型名
   */
  async getDbType(columnType) {
    console.log(columnType, 'columnType...');
    const index = columnType.indexOf('(');
    if (index < 0) {
      return columnType;
    }
    return columnType.substring(0, index);
  }

  /**
   * 获取列长度
   * @param {string} columnType 列类型
   * @return {number} 列长度
   */
  async getColumnLength(columnType) {
    const index = columnType.indexOf('(');
    if (index < 0) {
      return 0;
    }
    const endIndex = columnType.indexOf(')', index);
    if (endIndex < 0) {
      return 0;
    }
    const lengthStr = columnType.substring(index + 1, endIndex);
    const length = parseInt(lengthStr, 10);
    if (isNaN(length)) {
      return 0;
    }
    return length;
  }

  /**
   * 获取表的主键列
   * @param {Array} columns 列数组
   * @return {Object} 主键列
   */
  async getTablePriCol(columns) {
    for (const col of columns) {
      if (col.isPk === 1) {
        return col;
      }
    }
  }

  /**
   * 根据主表获取子表信息
   * @param {Object} genTable 生成表对象
   * @return {Object} 子表信息 {pkCol, cols}
   */
  async getSubTableInfo(genTable) {
    const { app } = this;
    const { GenTable } = app.model;
    if (!genTable.tableName || !genTable.subTableFk) {
      return;
    }

    try {
      const table = await GenTable.findOne({
        where: {
          tableName: genTable.tableName,
        },
      });

      if (!table) {
        throw new Error('子表记录丢失！');
      }

      const cols = await this.getDbTableColumnsQueryByName(genTable.tableName);

      const pkCol = await this.initColumn(table.id, await this.getTablePriCol(cols));

      return { pkCol, cols };
    } catch (err) {
      throw new Error('getSubTableInfo error: ' + err);
    }
  }

  /**
   * 根据表和模板文件渲染代码
   * @param {Object} genTable 生成表对象
   * @return {Object} 渲染后的代码映射
   */
  async renderCodeByTable(genTable) {
    const { app } = this;
    const { GenTableColumn } = app.model;

    // 获取表的所有列
    const columns = await GenTableColumn.findAll({ where: { tableId: genTable.id }, order: [[ 'sort', 'ASC' ]] });

    // 获取子表信息
    const data = await this.getSubTableInfo(genTable);

    const pkCol = data.pkCol || {};
    const cols = data.cols || [];

    // 准备模板变量
    const vars = templateUtil.prepareVars(genTable, columns, pkCol, cols);

    // 渲染所有模板
    const res = {};
    for (const tplPath of templateUtil.getTemplatePaths(genTable.genTpl)) {
      res[tplPath] = await templateUtil.render(tplPath, vars);
    }

    return res;
  }

  /**
   * 获取生成文件的相对路径
   * @param {Object} tplCodeMap 模板代码映射
   * @param {string} moduleName 模块名
   * @return {Object} 文件路径映射
   */
  async getFilePaths(tplCodeMap, moduleName) {
    try {
      // 模板路径到文件路径的映射
      const fmtMap = {
        'nodecode/model.js.tpl': 'nodecode/%s/model.js',
        'nodecode/controller.js.tpl': 'nodecode/%s/controller.js',
        'nodecode/service.js.tpl': 'nodecode/%s/service.js',
        'nodecode/route.js.tpl': 'nodecode/%s/route.js',
        'vue/api.ts.tpl': 'vue/%s/api.ts',
        'vue/edit.vue.tpl': 'vue/%s/edit.vue',
        'vue/index.vue.tpl': 'vue/%s/index.vue',
        'vue/index-tree.vue.tpl': 'vue/%s/index-tree.vue',
      };

      const filePath = {};
      for (const tplPath in tplCodeMap) {
        console.log(tplPath, 'tplPath....');
        const file = fmtMap[tplPath].replace('%s', moduleName);
        filePath[file] = tplCodeMap[tplPath];
      }
      return filePath;
    } catch (err) {
      throw new Error(`getFilePaths error: ${err.message}`);
    }
  }

  /**
   * 添加文件到压缩包
   * @param {string} zipPath 压缩包路径
   * @param {Object} file 文件对象
   * @return {string} 压缩包路径
   */
  async addFileToZip(zipPath, file) {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);

    const header = { name: file.Name, method: 'DEFLATE' };
    archive.append(file.Body, header);

    await util.promisify(archive.finalize)();

    return zipPath;
  }

  /**
   * 生成代码压缩包
   * @param {string} zipPath 压缩包路径
   * @param {Object} tplCodeMap 模板代码映射
   * @param {string} moduleName 模块名
   */
  async genZip(zipPath, tplCodeMap, moduleName) {
    try {
      // 获取文件路径映射
      const filePaths = await this.getFilePaths(tplCodeMap, moduleName);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(output);

      // 添加所有文件到压缩包
      for (const file in filePaths) {
        const tplCode = filePaths[file];
        archive.append(tplCode, { name: file });
      }

      await archive.finalize();
    } catch (err) {
      throw new Error(`genZip error: ${err.message}`);
    }
  }

  /**
   * 生成代码并打包（压缩包下载）
   * @param {string} zipPath 压缩包路径
   * @param {string} tableName 表名
   */
  async genZipCode(zipPath, tableName) {
    const { app } = this;
    const { GenTable } = app.model;

    try {
      // 获取表信息
      const genTable = await GenTable.findOne({
        where: { tableName },
        order: [[ 'id', 'DESC' ]],
        limit: 1,
      });

      if (!genTable) {
        throw new Error('记录丢失！');
      }

      // 获取模板内容
      const tplCodeMap = await this.renderCodeByTable(genTable);

      // 压缩文件
      await this.genZip(zipPath, tplCodeMap, genTable.moduleName);
    } catch (err) {
      throw new Error(`genZipCode error: ${err.message}`);
    }
  }
}

// 导出服务类
module.exports = GenService;
