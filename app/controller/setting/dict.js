'use strict';

/**
 * 数据字典控制器
 * 功能: 处理数据字典类型和字典数据的完整CRUD操作
 * 位置: app/controller/setting/dict.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 系统设置 - 数据字典管理
 * 字典系统说明:
 *   - 字典类型: 定义字典的分类（如：用户状态、订单类型等）
 *   - 字典数据: 每个字典类型下的具体选项值
 */
const baseController = require('../baseController');

class SettingDictController extends baseController {

  /**
   * 获取字典类型列表（分页）
   * 接口地址: GET /api/setting/dict/type/list
   * 功能: 分页查询字典类型列表，支持搜索和筛选
   * 权限: 需要管理员权限
   * 请求参数:
   *   - page: 页码（可选，默认1）
   *   - pageSize: 每页数量（可选，默认10）
   *   - dictName: 字典名称搜索关键词（可选）
   *   - dictType: 字典类型搜索关键词（可选）
   *   - status: 状态筛选（可选，0-正常，1-停用）
   * 返回数据: 字典类型列表，包含分页信息
   */
  async list() {
    const { ctx } = this;
    try {
      // 获取查询参数（分页、搜索条件等）
      const listReq = ctx.request.query;
      // 调用字典服务层获取字典类型列表
      const data = await ctx.service.dict.list(listReq);
      // 返回分页数据
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理
      ctx.logger.error(`SettingDictController.list error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取所有字典类型（不分页）
   * 接口地址: GET /api/setting/dict/type/all
   * 功能: 获取所有可用的字典类型，用于下拉选择等场景
   * 权限: 需要登录认证
   * 请求参数: 无
   * 返回数据: 所有字典类型的简单列表
   * 使用场景: 前端在选择字典类型时使用
   */
  async all() {
    const { ctx } = this;
    try {
      // 获取所有字典类型，不进行分页
      const data = await ctx.service.dict.all();
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.all error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 添加字典类型
   * 接口地址: POST /api/setting/dict/type/add
   * 功能: 创建新的字典类型
   * 权限: 需要管理员权限
   * 请求参数:
   *   - dictName: 字典名称（必填）
   *   - dictType: 字典类型（必填，唯一标识）
   *   - status: 状态（可选，0-正常，1-停用，默认0）
   *   - remark: 备注信息（可选）
   * 返回数据: 操作结果
   */
  async add() {
    const { ctx } = this;
    try {
      // 获取添加字典类型的请求参数
      const addReq = ctx.request.body;
      // 调用服务层添加字典类型
      const data = await ctx.service.dict.add(addReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.add error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取字典类型详情
   * 接口地址: GET /api/setting/dict/type/detail
   * 功能: 根据ID获取字典类型的详细信息
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 字典类型ID（必填）
   * 返回数据: 字典类型的详细信息
   */
  async detail() {
    const { ctx } = this;
    try {
      // 从查询参数获取字典类型ID
      const { id } = ctx.request.query;
      // 调用服务层获取字典类型详情
      const data = await ctx.service.dict.detail(id);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.detail error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 编辑字典类型
   * 接口地址: POST /api/setting/dict/type/edit
   * 功能: 更新字典类型信息
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 字典类型ID（必填）
   *   - dictName: 字典名称（可选）
   *   - dictType: 字典类型（可选）
   *   - status: 状态（可选）
   *   - remark: 备注（可选）
   * 返回数据: 操作结果
   */
  async edit() {
    const { ctx } = this;
    try {
      // 获取编辑字典类型的请求参数
      const editReq = ctx.request.body;
      // 调用服务层更新字典类型
      const data = await ctx.service.dict.edit(editReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.edit error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 删除字典类型
   * 接口地址: POST /api/setting/dict/type/del
   * 功能: 删除指定的字典类型（可能同时删除关联的字典数据）
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 字典类型ID（必填）
   * 返回数据: 操作结果
   * 注意: 删除前应该检查是否有字典数据关联
   */
  async del() {
    const { ctx } = this;
    try {
      // 获取删除请求参数
      const delReq = ctx.request.body;
      // 调用服务层删除字典类型
      const data = await ctx.service.dict.del(delReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.del error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取字典数据列表（分页）
   * 接口地址: GET /api/setting/dict/data/list
   * 功能: 分页查询指定字典类型下的字典数据
   * 权限: 需要管理员权限
   * 请求参数:
   *   - dictType: 字典类型（必填）
   *   - page: 页码（可选）
   *   - pageSize: 每页数量（可选）
   *   - dictLabel: 字典标签搜索关键词（可选）
   *   - status: 状态筛选（可选）
   * 返回数据: 字典数据列表，包含分页信息
   */
  async dataList() {
    const { ctx } = this;
    try {
      // 获取字典数据查询参数
      const listReq = ctx.request.query;
      // 调用服务层获取字典数据列表
      const data = await ctx.service.dict.dataList(listReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.dataList error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取所有字典数据（不分页）
   * 接口地址: GET /api/setting/dict/data/all
   * 功能: 获取指定字典类型的所有字典数据，用于下拉选择等场景
   * 权限: 需要登录认证
   * 请求参数:
   *   - dictType: 字典类型（必填）
   * 返回数据: 字典数据列表
   * 使用场景: 前端在需要字典选项时调用
   */
  async dataAll() {
    const { ctx } = this;
    try {
      // 获取查询参数
      const allReq = ctx.request.query;
      // 调用服务层获取所有字典数据
      const data = await ctx.service.dict.dataAll(allReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.dataAll error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取字典数据详情
   * 接口地址: GET /api/setting/dict/data/detail
   * 功能: 根据ID获取字典数据的详细信息
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 字典数据ID（必填）
   * 返回数据: 字典数据的详细信息
   */
  async dataDetail() {
    const { ctx } = this;
    try {
      // 从查询参数获取字典数据ID
      const { id } = ctx.request.query;
      // 调用服务层获取字典数据详情
      const data = await ctx.service.dict.dataDetail(id);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.dataDetail error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 添加字典数据
   * 接口地址: POST /api/setting/dict/data/add
   * 功能: 为指定字典类型添加新的字典数据
   * 权限: 需要管理员权限
   * 请求参数:
   *   - dictType: 字典类型（必填）
   *   - dictLabel: 字典标签（必填，显示名称）
   *   - dictValue: 字典值（必填，存储值）
   *   - dictSort: 排序号（可选）
   *   - status: 状态（可选，0-正常，1-停用，默认0）
   *   - remark: 备注信息（可选）
   * 返回数据: 操作结果
   */
  async dataAdd() {
    const { ctx } = this;
    try {
      // 获取添加字典数据的请求参数
      const addReq = ctx.request.body;
      // 调用服务层添加字典数据
      const data = await ctx.service.dict.dataAdd(addReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.dataAdd error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 编辑字典数据
   * 接口地址: POST /api/setting/dict/data/edit
   * 功能: 更新字典数据信息
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 字典数据ID（必填）
   *   - dictLabel: 字典标签（可选）
   *   - dictValue: 字典值（可选）
   *   - dictSort: 排序号（可选）
   *   - status: 状态（可选）
   *   - remark: 备注（可选）
   * 返回数据: 操作结果
   */
  async dataEdit() {
    const { ctx } = this;
    try {
      // 获取编辑字典数据的请求参数
      const editReq = ctx.request.body;
      // 调用服务层更新字典数据
      const data = await ctx.service.dict.dataEdit(editReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.dataEdit error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 删除字典数据
   * 接口地址: POST /api/setting/dict/data/del
   * 功能: 删除指定的字典数据
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 字典数据ID（必填）
   * 返回数据: 操作结果
   */
  async dataDel() {
    const { ctx } = this;
    try {
      // 获取删除请求参数
      const delReq = ctx.request.body;
      // 调用服务层删除字典数据
      const data = await ctx.service.dict.dataDel(delReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingDictController.dataDel error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出字典控制器类
module.exports = SettingDictController;
