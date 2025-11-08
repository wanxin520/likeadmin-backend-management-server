'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;
const Sequelize = require('sequelize');
const Op = Sequelize.Op; // Sequelize操作符

/**
 * 字典管理服务类
 * 功能：处理系统字典类型和字典数据的完整CRUD操作
 * 字典用于管理系统中的常量数据，如状态、类型、分类等
 */
class DictService extends Service {

  // ==================== 字典类型管理 ====================

  /**
   * 获取字典类型列表（分页）
   * @param {Object} listReq 请求参数 {pageNo, pageSize, dictName, dictType, dictStatus}
   * @return {Object} 分页结果 {pageNo, pageSize, count, lists}
   */
  async list(listReq) {
    const { app } = this;
    const { DictType } = app.model;

    try {
      // 计算分页参数
      const limit = parseInt(listReq.pageSize, 10);
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      // 构建查询条件
      const where = {
        isDelete: 0, // 只查询未删除的记录
        // 动态添加查询条件
        ...(listReq.dictName && { dictName: { [Op.like]: `%${listReq.dictName}%` } }),
        ...(listReq.dictType && { dictType: { [Op.like]: `%${listReq.dictType}%` } }),
        ...(listReq.dictStatus && { dictStatus: listReq.dictStatus }),
      };

      // 查询字典类型数据（分页）
      const DictTypeModel = await DictType.findAndCountAll({
        where,
        limit,
        offset,
        order: [[ 'id', 'DESC' ]], // 按ID降序排列
      });

      const { count, rows } = DictTypeModel;

      // 返回分页结果
      const data = {
        pageNo: listReq.pageNo,
        pageSize: listReq.pageSize,
        count, // 总数
        lists: rows, // 数据列表
      };
      return data;
    } catch (err) {
      throw new Error(`DictService.list error: ${err}`);
    }
  }

  /**
   * 获取所有字典类型（不分页）
   * @return {Array} 所有字典类型列表
   */
  async all() {
    const { app } = this;
    const { DictType } = app.model;

    try {
      // 查询所有未删除的字典类型
      const dictTypes = await DictType.findAll({
        where: { isDelete: 0 },
        order: [[ 'id', 'DESC' ]],
      });

      return dictTypes;
    } catch (err) {
      throw new Error(`DictService.all error: ${err}`);
    }
  }

  /**
   * 添加字典类型
   * @param {Object} addReq 字典类型信息 {dictName, dictType, dictStatus, remark}
   * @return {Object} 新创建的字典类型
   */
  async add(addReq) {
    const { app } = this;
    const { DictType } = app.model;

    // 移除ID字段，避免前端传入
    delete addReq.id;

    try {
      // 检查字典名称是否已存在
      const existingDictName = await DictType.findOne({
        where: { dictName: addReq.dictName, isDelete: 0 },
      });
      console.log(existingDictName, 'existingDictName....');
      if (existingDictName) {
        throw new Error('字典名称已存在！');
      }

      // 检查字典类型是否已存在
      const existingDictType = await DictType.findOne({
        where: { dictType: addReq.dictType, isDelete: 0 },
      });
      if (existingDictType) {
        throw new Error('字典类型已存在！');
      }

      // 生成时间戳
      const dateTime = Math.floor(Date.now() / 1000);
      const timeObject = {
        createTime: dateTime,
        updateTime: dateTime,
      };

      // 创建字典类型记录
      const dt = await DictType.create({ ...addReq, ...timeObject });

      return dt;
    } catch (err) {
      throw new Error(`DictService.add error: ${err}`);
    }
  }

