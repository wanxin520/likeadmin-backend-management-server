'use strict';

/**
 * 部门管理控制器
 * 功能: 处理组织架构中部门的CRUD操作，包括部门列表、添加、编辑、删除等
 * 位置: app/controller/system/dept.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 系统管理 - 部门管理
 * 部门系统说明:
 *   - 支持树形结构的部门组织架构
 *   - 部门可以有父级部门，形成层级关系
 *   - 管理员可以分配到具体部门
 *   - 部门信息包含名称、排序、状态等
 */
const baseController = require('../baseController');

class SystemDeptController extends baseController {

  /**
   * 获取部门列表（树形结构）
   * 接口地址: GET /api/system/dept/list
   * 功能: 获取组织架构的部门列表，通常以树形结构返回
   * 权限: 需要管理员权限
   * 请求参数:
   *   - keyword: 部门名称搜索关键词（可选）
   *   - status: 状态筛选（可选，0-正常，1-停用）
   * 返回数据: 部门树形结构列表
   * 数据结构示例:
   *   [
   *     {
   *       id: 1,
   *       name: "总部",
   *       pid: 0,
   *       sort: 1,
   *       status: 0,
   *       children: [
   *         {
   *           id: 2,
   *           name: "技术部",
   *           pid: 1,
   *           sort: 1,
   *           status: 0
   *         }
   *       ]
   *     }
   *   ]
   */
  async deptList() {
    const { ctx } = this;
    try {
      // 从URL查询字符串获取搜索和筛选参数
      const listReq = ctx.request.query;
      // 调用部门服务层获取部门列表（通常是树形结构）
      const data = await ctx.service.authDept.list(listReq);
      // 返回部门列表数据
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理：记录错误日志并返回500错误
      ctx.logger.error(`SystemAuthDeptController.deptList error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 添加部门
   * 接口地址: POST /api/system/dept/add
   * 功能: 创建新的部门
   * 权限: 需要管理员权限
   * 请求参数:
   *   - name: 部门名称（必填）
   *   - pid: 父级部门ID（必填，0表示根部门）
   *   - sort: 排序号（可选，数字越大越靠前）
   *   - status: 状态（可选，0-正常，1-停用，默认0）
   *   - leader: 部门负责人（可选）
   *   - phone: 部门电话（可选）
   *   - email: 部门邮箱（可选）
   * 返回数据: 操作结果，可能包含新部门的ID
   * 业务规则:
   *   - 部门名称在同一层级下必须唯一
   *   - 父级部门必须存在且未停用
   */
  async deptAdd() {
    const { ctx } = this;
    // 获取部门服务引用
    const { authDept } = ctx.service;

    try {
      // 获取添加部门的请求参数
      const addReq = ctx.request.body;

      // 调用服务层添加部门，返回操作结果
      const data = await authDept.add(addReq);

      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(err);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取部门详情
   * 接口地址: GET /api/system/dept/detail
   * 功能: 根据ID获取指定部门的详细信息
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 部门ID（必填）
   * 返回数据: 部门的详细信息
   * 数据内容:
   *   - 部门基本信息（名称、父级ID、排序等）
   *   - 部门负责人信息
   *   - 联系信息
   *   - 状态信息
   */
  async deptDetail() {
    const { ctx } = this;
    const { authDept } = ctx.service;

    try {
      // 从查询参数获取部门ID
      const id = ctx.request.query.id;

      // 调用服务层获取部门详情
      const data = await authDept.detail(id);

      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(err);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 编辑部门信息
   * 接口地址: POST /api/system/dept/edit
   * 功能: 更新部门的基本信息
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 部门ID（必填）
   *   - name: 部门名称（可选）
   *   - pid: 父级部门ID（可选）
   *   - sort: 排序号（可选）
   *   - status: 状态（可选）
   *   - leader: 部门负责人（可选）
   *   - phone: 部门电话（可选）
   *   - email: 部门邮箱（可选）
   * 返回数据: 空对象，表示操作成功
   * 业务规则:
   *   - 不能将部门设置为自己的子部门（避免循环引用）
   *   - 修改父级部门时需要更新所有子部门的层级关系
   *   - 停用部门时，其子部门也会被停用
   */
  async deptEdit() {
    const { ctx } = this;
    const { authDept } = ctx.service;

    try {
      // 获取编辑部门的请求参数
      const editReq = ctx.request.body;

      // 调用服务层更新部门信息
      await authDept.edit(editReq);

      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(err);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 删除部门
   * 接口地址: POST /api/system/dept/del
   * 功能: 删除指定的部门
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 部门ID（必填）
   * 返回数据: 空对象，表示操作成功
   * 业务规则:
   *   - 如果部门下有子部门，不能直接删除（需要先删除子部门）
   *   - 如果部门下有关联的管理员，不能直接删除（需要先转移管理员）
   *   - 通常使用软删除，设置删除标志位
   */
  async deptDel() {
    const { ctx } = this;
    const { authDept } = ctx.service;

    try {
      // 从请求体获取要删除的部门ID
      const id = ctx.request.body.id;

      // 调用服务层删除部门
      await authDept.del(id);

      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(err);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取所有部门（简单列表）
   * 接口地址: GET /api/system/dept/all
   * 功能: 获取所有部门的简单列表，用于下拉选择等场景
   * 权限: 需要登录认证
   * 请求参数: 无
   * 返回数据: 部门简单列表（通常只包含id和name）
   * 使用场景:
   *   - 管理员分配部门时的下拉选择
   *   - 部门选择器组件的数据源
   *   - 其他需要部门列表的界面
   */
  async deptAll() {
    const { ctx } = this;
    const { authDept } = ctx.service;

    try {
      // 调用服务层获取所有部门的简单列表
      const data = await authDept.all();

      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(err);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出部门控制器类
module.exports = SystemDeptController;
