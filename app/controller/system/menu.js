'use strict';

// 引入基础控制器，继承统一的响应格式和错误处理方法
const baseController = require('../baseController');

/**
 * 系统菜单控制器类
 * 负责管理系统菜单的CRUD操作，菜单是权限系统的重要组成部分
 * @extends baseController
 */
class SystemMenuController extends baseController {
  /**
   * 获取菜单列表
   * 查询系统中的所有菜单，通常以树形结构返回
   *
   * 请求示例:
   * GET /api/menu/list?type=0&status=1
   *
   * @return {Object} 菜单列表数据，通常为树形结构
   */
  async menuList() {
    const { ctx } = this;
    try {
      // 获取查询参数，可能包含菜单类型、状态等过滤条件
      const params = ctx.query;

      // 调用菜单服务层获取菜单列表
      // 服务层负责处理菜单的树形结构组装
      const data = await ctx.service.authMenu.list(params);

      // 返回统一格式的成功响应
      this.result({
        data, // 菜单列表数据
      });
    } catch (err) {
      // 记录错误日志并返回500错误
      ctx.logger.error(`SystemController.menuList error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取菜单详情
   * 根据菜单ID查询单个菜单的详细信息
   *
   * 请求示例:
   * GET /api/menu/detail?id=1
   *
   * @return {Object} 菜单详细信息
   */
  async menuDetail() {
    const { ctx } = this;
    try {
      // 从查询参数中获取菜单ID
      const id = ctx.query.id;

      // 调用服务层获取菜单详情
      const data = await ctx.service.authMenu.detail(id);

      // 返回菜单详情数据
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SystemController.menuDetail error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 新增菜单
   * 创建新的菜单项，支持多级菜单结构
   *
   * 请求示例:
   * POST /api/menu/add
   * {
   *   "name": "用户管理",
   *   "parentId": 0,
   *   "type": 1,
   *   "perms": "system:user",
   *   "sort": 1,
   *   "status": 1
   * }
   *
   * @return {Object} 空数据，表示操作成功
   */
  async menuAdd() {
    const { ctx } = this;

    try {
      // 从请求体中获取新增菜单的数据
      // 包含菜单名称、父级ID、类型、权限标识、排序、状态等字段
      const addReq = ctx.request.body;

      // 调用服务层添加菜单，服务层会处理数据验证和父子关系
      await ctx.service.authMenu.add(addReq);

      // 返回成功响应，data为空对象
      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`SystemController.menuAdd error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 编辑菜单
   * 更新已存在菜单的信息
   *
   * 请求示例:
   * POST /api/menu/edit
   * {
   *   "id": 1,
   *   "name": "用户管理",
   *   "parentId": 0,
   *   "perms": "system:user:list",
   *   "sort": 2
   * }
   *
   * @return {Object} 空数据，表示操作成功
   */
  async menuEdit() {
    const { ctx } = this;

    try {
      // 从请求体中获取编辑菜单的数据，必须包含菜单ID
      const editReq = ctx.request.body;

      // 调用服务层更新菜单信息
      await ctx.service.authMenu.edit(editReq);

      // 返回成功响应
      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`SystemController.menuEdit error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 删除菜单
   * 根据菜单ID删除菜单项，可能需要处理子菜单的级联删除
   *
   * 请求示例:
   * POST /api/menu/delete
   * {
   *   "id": 1
   * }
   *
   * @return {Object} 空数据，表示删除成功
   */
  async menuDel() {
    const { ctx } = this;

    try {
      // 从请求体中获取要删除的菜单ID
      const id = ctx.request.body.id;

      // 调用服务层删除菜单
      // 服务层会检查是否有子菜单，避免数据不一致
      await ctx.service.authMenu.del(id);

      // 返回成功响应
      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`SystemController.menuDel error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出菜单控制器类，供路由系统调用
module.exports = SystemMenuController;
