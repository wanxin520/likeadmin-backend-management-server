'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;
const Sequelize = require('sequelize');
const Op = Sequelize.Op; // Sequelize操作符
const { backstageRolesKey } = require('../extend/config'); // Redis角色权限缓存键

/**
 * 角色管理服务类
 * 功能：处理系统角色的增删改查、角色权限分配、成员统计等
 * 角色是RBAC权限体系的核心，关联菜单权限和用户
 */
class AuthRoleService extends Service {

  /**
   * 获取所有角色列表（不分页）
   * @return {Array} 所有角色列表
   */
  async all() {
    const { ctx } = this;
    try {
      const roleModel = ctx.model.SystemAuthRole;
      // 查询所有角色，按排序字段和ID降序排列
      const roles = await roleModel.findAll({
        order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
      });

      // 转换为JSON格式
      const res = roles.map(role => role.toJSON());
      return res;
    } catch (err) {
      throw new Error(`AuthRoleService.all error: ${err}`);
    }
  }

  /**
   * 获取角色列表（分页）
   * @param {Object} page 分页参数 {pageNo, pageSize}
   * @return {Object} 分页结果 {pageNo, pageSize, count, lists}
   */
  async list(page) {
    const { ctx } = this;
    const { SystemAuthRole } = ctx.model;

    try {
      // 计算分页参数
      const limit = parseInt(page.pageSize, 10);
      const offset = page.pageSize * (page.pageNo - 1);

      // 查询角色数据（分页）
      const roleModel = await SystemAuthRole.findAndCountAll({
        limit,
        offset,
        order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
      });

      // 处理查询结果
      const [ roles, count ] = await Promise.all([
        roleModel.rows.map(role => role.toJSON()),
        roleModel.count,
      ]);

      // 为每个角色添加成员数量和菜单信息
      const roleResp = await Promise.all(
        roles.map(async role => {
          const { id, name, sort, isDisable, createTime, updateTime, remark } = role;
          // 获取角色成员数量
          const member = await this.getMemberCnt(role.id);

          return {
            id,
            name,
            sort,
            isDisable,
            createTime,
            updateTime,
            remark,
            menus: [], // 菜单列表（此处为空，详情接口会填充）
            member, // 成员数量
          };
        })
      );

      return {
        pageNo: page.pageNo,
        pageSize: page.pageSize,
        count,
        lists: roleResp,
      };
    } catch (err) {
      throw new Error('List Find err');
    }
  }

  /**
   * 根据角色ID获取成员数量
   * @param {number} roleId 角色ID
   * @return {number} 成员数量
   */
  async getMemberCnt(roleId) {
    const { ctx } = this;
    const { SystemAuthAdmin } = ctx.model;

    try {
      // 使用FIND_IN_SET函数查询包含指定角色ID的管理员
      // 因为角色字段可能包含多个角色ID（逗号分隔）
      const count = await SystemAuthAdmin.count({
        where: {
          role: {
            [Op.and]: [
              Sequelize.literal(`FIND_IN_SET('${roleId}', role) > 0`),
            ],
          },
          isDelete: 0, // 未删除的管理员
        },
      });

      return count;
    } catch (err) {
      throw new Error('Get Member Count error');
    }
  }

  /**
   * 获取角色详情（包含菜单权限和成员数量）
   * @param {number} id 角色ID
   * @return {Object} 角色详细信息
   */
  async detail(id) {
    const { ctx } = this;
    const { response } = ctx;

    // 查询角色基本信息
    const role = await ctx.model.SystemAuthRole.findOne({
      where: {
        id,
      },
    });

    if (!role) {
      throw response.CheckErrDBNotRecord('角色已不存在!');
    }

    const res = role.toJSON();

    // 获取角色成员数量
    const member = await this.getMemberCnt(role.id);
    // 获取角色菜单权限ID列表
    const menus = await ctx.service.authAdmin.selectMenuIdsByRoleId(role.id);

    return {
      ...res,
      member, // 成员数量
      menus, // 菜单权限ID列表
    };
  }

