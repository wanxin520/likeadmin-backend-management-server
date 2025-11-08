'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;
const Sequelize = require('sequelize');
const Op = Sequelize.Op; // Sequelize操作符
const util = require('../util'); // 自定义工具函数

/**
 * 部门管理服务类
 * 功能：处理部门信息的增删改查、树形结构组织、业务验证等
 * 部门通常用于组织架构管理，支持多级部门结构
 */
class AuthDeptService extends Service {

  /**
   * 获取部门列表（树形结构）
   * @param {Object} listReq 请求参数 {name, isStop等}
   * @return {Array} 树形结构的部门列表
   */
  async list(listReq) {
    const { ctx } = this;
    try {
      // 构建查询条件 - 只查询未删除的部门
      const where = {
        isDelete: 0,
      };

      // 动态构建查询条件
      for (const paramKey in listReq) {
        if (paramKey === 'isStop' && listReq[paramKey]) {
          // 对于isStop字段，使用精确匹配
          where[paramKey] = listReq[paramKey];
        } else {
          // 其他字段使用模糊查询
          where[paramKey] = { [Op.like]: `%${listReq[paramKey]}%` };
        }
      }

      // 查询部门数据
      const deptModel = ctx.model.SystemAuthDept;
      const deptQuery = deptModel.findAll({
        where: { ...where },
        order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]], // 按排序字段和ID降序
        attributes: { exclude: [ 'deleteTime', 'isDelete' ] }, // 排除软删除相关字段
      });

      const depts = await deptQuery;
      // 转换为JSON格式
      const deptResps = depts.map(dept => dept.toJSON());

      // 将扁平列表转换为树形结构
      const mapList = util.listToTree(
        deptResps,
        'id', // ID字段名
        'pid', // 父ID字段名
        'children' // 子节点字段名
      );

      return mapList;
    } catch (err) {
      throw new Error(`AuthDeptService.list error: ${err}`);
    }
  }

  /**
   * 添加部门
   * @param {Object} addReq 部门信息 {name, pid, sort, isStop等}
   */
  async add(addReq) {
    const { ctx } = this;
    const { SystemAuthDept } = ctx.model;

    try {
      // 验证顶级部门数量限制（pid=0表示顶级部门）
      if (addReq.pid === 0) {
        const count = await SystemAuthDept.count({
          where: {
            pid: 0, // 顶级部门
            isDelete: 0, // 未删除
          },
        });

        // 顶级部门只允许有一个
        if (count > 0) {
          throw new Error('顶级部门只允许有一个!');
        }
      }

      // 生成时间戳
      const dateTime = Math.floor(Date.now() / 1000);
      const timeObject = {
        createTime: dateTime,
        updateTime: dateTime,
      };

      // 创建部门记录
      await SystemAuthDept.create({ ...timeObject, ...addReq });

      return;
    } catch (err) {
      throw new Error('Add Department error');
    }
  }

  /**
   * 获取部门详情
   * @param {number} id 部门ID
   * @return {Object} 部门详细信息
   */
  async detail(id) {
    const { ctx } = this;
    const { SystemAuthDept } = ctx.model;

    try {
      // 查询部门详情
      const dept = await SystemAuthDept.findOne({
        where: {
          id,
          isDelete: 0, // 确保部门未被删除
        },
        attributes: { exclude: [ 'deleteTime', 'isDelete' ] }, // 排除敏感字段
      });

      if (!dept) {
        throw new Error('部门已不存在!');
      }

      // 返回JSON格式数据
      return dept.toJSON();
    } catch (err) {
      throw new Error('Get Department Detail error');
    }
  }

  /**
   * 编辑部门信息
   * @param {Object} editReq 编辑请求参数 {id, name, pid, sort, isStop等}
   */
  async edit(editReq) {
    const { ctx } = this;
    const { SystemAuthDept } = ctx.model;

    try {
      // 查找要编辑的部门
      const dept = await SystemAuthDept.findOne({
        where: {
          id: editReq.id,
          isDelete: 0,
        },
      });

      if (!dept) {
        throw new Error('部门不存在!');
      }

      // 业务规则验证1：顶级部门不能修改上级部门
      if (dept.pid === 0 && editReq.pid > 0) {
        throw new Error('顶级部门不能修改上级!');
      }

      // 业务规则验证2：上级部门不能是自己
      if (editReq.id === editReq.pid) {
        throw new Error('上级部门不能是自己!');
      }

      // 更新部门信息
      Object.assign(dept, editReq);

      // 保存到数据库
      await dept.save();

      return;
    } catch (err) {
      throw new Error('Edit Department error');
    }
  }

  /**
   * 删除部门（软删除）
   * @param {number} id 部门ID
   */
  async del(id) {
    const { ctx } = this;
    const { SystemAuthDept, SystemAuthAdmin } = ctx.model;

    try {
      // 查找要删除的部门
      const dept = await SystemAuthDept.findOne({
        where: {
          id,
          isDelete: 0,
        },
      });

      if (!dept) {
        throw new Error('部门不存在!');
      }

      // 业务规则验证1：顶级部门不能删除
      if (dept.Pid === 0) {
        throw new Error('顶级部门不能删除!');
      }

      // 业务规则验证2：检查是否存在子部门
      const childDeptCount = await SystemAuthDept.count({
        where: {
          pid: id, // 以当前部门为父部门的子部门
          isDelete: 0, // 未删除的
        },
      });

      if (childDeptCount > 0) {
        throw new Error('请先删除子级部门!');
      }

      // 业务规则验证3：检查部门是否被管理员使用
      const adminCount = await SystemAuthAdmin.count({
        where: {
          deptId: id, // 属于该部门的管理员
          isDelete: 0, // 未删除的管理员
        },
      });

      if (adminCount > 0) {
        throw new Error('该部门已被管理员使用，请先移除!');
      }

      // 执行软删除
      dept.isDelete = 1;
      await dept.save();

      return;
    } catch (err) {
      throw new Error('Delete Department error');
    }
  }

  /**
   * 获取所有非顶级部门列表（扁平结构）
   * @return {Array} 部门列表
   */
  async all() {
    const { ctx } = this;
    const { SystemAuthDept } = ctx.model;

    try {
      // 查询所有非顶级部门（pid > 0）
      const depts = await SystemAuthDept.findAll({
        where: {
          pid: {
            [Op.gt]: 0, // 大于0，排除顶级部门
          },
          isDelete: 0,
        },
        order: [[ 'sort', 'DESC' ], [ 'id', 'DESC' ]],
        attributes: { exclude: [ 'deleteTime', 'isDelete' ] },
      });

      // 转换为JSON格式
      const res = depts.map(dept => dept.toJSON());

      return res;
    } catch (err) {
      throw new Error('Get All Departments error');
    }
  }
}

// 导出服务类
module.exports = AuthDeptService;
