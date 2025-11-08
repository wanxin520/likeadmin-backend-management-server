'use strict';

/**
 * 代码生成器控制器
 * 功能: 处理自动化代码生成相关的业务逻辑，包括表管理、代码预览和下载
 * 位置: app/controller/gen/gen.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 代码生成器模块
 */
const baseController = require('../baseController');
const fs = require('fs');
const { Readable } = require('stream');

class GenController extends baseController {

  /**
   * 获取已导入的表列表
   * 接口地址: GET /api/gen/list
   * 功能: 查询系统中已导入的数据库表信息列表
   * 权限: 需要管理员权限
   * 请求参数:
   *   - page: 页码（可选）
   *   - pageSize: 每页数量（可选）
   *   - tableName: 表名搜索关键词（可选）
   *   - tableComment: 表注释搜索关键词（可选）
   * 返回数据: 表列表数据，包含分页信息
   */
  async list() {
    const { ctx } = this;
    try {
      // 从URL查询字符串获取分页和搜索参数
      const listReq = ctx.request.query;
      // 调用代码生成服务获取表列表
      const data = await ctx.service.gen.list(listReq);
      // 返回统一格式的响应
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理：记录日志并返回500错误
      ctx.logger.error(`GenController.list error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取数据库中的表列表
   * 接口地址: GET /api/gen/db
   * 功能: 查询数据库中所有可用的表（未导入到代码生成系统的表）
   * 权限: 需要管理员权限
   * 请求参数:
   *   - page: 页码（可选）
   *   - pageSize: 每页数量（可选）
   *   - tableName: 表名搜索关键词（可选）
   *   - tableComment: 表注释搜索关键词（可选）
   * 返回数据: 数据库表列表，包含分页信息
   */
  async dbTables() {
    const { ctx } = this;
    try {
      // 获取查询参数
      const listReq = ctx.request.query;
      // 调用服务层获取数据库表列表
      const data = await ctx.service.gen.dbTables(listReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`GenController.dbTables error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 导入数据库表到代码生成系统
   * 接口地址: POST /api/gen/importTable
   * 功能: 将选中的数据库表导入到代码生成系统中，用于后续代码生成
   * 权限: 需要管理员权限
   * 请求参数:
   *   - tables: 表名数组，多个表名用逗号分隔（必填）
   * 返回数据: 导入结果信息
   * 业务流程:
   *   1. 解析表名参数
   *   2. 验证表是否存在
   *   3. 读取表结构信息
   *   4. 保存到代码生成表
   */
  async importTable() {
    const { ctx } = this;
    try {
      // 从查询参数获取表名列表（逗号分隔的字符串）
      const { tables } = ctx.request.query;
      // 调用服务层执行表导入操作
      const data = await ctx.service.gen.importTable(tables);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`GenController.importTable error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 删除已导入的表
   * 接口地址: POST /api/gen/delTable
   * 功能: 从代码生成系统中删除指定的表记录
   * 权限: 需要管理员权限
   * 请求参数:
   *   - ids: 表ID数组（必填）
   * 返回数据: 空对象，表示操作成功
   * 注意: 此操作只删除代码生成系统中的记录，不会删除实际数据库表
   */
  async delTable() {
    const { ctx } = this;
    // 从请求体获取要删除的表ID数组
    const { ids } = ctx.request.body;

    try {
      // 调用服务层执行表删除操作
      await ctx.service.gen.delTable(ids);
      this.result({
        data: '',
      });
    } catch (err) {
      ctx.logger.error(`DelTable Delete error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 同步表结构
   * 接口地址: GET /api/gen/syncTable
   * 功能: 将数据库表的当前结构同步到代码生成系统
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 表ID（必填）
   * 返回数据: 空对象，表示操作成功
   * 使用场景: 当数据库表结构发生变化时，使用此接口更新代码生成系统中的表信息
   */
  async syncTable() {
    const { ctx } = this;
    // 从查询参数获取表ID
    const { id } = ctx.request.query;

    try {
      // 调用服务层执行表结构同步
      await ctx.service.gen.syncTable(id);
      this.result({
        data: '',
      });
    } catch (err) {
      ctx.logger.error(`syncTable error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 预览生成代码
   * 接口地址: GET /api/gen/previewCode
   * 功能: 预览根据表结构生成的代码文件内容
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 表ID（必填）
   * 返回数据: 代码文件预览内容，包含多个文件的代码
   * 返回格式:
   *   {
   *     "controller.js": "代码内容",
   *     "service.js": "代码内容",
   *     "model.js": "代码内容"
   *   }
   */
  async previewCode() {
    const { ctx } = this;
    // 从查询参数获取表ID
    const { id } = ctx.request.query;

    try {
      // 调用服务层生成代码预览
      const res = await ctx.service.gen.previewCode(id);
      this.result({
        data: res,
      });
    } catch (err) {
      ctx.logger.error(`previewCode error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 下载生成的代码
   * 接口地址: GET /api/gen/downloadCode
   * 功能: 将生成的代码文件打包成ZIP格式并提供下载
   * 权限: 需要管理员权限
   * 请求参数:
   *   - tables: 表名数组，多个表名用逗号分隔（必填）
   * 返回数据: ZIP文件流
   * 技术特点:
   *   - 使用流式处理，支持大文件下载
   *   - 设置正确的Content-Type和Content-Disposition头部
   *   - 支持批量表代码下载
   */
  async downloadCode() {
    const { ctx } = this;
    // 从查询参数获取表名列表（逗号分隔）
    const { tables } = ctx.request.query;

    try {
      // 将逗号分隔的字符串转换为数组
      const tablesList = tables.split(',');
      // 定义ZIP文件保存路径
      const zipPath = 'app/public/downloads/file.zip';
      // 调用服务层生成代码并打包
      await ctx.service.gen.downloadCode(zipPath, tablesList);

      // 创建文件读取流
      const fileStream = fs.createReadStream(zipPath);
      // 将文件流包装为可读流
      const fileContents = new Readable().wrap(fileStream);
      // 设置响应头
      const contentType = 'application/zip';
      ctx.set('Content-Type', contentType);
      // 设置下载文件名
      ctx.set('Content-Disposition', 'attachment; filename=likeadmin-gen.zip');
      // 返回文件流作为响应体
      ctx.body = fileContents;
    } catch (err) {
      ctx.logger.error(`downloadCode error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出控制器类
module.exports = GenController;
