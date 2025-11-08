'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;
// 引入配置常量
const { backstageManageKey, backstageRolesKey, reqAdminIdKey, superAdminId, backstageTokenKey, backstageTokenSet } = require('../extend/config');
const parser = require('ua-parser-js'); // User-Agent解析器
const Sequelize = require('sequelize');
const Op = Sequelize.Op; // Sequelize操作符
const util = require('../util'); // 自定义工具函数
const urlUtil = require('../util/urlUtil'); // URL处理工具
const md5 = require('md5'); // MD5加密库

/**
 * 管理员认证授权服务类
 * 功能：处理管理员用户认证、权限管理、角色菜单、登录日志等核心业务逻辑
 */
class AuthAdminService extends Service {

  /**
   * 缓存管理员用户信息到Redis
   * @param {number} id 管理员ID
   */
  async cacheAdminUserByUid(id) {
    const { ctx } = this;
    // 查询管理员信息
    const admin = await ctx.model.SystemAuthAdmin.findOne({
      where: {
        id,
      },
    });
    if (!admin) {
      return;
    }
    // 序列化管理员信息
    const str = await JSON.stringify(admin);
    if (!str) {
      return;
    }
    // 存储到Redis哈希表
    await ctx.service.redis.hSet(backstageManageKey, parseInt(admin.id, 10), str, 0);
  }

  /**
   * 缓存角色菜单权限到Redis
   * @param {number} roleId 角色ID
   * @return {Array} 菜单权限数组
   */
  async cacheRoleMenusByRoleId(roleId) {
    const { ctx } = this;
    try {
      // 查询角色权限关联
      const perms = await ctx.model.SystemAuthPerm.findAll({
        where: {
          roleId,
        },
      });

      // 提取菜单ID数组
      const menuIds = perms.map(perm => perm.menuId);

      // 查询有效的菜单信息
      const menus = await ctx.model.SystemAuthMenu.findAll({
        where: {
          isDisable: 0, // 未禁用的菜单
          id: {
            [Op.in]: menuIds, // 在菜单ID数组中
          },
          menuType: {
            [Op.in]: [ 'C', 'A' ], // 只包含C(目录)和A(菜单)类型
          },
        },
        order: [
          [ 'menuSort', 'ASC' ], // 按菜单排序升序
          [ 'id', 'ASC' ], // 按ID升序
        ],
      });

      // 提取权限标识符并过滤空值
      const menuArray = menus
        .filter(menu => menu.perms !== '')
        .map(menu => menu.perms.trim());

      // 缓存到Redis
      const redisKey = backstageRolesKey;
      const roleIdStr = String(roleId);
      const menuString = menuArray.join(',');

      await ctx.service.redis.hSet(redisKey, roleIdStr, menuString, 0);

      return menuArray;
    } catch (err) {
      throw new Error('CacheRoleMenusByRoleId error:' + err);
    }
  }

  /**
   * 根据角色ID获取菜单ID列表
   * @param {number} roleId 角色ID
   * @return {Array} 菜单ID数组
   */
  async selectMenuIdsByRoleId(roleId) {
    const { ctx } = this;
    const systemAuthRole = ctx.model.SystemAuthRole;
    const systemAuthPerm = ctx.model.SystemAuthPerm;
    try {
      // 验证角色是否存在且未禁用
      const role = await systemAuthRole.findOne({
        where: {
          id: roleId,
          isDisable: 0,
        },
      });
      if (!role) {
        return [];
      }

      // 查询角色权限
      const perms = await systemAuthPerm.findAll({
        where: {
          roleId: role.id,
        },
      });

      // 提取菜单ID
      const menuIds = perms.map(perm => perm.menuId);
      return menuIds;
    } catch (err) {
      throw new Error('SelectMenuIdsByRoleId error:' + err);
    }
  }

