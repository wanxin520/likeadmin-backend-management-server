'use strict';

/**
 * post.js 是岗位管理模块的控制器文件，主要负责处理系统中岗位相关的所有业务
 * 逻辑，包括岗位的增删改查等操作。
 */

// 引入基础控制器，继承通用方法
const baseController = require('../baseController');

/**
 * 系统岗位控制器
 * 负责处理岗位管理的所有业务逻辑
 * 包括岗位列表、新增、编辑、删除、详情查询等功能
 */
class SystemPostController extends baseController {

  /**
   * 获取岗位列表
   * 支持分页和查询参数
   * 路由: GET /api/system/post/list
   */
  async postList() {
    const { ctx } = this;
    try {
      // 获取查询参数，如分页信息、搜索条件等
      const params = ctx.query;

      // 调用岗位服务层获取数据
      const data = await ctx.service.authPost.list(params);

      // 返回标准化响应
      this.result({
        data,
      });
    } catch (err) {
      // 记录错误日志
      ctx.logger.error(`SystemAuthPostController.postList error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 新增岗位
   * 创建新的岗位信息
   * 路由: POST /api/system/post/add
   */
  async postAdd() {
    const { ctx } = this;
    const { authPost } = ctx.service;

    try {
      // 获取请求体中的岗位数据
      const addReq = ctx.request.body;

      // 调用服务层新增岗位
      const data = await authPost.add(addReq);

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
   * 获取岗位详情
   * 根据岗位ID查询详细信息
   * 路由: GET /api/system/post/detail
   */
  async postDetail() {
    const { ctx } = this;
    const { authPost } = ctx.service;

    try {
      // 从查询参数中获取岗位ID
      const id = ctx.request.query.id;

      // 调用服务层获取岗位详情
      const data = await authPost.detail(id);

      // 返回岗位详情
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
   * 编辑岗位信息
   * 更新现有岗位的数据
   * 路由: POST /api/system/post/edit
   */
  async postEdit() {
    const { ctx } = this;
    const { authPost } = ctx.service;

    try {
      // 获取编辑请求数据
      const editReq = ctx.request.body;

      // 调用服务层更新岗位信息
      await authPost.edit(editReq);

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
   * 删除岗位
   * 根据岗位ID删除岗位信息
   * 路由: POST /api/system/post/delete
   */
  async postDel() {
    const { ctx } = this;
    const { authPost } = ctx.service;

    try {
      // 从请求体中获取要删除的岗位ID
      const id = ctx.request.body.id;

      // 调用服务层删除岗位
      await authPost.del(id);

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
   * 获取所有岗位
   * 用于下拉选择等场景，返回所有可用的岗位
   * 路由: GET /api/system/post/all
   */
  async postAll() {
    const { ctx } = this;
    const { authPost } = ctx.service;

    try {
      // 调用服务层获取所有岗位数据
      const data = await authPost.all();

      // 返回岗位列表
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
}

// 导出控制器类
module.exports = SystemPostController;
