'use strict';

/**
 * 管理员管理控制器
 * 功能: 处理系统管理员的CRUD操作、个人信息管理、权限查询等
 * 位置: app/controller/system/admin.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 系统管理 - 管理员管理
 * 管理员类型说明:
 *   - 超级管理员(id=1): 拥有所有权限，不可删除
 *   - 普通管理员: 根据分配的角色拥有相应权限
 */
const baseController = require('../baseController');
// 引入配置常量
const {
  reqAdminIdKey, // 会话中存储管理员ID的键名
} = require('../../extend/config');
// 引入Sequelize操作符
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
// 引入URL工具类，用于处理头像地址的绝对路径转换
const urlUtil = require('../../util/urlUtil');

class SystemAdminController extends baseController {

  /**
   * 获取管理员列表（分页）
   * 接口地址: GET /api/system/admin/list
   * 功能: 分页查询管理员列表，支持搜索和筛选
   * 权限: 需要管理员权限
   * 请求参数:
   *   - page: 页码（可选，默认1）
   *   - pageSize: 每页数量（可选，默认10）
   *   - username: 用户名搜索关键词（可选）
   *   - nickname: 昵称搜索关键词（可选）
   *   - role: 角色ID筛选（可选）
   * 返回数据: 管理员列表，包含分页信息和关联的角色、部门信息
   */
  async adminList() {
    const { ctx } = this;
    try {
      // 从URL查询字符串获取分页和搜索参数
      const params = ctx.query;
      // 调用管理员服务层获取管理员列表
      const data = await ctx.service.authAdmin.adminList(params);
      // 返回分页数据
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理
      ctx.logger.error(`SystemController error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取当前登录管理员信息
   * 接口地址: GET /api/system/admin/self
   * 功能: 获取当前登录管理员的详细信息和个人权限
   * 权限: 需要登录认证
   * 请求参数: 无
   * 返回数据: 当前管理员的详细信息和权限列表
   * 数据结构:
   *   {
   *     user: {管理员基本信息},
   *     permissions: [权限标识数组]
   *   }
   * 特殊处理:
   *   - 超级管理员(id=1)返回所有权限['*']
   *   - 普通管理员返回其角色对应的菜单权限
   */
  async self() {
    const { ctx } = this;
    // 获取数据模型和服务引用
    const SystemAuthAdmin = ctx.model.SystemAuthAdmin;
    const SystemAuthMenu = ctx.model.SystemAuthMenu;
    const authAdminService = ctx.service.authAdmin;
    // 从会话中获取当前管理员ID
    const adminId = ctx.session[reqAdminIdKey];

    try {
      // 查询当前管理员的基本信息
      const sysAdmin = await SystemAuthAdmin.findOne({
        where: {
          id: adminId,
          isDelete: 0, // 只查询未删除的管理员
        },
        // 选择需要的字段，排除密码等敏感信息
        attributes: [ 'id', 'nickname', 'nickname', 'avatar', 'role', 'deptId', 'isMultipoint', 'isDisable', 'lastLoginIp', 'lastLoginTime', 'createTime', 'updateTime' ],
      });

      // 如果管理员不存在，返回空
      if (!sysAdmin) {
        return null;
      }

      let auths = []; // 权限标识数组

      // 如果不是超级管理员(id>1)，查询其角色对应的权限
      if (adminId > 1) {
        const roleId = parseInt(sysAdmin.role, 10);
        // 获取角色对应的菜单ID列表
        const menuIds = await authAdminService.selectMenuIdsByRoleId(roleId);

        if (menuIds.length > 0) {
          // 查询有效的菜单权限
          const menus = await SystemAuthMenu.findAll({
            where: {
              id: {
                [Op.in]: menuIds, // 在菜单ID列表中
              },
              isDisable: 0, // 未禁用的菜单
              menuType: [ 'C', 'A' ], // 菜单类型：C-菜单，A-按钮
            },
            order: [[ 'menuSort', 'ASC' ], [ 'id', 'ASC' ]], // 按排序号和ID排序
          });

          if (menus.length > 0) {
            // 提取权限标识并去除空格
            auths = menus.map(menu => menu.perms.trim());
          }
        }
      } else {
        // 超级管理员拥有所有权限
        auths = [ '*' ];
      }

      // 构建返回数据
      const admin = {
        user: {
          ...sysAdmin.toJSON(), // 管理员基本信息
          dept: sysAdmin.deptId.toString(), // 部门ID转换为字符串
          avatar: urlUtil.toAbsoluteUrl(sysAdmin.avatar), // 头像地址转为绝对URL
        },
        permissions: auths, // 权限列表
      };

      this.result({
        data: admin,
      });
    } catch (err) {
      ctx.logger.error(err);
      return null;
    }
  }

  /**
   * 获取管理员详情
   * 接口地址: GET /api/system/admin/detail
   * 功能: 根据ID获取指定管理员的详细信息
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 管理员ID（必填）
   * 返回数据: 管理员的详细信息
   * 注意: 返回数据中排除密码等敏感信息
   */
  async detail() {
    const { ctx } = this;
    const { authAdmin } = ctx.service;

    try {
      // 从查询参数获取管理员ID
      const id = ctx.query.id;

      // 调用服务层获取管理员详情
      const data = await authAdmin.detail(id);

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
   * 添加管理员
   * 接口地址: POST /api/system/admin/add
   * 功能: 创建新的管理员账号
   * 权限: 需要管理员权限
   * 请求参数:
   *   - username: 用户名（必填，唯一）
   *   - password: 密码（必填，6-20位）
   *   - nickname: 昵称（必填，唯一）
   *   - role: 角色ID（必填）
   *   - deptId: 部门ID（可选）
   *   - avatar: 头像地址（可选）
   *   - isMultipoint: 是否允许多点登录（可选，0-否，1-是）
   * 返回数据: 空对象，表示操作成功
   * 业务流程: 验证用户名和昵称唯一性 -> 密码加密 -> 保存到数据库
   */
  async add() {
    const { ctx } = this;
    const { authAdmin } = ctx.service;

    try {
      // 获取添加管理员的请求参数
      const addReq = ctx.request.body;

      // 调用服务层添加管理员
      await authAdmin.add(addReq);

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
   * 编辑管理员信息
   * 接口地址: POST /api/system/admin/edit
   * 功能: 更新管理员的基本信息（不包括密码）
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 管理员ID（必填）
   *   - username: 用户名（可选）
   *   - nickname: 昵称（可选）
   *   - role: 角色ID（可选）
   *   - deptId: 部门ID（可选）
   *   - avatar: 头像地址（可选）
   *   - isMultipoint: 是否允许多点登录（可选）
   * 返回数据: 空对象，表示操作成功
   * 特殊规则:
   *   - 不能修改超级管理员(id=1)的用户名
   *   - 修改后更新Redis缓存
   */
  async edit() {
    const { ctx } = this;
    const { authAdmin } = ctx.service;

    try {
      // 获取编辑管理员的请求参数
      const editReq = ctx.request.body;

      // 调用服务层更新管理员信息
      await authAdmin.edit(editReq);

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
   * 更新当前管理员个人信息
   * 接口地址: POST /api/system/admin/upInfo
   * 功能: 当前登录管理员更新自己的个人信息（包括密码）
   * 权限: 需要登录认证
   * 请求参数:
   *   - nickname: 昵称（可选）
   *   - avatar: 头像地址（可选）
   *   - currPassword: 当前密码（修改密码时必填）
   *   - password: 新密码（修改密码时必填）
   * 返回数据: 空对象，表示操作成功
   * 安全机制:
   *   - 修改密码需要验证当前密码
   *   - 密码修改后强制注销所有登录设备
   */
  async update() {
    const { ctx } = this;
    const { authAdmin } = ctx.service;

    try {
      // 获取更新个人信息的请求参数
      const editReq = ctx.request.body;

      // 调用服务层更新个人信息
      await authAdmin.update(editReq);

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
   * 删除管理员
   * 接口地址: POST /api/system/admin/del
   * 功能: 软删除指定的管理员账号
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 管理员ID（必填）
   * 返回数据: 空对象，表示操作成功
   * 业务规则:
   *   - 不能删除超级管理员(id=1)
   *   - 不能删除自己
   *   - 使用软删除，设置isDelete=1
   */
  async del() {
    const { ctx } = this;
    const { authAdmin } = ctx.service;

    try {
      // 从请求体获取要删除的管理员ID
      const id = ctx.request.body.id;

      // 调用服务层删除管理员
      await authAdmin.del(id);

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
   * 禁用/启用管理员
   * 接口地址: POST /api/system/admin/disable
   * 功能: 切换管理员账号的启用状态
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 管理员ID（必填）
   * 返回数据: 空对象，表示操作成功
   * 业务规则:
   *   - 不能禁用自己
   *   - 状态切换：0-启用，1-禁用
   *   - 禁用后该管理员无法登录系统
   */
  async disable() {
    const { ctx } = this;
    const { authAdmin } = ctx.service;

    try {
      // 从请求体获取要操作的管理员ID
      const id = ctx.request.body.id;

      // 调用服务层切换管理员状态
      await authAdmin.disable(id);

      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(err);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出管理员控制器类
module.exports = SystemAdminController;
