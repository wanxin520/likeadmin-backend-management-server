'use strict';

/**
 * role.js 是角色管理模块的控制器文件，主要负责处理系统中角色相关的
 * 所有业务逻辑，包括角色的增删改查、权限分配等功能。
 */

// 引入基础控制器，继承通用方法
const baseController = require('../baseController');

/**
 * 系统角色控制器
 * 负责处理角色管理的所有业务逻辑
 * 包括角色列表、新增、编辑、删除、详情查询、权限分配等功能
 */
class SystemRoleController extends baseController {

  /**
   * 获取所有角色
   * 用于下拉选择等场景，返回所有可用的角色
   * 路由: GET /api/system/role/all
   * 使用场景：用户管理中的角色分配、权限设置等
   */
  async roleAll() {
    const { ctx } = this;
    try {
      // 调用角色服务层获取所有角色数据
      const data = await ctx.service.authRole.all();

      // 返回标准化响应
      this.result({
        data,
      });
    } catch (err) {
      // 记录错误日志
      ctx.logger.error(`SystemAuthPostController.roleAll error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取角色列表
   * 支持分页和查询参数的角色列表查询
   * 路由: GET /api/system/role/list
   * 使用场景：角色管理页面展示角色列表
   */
  async roleList() {
    const { ctx } = this;
    try {
      // 获取查询参数，如分页信息、搜索条件等
      const params = ctx.query;

      // 调用角色服务层获取分页列表数据
      const data = await ctx.service.authRole.list(params);

      // 返回角色列表数据
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理和日志记录
      ctx.logger.error(`SystemController.roleList error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取角色详情
   * 根据角色ID查询角色的详细信息
   * 路由: GET /api/system/role/detail
   * 使用场景：编辑角色前的详情查看、权限分配查看
   */
  async detail() {
    const { ctx } = this;
    try {
      // 从查询参数中获取角色ID
      const id = ctx.query.id;

      // 调用服务层获取角色详细信息
      const data = await ctx.service.authRole.detail(id);

      // 返回角色详情数据
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理
      ctx.logger.error(`SystemController.detail error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 新增角色
   * 创建新的角色信息，包括角色名称、权限设置等
   * 路由: POST /api/system/role/add
   * 使用场景：创建新的角色并分配权限
   */
  async add() {
    const { ctx } = this;
    const { authRole } = ctx.service;

    try {
      // 获取请求体中的角色数据，包括角色名、权限菜单等
      const addReq = ctx.request.body;

      // 调用服务层新增角色
      const data = await authRole.add(addReq);

      // 返回操作结果
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理
      ctx.logger.error(err);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 编辑角色信息
   * 更新现有角色的数据，包括角色信息和权限设置
   * 路由: POST /api/system/role/edit
   * 使用场景：修改角色信息、重新分配权限
   */
  async edit() {
    const { ctx } = this;
    const { authRole } = ctx.service;

    try {
      // 获取编辑请求数据，包含角色ID和更新信息
      const editReq = ctx.request.body;

      // 调用服务层更新角色信息
      await authRole.edit(editReq);

      // 返回成功响应
      this.result({
        data: {},
      });
    } catch (err) {
      // 错误处理
      ctx.logger.error(err);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 删除角色
   * 根据角色ID删除角色信息
   * 路由: POST /api/system/role/delete
   * 注意：删除前需要检查是否有用户关联此角色
   */
  async del() {
    const { ctx } = this;
    const { authRole } = ctx.service;

    try {
      // 从请求体中获取要删除的角色ID
      const id = ctx.request.body.id;

      // 调用服务层删除角色
      await authRole.del(id);

      // 返回成功响应
      this.result({
        data: {},
      });
    } catch (err) {
      // 错误处理
      ctx.logger.error(err);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出角色控制器类
module.exports = SystemRoleController;