  /**
   * 添加角色
   * @param {Object} addReq 角色信息 {name, sort, isDisable, remark, menuIds}
   */
  async add(addReq) {
    const { ctx } = this;
    // 移除ID字段，避免前端传入
    delete addReq.id;

    // 生成时间戳
    const dateTime = Math.floor(Date.now() / 1000);
    const timeObject = {
      createTime: dateTime,
      updateTime: dateTime,
    };

    // 检查角色名称是否已存在
    const existingRole = await ctx.model.SystemAuthRole.findOne({
      where: {
        name: addReq.name.trim(),
      },
    });

    if (existingRole) {
      throw new Error('角色名称已存在!');
    }

    // 构建角色数据
    const role = {
      ...addReq,
      ...timeObject,
    };

    // 创建数据库事务，确保数据一致性
    const transaction = await ctx.model.transaction();

    try {
      // 创建角色记录
      const createdRole = await ctx.model.SystemAuthRole.create(role, { transaction });

      // 批量保存角色菜单权限
      await ctx.service.authAdmin.batchSaveByMenuIds(createdRole.id, addReq.menuIds, transaction);

      // 提交事务
      await transaction.commit();
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * 编辑角色信息
   * @param {Object} editReq 编辑请求参数 {id, name, sort, isDisable, remark, menuIds}
   */
  async edit(editReq) {
    const { ctx } = this;

    // 检查角色是否存在
    const existingRole = await ctx.model.SystemAuthRole.findOne({
      where: {
        id: editReq.id,
      },
    });

    if (!existingRole) {
      throw new Error('角色已不存在!');
    }

    // 检查角色名称是否与其他角色重复（排除自己）
    const role = await ctx.model.SystemAuthRole.findOne({
      where: {
        id: { [Op.ne]: editReq.id }, // 不等于当前ID
        name: editReq.name.trim(),
      },
    });

    if (role) {
      throw new Error('角色名称已存在!');
    }

    const roleMap = {
      ...editReq,
    };

    // 创建数据库事务
    const transaction = await ctx.model.transaction();

    try {
      // 更新角色基本信息
      await existingRole.update(roleMap, { transaction });

      // 更新角色菜单权限：先删除旧的，再添加新的
      await ctx.service.authAdmin.batchDeleteByRoleId(editReq.id, transaction);
      await ctx.service.authAdmin.batchSaveByMenuIds(editReq.id, editReq.menuIds, transaction);

      // 更新角色权限缓存
      await ctx.service.authAdmin.cacheRoleMenusByRoleId(editReq.id);

      // 提交事务
      await transaction.commit();
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * 删除角色
   * @param {number} id 角色ID
   */
  async del(id) {
    const { ctx } = this;

    // 检查角色是否存在
    const existingRole = await ctx.model.SystemAuthRole.findOne({
      where: {
        id,
      },
    });

    if (!existingRole) {
      throw new Error('角色已不存在!');
    }

    // 检查角色是否被管理员使用
    const admin = await ctx.model.SystemAuthAdmin.findOne({
      where: {
        role: {
          [Op.and]: [
            Sequelize.literal(`FIND_IN_SET('${id}', role) > 0`),
          ],
        },
        isDelete: 0, // 未删除的管理员
      },
    });

    // 如果角色已被使用，不允许删除
    if (admin) {
      throw new Error('角色已被管理员使用,请先移除!');
    }

    // 创建数据库事务
    const transaction = await ctx.model.transaction();

    try {
      // 删除角色记录
      await existingRole.destroy({ transaction });

      // 删除角色菜单权限关联
      await ctx.service.authAdmin.batchDeleteByRoleId(id, transaction);

      // 删除Redis中的角色权限缓存
      await ctx.service.redis.hDel(backstageRolesKey, id.toString());

      // 提交事务
      await transaction.commit();
    } catch (err) {
      throw new Error(err);
    }
  }
}

// 导出服务类
module.exports = AuthRoleService;