  /**
   * 获取字典类型详情
   * @param {number} id 字典类型ID
   * @return {Object} 字典类型详细信息
   */
  async detail(id) {
    const { app } = this;
    const { DictType } = app.model;

    try {
      // 查询指定字典类型
      const dt = await DictType.findOne({
        where: { id, isDelete: 0 },
      });
      if (!dt) {
        throw new Error('字典类型不存在！');
      }
      return dt;
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * 编辑字典类型信息
   * @param {Object} editReq 编辑请求参数 {id, dictName, dictType, dictStatus, remark}
   */
  async edit(editReq) {
    const { app } = this;
    const { DictType } = app.model;

    try {
      // 检查字典类型是否存在
      const existingDictType = await DictType.findOne({
        where: { id: editReq.id, isDelete: 0 },
      });
      if (!existingDictType) {
        throw new Error('字典类型不存在！');
      }

      // 检查字典名称是否与其他字典类型重复（排除自己）
      const duplicateDictName = await DictType.findOne({
        where: {
          id: { [Op.ne]: editReq.id }, // 不等于当前ID
          dictName: editReq.dictName,
          isDelete: 0,
        },
      });
      if (duplicateDictName) {
        throw new Error('字典名称已存在！');
      }

      // 检查字典类型是否与其他字典类型重复（排除自己）
      const duplicateDictType = await DictType.findOne({
        where: {
          id: { [Op.ne]: editReq.id },
          dictType: editReq.dictType,
          isDelete: 0,
        },
      });
      if (duplicateDictType) {
        throw new Error('字典类型已存在！');
      }

      // 更新字典类型信息
      await existingDictType.update(editReq);
    } catch (err) {
      throw new Error(`DictService.edit error: ${err}`);
    }
  }

  /**
   * 删除字典类型（软删除）
   * @param {Object} delReq 删除请求参数 {ids: 字典类型ID数组}
   */
  async del(delReq) {
    const { app } = this;
    const { DictType } = app.model;

    try {
      // 生成时间戳
      const dateTime = Math.floor(Date.now() / 1000);

      // 批量软删除字典类型
      await DictType.update(
        {
          isDelete: 1, // 标记为已删除
          deleteTime: dateTime, // 设置删除时间
        },
        { where: { id: delReq.ids } } // 批量删除指定ID的字典类型
      );
    } catch (err) {
      throw new Error(`DictService.del error: ${err}`);
    }
  }

  // ==================== 字典数据管理 ====================

  /**
   * 获取字典数据列表（分页）
   * @param {Object} listReq 请求参数 {pageNo, pageSize, dictType, name, value, status}
   * @return {Object} 分页结果 {pageNo, pageSize, count, lists}
   */
  async dataList(listReq) {
    const { app } = this;
    const { DictType, DictData } = app.model;

    try {
      // 计算分页参数
      const limit = parseInt(listReq.pageSize, 10);
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      // 根据字典类型编码查找字典类型
      const dictType = await DictType.findOne({
        where: {
          dictType: listReq.dictType,
          isDelete: 0,
        },
      });

      if (!dictType) {
        throw new Error('该字典类型不存在！');
      }

      // 构建查询条件
      const where = {
        typeId: dictType.id, // 关联的字典类型ID
        isDelete: 0,
        ...(listReq.name && { name: { [app.Sequelize.Op.like]: `%${listReq.name}%` } }),
        ...(listReq.value && { value: { [app.Sequelize.Op.like]: `%${listReq.value}%` } }),
        ...(listReq.status && { status: listReq.status }),
      };

      // 查询字典数据（分页）
      const DictDataModel = await DictData.findAndCountAll({
        where,
        limit,
        offset,
        order: [[ 'id', 'DESC' ]],
      });

      const { count, rows } = DictDataModel;

      // 返回分页结果
      const data = {
        pageNo: listReq.pageNo,
        pageSize: listReq.pageSize,
        count,
        lists: rows,
      };
      return data;
    } catch (err) {
      throw new Error(`DictService.dataList error: ${err}`);
    }
  }

  /**
   * 获取字典数据全部列表（不分页）
   * @param {Object} allReq 请求参数 {dictType, name, value, status}
   * @return {Array} 字典数据列表
   */
  async dataAll(allReq) {
    const { app } = this;
    const { DictType, DictData } = app.model;

    try {
      // 根据字典类型编码查找字典类型
      const dictType = await DictType.findOne({
        where: { dictType: allReq.dictType, isDelete: 0 },
      });
      if (!dictType) {
        throw new Error('该字典类型不存在！');
      }

      // 构建查询链
      const ddModel = DictData.scope(null).findAll({
        where: {
          typeId: dictType.id, // 关联的字典类型ID
          isDelete: 0,
        },
        order: [[ 'id', 'DESC' ]],
      });

      // 动态添加查询条件
      if (allReq.name) {
        ddModel.where.name = { [Op.like]: `%${allReq.name}%` };
      }
      if (allReq.value) {
        ddModel.where.value = { [Op.like]: `%${allReq.value}%` };
      }
      if (allReq.status) {
        ddModel.where.status = allReq.status;
      }

      // 执行查询
      const dictDatas = await ddModel;

      // 转换为JSON格式
      const res = dictDatas.map(dictData => dictData.toJSON());

      return res;
    } catch (err) {
      throw new Error(`DictService.dataAll error: ${err}`);
    }
  }

  /**
   * 获取字典数据详情
   * @param {number} id 字典数据ID
   * @return {Object} 字典数据详细信息
   */
  async dataDetail(id) {
    const { app } = this;
    const { DictData } = app.model;

    try {
      // 查询指定字典数据
      const dictData = await DictData.findOne({
        where: { id, isDelete: 0 },
      });
      if (!dictData) {
        throw new Error('字典数据不存在！');
      }

      return dictData;
    } catch (err) {
      throw new Error(`DictService.dataDetail error: ${err}`);
    }
  }

  /**
   * 添加字典数据
   * @param {Object} addReq 字典数据信息 {typeId, name, value, status, remark, sort}
   * @return {Object} 新创建的字典数据
   */
  async dataAdd(addReq) {
    const { app } = this;
    const { DictData } = app.model;

    // 移除ID字段，避免前端传入
    delete addReq.id;

    try {
      // 检查字典数据名称是否已存在
      const existingDictData = await DictData.findOne({
        where: { name: addReq.name, isDelete: 0 },
      });
      if (existingDictData) {
        throw new Error('字典数据已存在！');
      }

      // 创建字典数据记录
      const newDictData = await DictData.create(addReq);
      return newDictData;
    } catch (err) {
      throw new Error(`DictService.dataAdd error: ${err}`);
    }
  }

  /**
   * 编辑字典数据信息
   * @param {Object} editReq 编辑请求参数 {id, name, value, status, remark, sort}
   */
  async dataEdit(editReq) {
    const { app } = this;
    const { DictData } = app.model;

    try {
      // 检查字典数据是否存在
      const existingDictData = await DictData.findOne({
        where: { id: editReq.id, isDelete: 0 },
      });
      if (!existingDictData) {
        throw new Error('字典数据不存在！');
      }

      // 检查字典数据名称是否与其他字典数据重复（排除自己）
      const duplicateDictData = await DictData.findOne({
        where: {
          id: { [Op.ne]: editReq.id },
          name: editReq.name,
          isDelete: 0,
        },
      });
      if (duplicateDictData) {
        throw new Error('字典数据已存在！');
      }

      // 更新字典数据信息
      await existingDictData.update(editReq);
    } catch (err) {
      throw new Error(`DictService.dataEdit error: ${err}`);
    }
  }

  /**
   * 删除字典数据（软删除）
   * @param {Object} delReq 删除请求参数 {ids: 字典数据ID数组}
   */
  async dataDel(delReq) {
    const { app } = this;
    const { DictData } = app.model;

    try {
      // 生成时间戳
      const dateTime = Math.floor(Date.now() / 1000);

      // 批量软删除字典数据
      await DictData.update(
        {
          isDelete: 1,
          deleteTime: dateTime,
        },
        { where: { id: delReq.ids } }
      );
    } catch (err) {
      throw new Error(`DictService.del error: ${err}`);
    }
  }
}

// 导出服务类
module.exports = DictService;
