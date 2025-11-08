'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;
const Sequelize = require('sequelize');
const Op = Sequelize.Op; // Sequelize操作符

/**
 * 岗位管理服务类
 * 功能：处理系统岗位的增删改查、业务验证等
 * 岗位用于组织架构中的职位管理，与管理员关联
 */
class AuthPostService extends Service {

  /**
   * 获取岗位列表（分页）
   * @param {Object} listReq 请求参数 {pageNo, pageSize, name, isStop, code}
   * @return {Object} 分页结果 {pageNo, pageSize, count, lists}
   */
  async list(listReq) {
    const { ctx } = this;
    try {
      const postModel = ctx.model.SystemAuthPost;
      // 计算分页参数
      const limit = parseInt(listReq.pageSize, 10);
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      // 解构请求参数
      const { name, isStop, code } = listReq;
      const params = { name, isStop, code };

      // 构建查询条件 - 只查询未删除的岗位
      const where = {
        isDelete: 0,
      };

      // 动态构建查询条件
      for (const paramKey in params) {
        if (paramKey === 'isStop' && params[paramKey]) {
          // 对于isStop字段，使用精确匹配（启用/停用状态）
          where[paramKey] = params[paramKey];
        } else {
          // 其他字段使用模糊查询
          where[paramKey] = { [Op.like]: `%${params[paramKey]}%` };
        }
      }

      // 查询岗位数据（分页）
      const postQuery = postModel.findAll({
        where: { ...where },
        order: [[ 'id', 'DESC' ]], // 按ID降序排列
        limit,
        offset,
      });

      const posts = await postQuery;
      // 转换为JSON格式
      const postResps = posts.map(post => post.toJSON());

      // 获取总数
      const count = await postModel.count({
        where: { ...where },
      });

      // 返回分页结果
      return {
        pageNo: listReq.pageNo,
        pageSize: listReq.pageSize,
        count,
        lists: postResps,
      };
    } catch (err) {
      throw new Error(`AuthPostService.list error: ${err}`);
    }
  }

  /**
   * 获取岗位详情
   * @param {number} id 岗位ID
   * @return {Object} 岗位详细信息
   */
  async detail(id) {
    const { ctx } = this;
    const { SystemAuthPost } = ctx.model;

    try {
      // 查询岗位详情
      const post = await SystemAuthPost.findOne({
        where: {
          id,
          isDelete: 0, // 确保岗位未被删除
        },
      });

      if (!post) {
        throw new Error('岗位不存在!');
      }

      // 返回JSON格式数据
      const res = post.toJSON();

      return res;
    } catch (err) {
      throw new Error('Get Post Detail error');
    }
  }

  /**
   * 添加岗位
   * @param {Object} addReq 岗位信息 {name, code, sort, isStop, remark等}
   */
  async add(addReq) {
    const { ctx } = this;
    const { SystemAuthPost } = ctx.model;

    // 生成时间戳
    const dateTime = Math.floor(Date.now() / 1000);
    const timeObject = {
      createTime: dateTime,
      updateTime: dateTime,
    };

    // 移除ID字段，避免前端传入
    delete addReq.id;

    // 合并时间参数
    Object.assign(addReq, timeObject);

    try {
      // 检查岗位编码或名称是否已存在
      const existingPost = await SystemAuthPost.findOne({
        where: {
          [Op.or]: [ // 使用OR条件，检查编码或名称任一重复
            { code: addReq.code },
            { name: addReq.name },
          ],
          isDelete: 0, // 只检查未删除的岗位
        },
      });

      if (existingPost) {
        throw new Error('该岗位已存在!');
      }

      // 构建岗位实例
      const post = SystemAuthPost.build(addReq);

      // 保存到数据库
      await post.save();

      return;
    } catch (err) {
      throw new Error('Add Post error');
    }
  }

  /**
   * 编辑岗位信息
   * @param {Object} editReq 编辑请求参数 {id, name, code, sort, isStop, remark等}
   */
  async edit(editReq) {
    const { ctx } = this;
    const { SystemAuthPost } = ctx.model;

    try {
      // 查找要编辑的岗位
      const post = await SystemAuthPost.findOne({
        where: {
          id: editReq.id,
          isDelete: 0,
        },
      });

      if (!post) {
        throw new Error('岗位不存在!');
      }

      // 检查岗位编码或名称是否与其他岗位重复（排除自己）
      const existingPost = await SystemAuthPost.findOne({
        where: {
          [Op.or]: [
            { code: editReq.code },
            { name: editReq.name },
          ],
          id: {
            [Op.ne]: editReq.id, // 不等于当前ID（排除自己）
          },
          isDelete: 0,
        },
      });

      if (existingPost) {
        throw new Error('该岗位已存在!');
      }

      // 更新岗位属性
      Object.assign(post, editReq);

      // 保存更改
      await post.save();

      return;
    } catch (err) {
      throw new Error('Edit Post error');
    }
  }

  /**
   * 删除岗位（软删除）
   * @param {number} id 岗位ID
   */
  async del(id) {
    const { ctx } = this;
    const { SystemAuthPost, SystemAuthAdmin } = ctx.model;

    try {
      // 查找要删除的岗位
      const post = await SystemAuthPost.findOne({
        where: {
          id,
          isDelete: 0,
        },
      });

      if (!post) {
        throw new Error('岗位不存在!');
      }

      // 检查岗位是否被管理员使用
      const admin = await SystemAuthAdmin.findOne({
        where: {
          postId: id, // 岗位ID关联的管理员
          isDelete: 0, // 未删除的管理员
        },
      });

      // 如果岗位已被使用，不允许删除
      if (admin) {
        throw new Error('该岗位已被管理员使用，请先移除!');
      }

      // 执行软删除
      post.isDelete = 1;

      await post.save();

      return;
    } catch (err) {
      throw new Error('Delete Post error');
    }
  }

  /**
   * 获取所有岗位列表（不分页）
   * @return {Array} 所有岗位列表
   */
  async all() {
    const { ctx } = this;
    const { SystemAuthPost } = ctx.model;

    try {
      // 查询所有未删除的岗位
      const posts = await SystemAuthPost.findAll({
        where: {
          isDelete: 0,
        },
        order: [
          [ 'sort', 'DESC' ], // 按排序字段降序
          [ 'id', 'DESC' ], // 按ID降序
        ],
      });

      // 转换为JSON格式
      const res = posts.map(post => post.toJSON());

      return res;
    } catch (err) {
      throw new Error('Get All Posts error');
    }
  }
}

// 导出服务类
module.exports = AuthPostService;