  /**
   * 根据角色ID获取菜单树形结构
   * @param {number} roleId 角色ID
   * @return {Array} 树形菜单结构
   */
  async selectMenuByRoleId(roleId) {
    const { ctx } = this;
    // 获取当前管理员ID
    const adminId = ctx.session[reqAdminIdKey];

    // 获取角色对应的菜单ID
    let menuIds = await this.selectMenuIdsByRoleId(roleId);
    if (!menuIds || menuIds.length === 0) {
      menuIds = [ 0 ]; // 如果没有菜单，设置为[0]避免SQL错误
    }

    // 构建查询条件
    const whereCondition = {
      menuType: [ 'M', 'C' ], // M-目录, C-菜单
      isDisable: 0, // 未禁用的菜单
    };

    // 如果不是超级管理员，限制只能查看有权限的菜单
    if (adminId !== superAdminId) {
      whereCondition.id = menuIds;
    }

    // 执行查询
    const menus = await ctx.model.SystemAuthMenu.findAll({
      where: whereCondition,
      order: [[ 'menuSort', 'DESC' ], [ 'id' ]],
    });

    const menuResps = menus.map(menu => menu.toJSON());

    // 转换为树形结构
    const mapList = util.listToTree(
      util.structsToMaps(menuResps),
      'id',
      'pid',
      'children'
    );
    return mapList;
  }

  /**
   * 批量保存角色菜单权限
   * @param {number} roleId 角色ID
   * @param {string} menuIds 菜单ID字符串（逗号分隔）
   * @param {Object} transaction 事务对象
   */
  async batchSaveByMenuIds(roleId, menuIds, transaction) {
    const { ctx } = this;

    if (!menuIds) {
      return;
    }

    // 分割菜单ID字符串为数组
    const menuIdArray = menuIds.split(',');

    // 构建权限对象数组
    const perms = menuIdArray.map(menuIdStr => ({
      id: util.makeUuid(), // 生成唯一ID
      roleId,
      menuId: parseInt(menuIdStr, 10),
    }));

    try {
      // 批量创建权限记录
      await ctx.model.SystemAuthPerm.bulkCreate(perms, { transaction });
    } catch (err) {
      throw new Error('BatchSaveByMenuIds Create in tx err');
    }
  }

  /**
   * 批量删除角色菜单权限
   * @param {number} roleId 角色ID
   * @param {Object} transaction 事务对象
   */
  async batchDeleteByRoleId(roleId, transaction) {
    const { ctx } = this;

    const options = {
      where: {
        roleId,
      },
    };

    // 如果有事务，添加到选项中
    if (transaction) {
      options.transaction = transaction;
    }

    try {
      await ctx.model.SystemAuthPerm.destroy(options);
    } catch (err) {
      throw new Error('BatchDeleteByRoleId Delete err');
    }
  }

