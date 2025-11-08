'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;
const util = require('../util'); // 自定义工具函数
const { backstageRolesKey } = require('../extend/config'); // Redis角色权限缓存键

/**
 * 菜单管理服务类
 * 功能：处理系统菜单的增删改查、树形结构组织、权限缓存管理等
 * 菜单用于构建系统导航和权限控制体系
 */
class AuthMenuService extends Service {

  /**
   * 获取菜单列表（树形结构）
   * @return {Array} 树形结构的菜单列表
   */
  async list() {
    const { ctx } = this;
    const { SystemAuthMenu } = ctx.model;

    try {
      // 查询所有菜单，按菜单排序降序和ID升序排列
      const menus = await SystemAuthMenu.findAll({
        order: [[ 'menuSort', 'DESC' ], [ 'id' ]],
      });

      // 转换为JSON格式
      const menuResps = menus.map(menu => menu.toJSON());

      // 将扁平列表转换为树形结构
      const tree = util.listToTree(menuResps, 'id', 'pid', 'children');

      return tree;
    } catch (err) {
      throw new Error('list Menu error');
    }
  }

  /**
   * 获取菜单详情
   * @param {number} id 菜单ID
   * @return {Object} 菜单详细信息
   */
  async detail(id) {
    const { ctx } = this;

    // 查询指定菜单
    const menu = await ctx.model.SystemAuthMenu.findOne({
      where: {
        id,
      },
    });

    if (!menu) {
      throw new Error('菜单已不存在!');
    }

    // 返回JSON格式数据
    const res = menu.toJSON();

    return res;
  }

  /**
   * 添加菜单
   * @param {Object} addReq 菜单信息 {name, pid, menuType, perms, path, component, icon, menuSort, isDisable等}
   */
  async add(addReq) {
    const { ctx } = this;

    // 移除ID字段，避免前端传入ID
    delete addReq.id;

    // 构建菜单模型实例
    const menu = ctx.model.SystemAuthMenu.build(addReq);

    // 创建数据库事务，确保数据一致性
    const transaction = await ctx.model.transaction();

    try {
      // 保存菜单数据（在事务中执行）
      await menu.save({ transaction });

      // 提交事务
      await transaction.commit();

      // 清除Redis中的角色权限缓存，确保权限及时更新
      ctx.service.redis.del(backstageRolesKey);
    } catch (err) {
      // 如果发生错误，事务会自动回滚
      throw new Error('Add Create err');
    }
  }

  /**
   * 编辑菜单信息
   * @param {Object} editReq 编辑请求参数 {id, name, pid, menuType, perms, path, component, icon, menuSort, isDisable等}
   */
  async edit(editReq) {
    const { ctx } = this;

    // 查找要编辑的菜单
    const menu = await ctx.model.SystemAuthMenu.findOne({
      where: {
        id: editReq.id,
      },
    });

    if (!menu) {
      throw new Error('菜单已不存在!');
    }

    // 创建数据库事务
    const transaction = await ctx.model.transaction();

    try {
      // 更新菜单属性
      Object.assign(menu, editReq);

      // 保存更改（在事务中执行）
      await menu.save({ transaction });

      // 提交事务
      await transaction.commit();

      // 清除Redis中的角色权限缓存
      ctx.service.redis.del(backstageRolesKey);
    } catch (err) {
      throw new Error('Edit Updates err');
    }
  }

  /**
   * 删除菜单
   * @param {number} id 菜单ID
   */
  async del(id) {
    const { ctx } = this;

    // 查找要删除的菜单
    const menu = await ctx.model.SystemAuthMenu.findOne({
      where: {
        id,
      },
    });

    if (!menu) {
      throw new Error('菜单已不存在!');
    }

    // 创建数据库事务
    const transaction = await ctx.model.transaction();

    try {
      // 检查是否存在子菜单
      const childMenu = await ctx.model.SystemAuthMenu.findOne({
        where: {
          pid: id, // 以当前菜单为父菜单的子菜单
        },
      });

      // 如果存在子菜单，不允许删除
      if (childMenu) {
        throw new Error('请先删除子菜单再操作！');
      }

      // 删除菜单记录（在事务中执行）
      await menu.destroy({ transaction });

      // 提交事务
      await transaction.commit();
    } catch (err) {
      throw new Error('Delete Delete err');
    }
  }
}

// 导出服务类
module.exports = AuthMenuService;