  /**
   * 记录登录日志
   * @param {number} adminId 管理员ID
   * @param {string} username 用户名
   * @param {string} errStr 错误信息（为空表示登录成功）
   * @return {Object} 日志记录结果
   */
  async recordLoginLog(adminId, username, errStr) {
    const { ctx } = this;
    // 解析User-Agent信息
    const ua = parser(ctx.request.header['user-agent']);
    let status = 0; // 默认失败
    if (!errStr) {
      status = 1; // 登录成功
    }
    try {
      const params = {
        adminId,
        username,
        ip: ctx.request.ip, // 客户端IP
        os: JSON.stringify(ua.os), // 操作系统信息
        browser: JSON.stringify(ua.browser), // 浏览器信息
        status,
      };
      // 创建登录日志
      const result = await ctx.model.SystemLogLogin.create({
        ...params,
      });
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * 获取管理员列表（分页）
   * @param {Object} listReq 请求参数
   * @return {Object} 分页结果
   */
  async adminList(listReq) {
    const { ctx } = this;
    const { SystemAuthAdmin, SystemAuthDept } = ctx.model;

    try {
      // 计算分页参数
      const limit = parseInt(listReq.pageSize, 10);
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      const username = listReq.username || '';
      const nickname = listReq.nickname || '';

      const where = {};
      if (listReq.role) {
        where.role = listReq.role;
      }

      // 查询管理员列表（包含部门信息）
      const adminModel = await SystemAuthAdmin.findAndCountAll({
        where: {
          isDelete: 0, // 未删除的管理员
          username: { [Op.like]: `%${username}%` },
          nickname: { [Op.like]: `%${nickname}%` },
          ...where,
        },
        include: [
          { model: SystemAuthDept, as: 'dept', attributes: [ 'name' ] }, // 关联部门表
        ],
        limit,
        offset,
        order: [[ 'id', 'DESC' ], [ 'sort', 'DESC' ]],
        attributes: { exclude: [ 'password', 'salt', 'deleteTime', 'isDelete', 'sort' ] }, // 排除敏感字段
      });

      // 处理查询结果
      const [ adminResp, count ] = await Promise.all([
        adminModel.rows.map(admin => admin.toJSON()),
        adminModel.count,
      ]);

      // 处理每个管理员的显示信息
      for (let i = 0; i < adminResp.length; i++) {
        // 头像URL转换为绝对路径
        adminResp[i].avatar = urlUtil.toAbsoluteUrl(adminResp[i].avatar);
        // 部门名称
        adminResp[i].dept = adminResp[i].dept.name;

        // 处理角色显示
        if (adminResp[i].id === 1) {
          // 系统管理员特殊处理
          adminResp[i].role = '系统管理员';
          delete adminResp[i].authRole;
        } else {
          // 查询角色名称
          const roleIds = adminResp[i].role.split(',');
          const role = await ctx.model.SystemAuthRole.findAll({
            where: {
              id: roleIds,
            },
            attributes: [ 'name' ],
          });
          const rows = role.map(items => items.name);
          adminResp[i].role = rows;
        }
      }

      return {
        pageNo: listReq.pageNo,
        pageSize: listReq.pageSize,
        count,
        lists: adminResp,
      };
    } catch (err) {
      throw new Error('List Find err');
    }
  }

  /**
   * 获取管理员详情
   * @param {number} id 管理员ID
   * @return {Object} 管理员详情
   */
  async detail(id) {
    const { ctx } = this;
    const { SystemAuthAdmin } = ctx.model;

    try {
      const sysAdmin = await SystemAuthAdmin.findOne({
        where: {
          id,
          isDelete: 0,
        },
        attributes: { exclude: [ 'password', 'salt', 'deleteTime', 'isDelete', 'sort' ] },
      });

      if (!sysAdmin) {
        throw new Error('账号已不存在！');
      }

      const res = sysAdmin.toJSON();

      // 头像URL处理
      res.avatar = urlUtil.toAbsoluteUrl(res.avatar);

      if (!res.dept) {
        res.dept = String(res.deptId);
      }

      return res;
    } catch (err) {
      throw new Error('Get Admin Detail error');
    }
  }

  /**
   * 添加管理员
   * @param {Object} addReq 管理员信息
   */
  async add(addReq) {
    const { ctx } = this;
    const { SystemAuthAdmin, SystemAuthRole } = ctx.model;
    delete addReq.id; // 移除ID字段

    try {
      // 检查用户名是否已存在
      let sysAdmin = await SystemAuthAdmin.findOne({
        where: {
          username: addReq.username,
          isDelete: 0,
        },
      });

      if (sysAdmin) {
        throw new Error('账号已存在换一个吧！');
      }

      // 检查昵称是否已存在
      sysAdmin = await SystemAuthAdmin.findOne({
        where: {
          nickname: addReq.nickname,
          isDelete: 0,
        },
      });

      if (sysAdmin) {
        throw new Error('昵称已存在换一个吧！');
      }

      const roles = addReq.role; // 角色数组

      // 验证角色是否存在且未禁用
      const roleResps = await SystemAuthRole.findAll({
        where: {
          id: roles,
          isDisable: 0,
        },
      });

      if (roleResps.length === 0) {
        throw new Error('当前角色已被禁用!');
      }

      // 密码长度验证
      const passwdLen = addReq.password.length;
      if (!(passwdLen >= 6 && passwdLen <= 20)) {
        throw new Error('密码必须在6~20位');
      }

      // 生成盐值
      const salt = util.randomString(5);

      // 创建管理员实例
      sysAdmin = new SystemAuthAdmin();
      const dateTime = Math.floor(Date.now() / 1000);
      const timeObject = {
        createTime: dateTime,
        updateTime: dateTime,
      };

      // 合并数据
      Object.assign(sysAdmin, addReq, timeObject);

      // 设置角色、盐值和加密密码
      sysAdmin.role = String(addReq.role);
      sysAdmin.salt = salt;
      sysAdmin.password = md5(addReq.password.trim() + salt);

      // 处理头像路径
      if (!addReq.avatar) {
        addReq.avatar = '/public/static/backend_avatar.png'; // 默认头像
      } else {
        addReq.avatar = urlUtil.toRelativeUrl(addReq.avatar); // 转换为相对路径
      }

      sysAdmin.avatar = addReq.avatar;

      // 保存到数据库
      await sysAdmin.save();

      return;
    } catch (err) {
      throw new Error('Add Admin error');
    }
  }

  /**
   * 编辑管理员信息
   * @param {Object} editReq 编辑请求参数
   */
  async edit(editReq) {
    const { ctx } = this;
    const { redis } = this.app;
    const { SystemAuthAdmin, SystemAuthRole } = ctx.model;

    try {
      // 查找要编辑的管理员
      const admin = await SystemAuthAdmin.findByPk(editReq.id);

      if (!admin || admin.isDelete) {
        throw new Error('账号不存在了!');
      }

      // 检查用户名是否重复（排除自己）
      let sysAdmin = await SystemAuthAdmin.findOne({
        where: {
          username: editReq.username,
          isDelete: 0,
          id: {
            [Op.ne]: editReq.id, // 不等于当前ID
          },
        },
      });

      if (sysAdmin) {
        throw new Error('账号已存在换一个吧！');
      }

      // 检查昵称是否重复（排除自己）
      sysAdmin = await SystemAuthAdmin.findOne({
        where: {
          nickname: editReq.nickname,
          isDelete: 0,
          id: {
            [Op.ne]: editReq.id,
          },
        },
      });

      if (sysAdmin) {
        throw new Error('昵称已存在换一个吧！');
      }

      // 角色验证（非超级管理员）
      if (editReq.role > 0 && editReq.id !== 1) {
        const roleResps = await SystemAuthRole.findAll({
          where: {
            id: editReq.role,
          },
        });

        if (roleResps.length === 0) {
          throw new Error('角色不存在!');
        }
      }

      // 处理头像路径
      if (!editReq.avatar) {
        editReq.avatar = '/public/static/backend_avatar.png';
      } else {
        editReq.avatar = urlUtil.toRelativeUrl(editReq.avatar);
      }

      const adminMap = {
        ...editReq,
      };

      // 设置角色（超级管理员不允许修改角色）
      const role = editReq.role > 0 && editReq.id !== 1 ? editReq.role : 0;
      adminMap.role = String(role);

      // 超级管理员不允许修改用户名
      if (editReq.id === 1) {
        delete adminMap.username;
      }

      // 密码修改处理
      if (editReq.password) {
        const passwdLen = editReq.password.length;
        if (!(passwdLen >= 6 && passwdLen <= 20)) {
          throw new Error('密码必须在6~20位');
        }

        const salt = util.randomString(5);
        adminMap.salt = salt;
        adminMap.password = md5(editReq.password.trim() + salt);
      } else {
        delete adminMap.password;
      }

      // 更新管理员信息
      await admin.update(adminMap);

      // 更新缓存
      this.cacheAdminUserByUid(editReq.id);

      const adminId = ctx.session[reqAdminIdKey];

      // 如果修改了自己的密码，清理token缓存
      if (editReq.password && editReq.id === adminId) {
        const token = ctx.request.header.token;

        // 删除当前token
        await ctx.service.redis.del(backstageTokenKey + token);

        const adminSetKey = backstageTokenSet + String(adminId);

        // 获取所有相关token
        const ts = await redis.smembers(adminSetKey);

        if (ts.length > 0) {
          const tokenKeys = ts.map(t => backstageTokenKey + t);
          // 批量删除token
          await ctx.service.redis.del(tokenKeys);
        }

        // 删除token集合
        await ctx.service.redis.del(adminSetKey);

        // 重新添加当前token
        await redis.sadd(adminSetKey, token);
      }

      return;
    } catch (err) {
      throw new Error('Edit Admin error');
    }
  }

  /**
   * 更新当前登录管理员信息
   * @param {Object} updateReq 更新请求参数
   */
  async update(updateReq) {
    const { ctx } = this;
    const adminId = ctx.session[reqAdminIdKey];

    // 检查管理员是否存在
    const admin = await ctx.model.SystemAuthAdmin.findOne({
      where: {
        id: adminId,
        isDelete: 0,
      },
    });
    if (!admin) {
      ctx.throw(404, '账号不存在了!');
    }

    // 构建更新数据
    const adminMap = {
      ...updateReq,
    };
    delete adminMap.currPassword; // 移除当前密码字段

    // 处理头像路径
    if (!updateReq.avatar) {
      adminMap.avatar = '/public/static/backend_avatar.png';
    } else {
      adminMap.avatar = urlUtil.toRelativeUrl(updateReq.avatar);
    }

    // 密码修改处理
    if (updateReq.password) {
      // 验证当前密码
      const currPass = md5(updateReq.currPassword + admin.salt);
      if (currPass !== admin.password) {
        ctx.throw(400, '当前密码不正确!');
      }

      // 新密码长度验证
      const passwdLen = updateReq.password.length;
      if (!(passwdLen >= 6 && passwdLen <= 20)) {
        ctx.throw(400, '密码必须在6~20位');
      }

      // 生成新盐值和加密密码
      const salt = util.randomString(5);
      adminMap.salt = salt;
      adminMap.password = md5(updateReq.password.trim() + salt);
    } else {
      delete adminMap.password;
    }

    try {
      // 更新数据库
      await ctx.model.SystemAuthAdmin.update(adminMap, {
        where: {
          id: adminId,
        },
      });
    } catch (err) {
      throw new Error('更新管理员信息失败');
    }

    // 更新缓存
    this.cacheAdminUserByUid(adminId);

    // 如果更改密码，清理token缓存
    if (updateReq.password) {
      const token = ctx.request.header.token;
      await ctx.service.redis.del(backstageTokenKey + token);

      const adminSetKey = backstageTokenSet + adminId.toString();
      const ts = await ctx.service.redis.sGet(adminSetKey);

      if (ts.length > 0) {
        const tokenKeys = ts.map(t => backstageTokenKey + t);
        await ctx.service.redis.del(...tokenKeys);
      }

      await ctx.service.redis.del(adminSetKey);
      await ctx.service.redis.sSet(adminSetKey, token);
    }
  }

  /**
   * 删除管理员（软删除）
   * @param {number} id 管理员ID
   */
  async del(id) {
    const { ctx } = this;
    const adminId = ctx.session[reqAdminIdKey];

    // 查找管理员
    const admin = await ctx.model.SystemAuthAdmin.findOne({
      where: {
        id,
        isDelete: 0,
      },
    });

    if (!admin) {
      throw new Error('账号已不存在!');
    }

    // 系统管理员不允许删除
    if (id === 1) {
      throw new Error('系统管理员不允许删除!');
    }

    // 不能删除自己
    if (id === adminId) {
      throw new Error('不能删除自己!');
    }

    // 执行软删除
    await admin.update({
      isDelete: 1,
      deleteTime: Math.floor(Date.now() / 1000),
    });

    return null;
  }

  /**
   * 禁用/启用管理员
   * @param {number} id 管理员ID
   */
  async disable(id) {
    const { ctx } = this;
    const adminId = ctx.session[reqAdminIdKey];

    const admin = await ctx.model.SystemAuthAdmin.findOne({
      where: {
        id,
        isDelete: 0,
      },
    });

    if (!admin) {
      throw new Error('账号已不存在！');
    }

    // 不能禁用自己
    if (id === adminId) {
      throw new Error('不能禁用自己!');
    }

    // 切换禁用状态（0-启用, 1-禁用）
    const isDisable = admin.isDisable === 0 ? 1 : 0;

    await admin.update({
      isDisable,
      updateTime: Math.floor(Date.now() / 1000),
    });

    return null;
  }
}

// 导出服务类
module.exports = AuthAdminService;
