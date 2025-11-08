'use strict';

/**
 * log.js - 系统操作日志服务模块
 *
 * 功能：处理系统操作日志的查询、分页和多条件筛选功能
 * 负责记录和管理用户在系统中的各种操作行为，便于审计和问题追踪
 *
 * 核心特性：
 * - 操作日志分页查询
 * - 多维度条件筛选（时间、用户、IP、操作类型等）
 * - 关联管理员信息查询
 * - 异常处理和错误日志记录
 */

// 引入 Egg.js 的 Service 基类，用于创建服务层类
const Service = require('egg').Service;
// 引入 Sequelize ORM 库
const Sequelize = require('sequelize');
// 引入 Sequelize 操作符，用于构建复杂的查询条件
const Op = Sequelize.Op;

/**
 * 日志服务类
 * 继承自 Egg.js 的 Service 基类，专门处理操作日志相关的业务逻辑
 *
 * @class LogService
 * @extends Service
 *
 * 主要职责：
 * 1. 提供操作日志的查询接口
 * 2. 实现多条件组合筛选
 * 3. 处理分页逻辑
 * 4. 关联查询管理员信息
 * 5. 异常处理和错误抛出
 */
class LogService extends Service {

  /**
   * 获取操作日志列表（分页 + 多条件筛选）
   *
   * @param {Object} listReq - 查询请求参数对象
   * @param {string} [listReq.title] - 操作标题模糊搜索
   * @param {string} [listReq.ip] - 操作IP地址模糊搜索
   * @param {string} [listReq.type] - 操作类型精确匹配
   * @param {string} [listReq.status] - 操作状态精确匹配
   * @param {string} [listReq.url] - 操作URL精确匹配
   * @param {number} [listReq.startTime] - 开始时间戳（创建时间范围查询）
   * @param {number} [listReq.endTime] - 结束时间戳（创建时间范围查询）
   * @param {string} [listReq.username] - 操作用户名模糊搜索（关联管理员表）
   * @param {number} listReq.pageNo - 页码（从1开始）
   * @param {number} listReq.pageSize - 每页记录数
   *
   * @return {Promise<Object>} 返回分页查询结果对象
   * @return {number} return.pageNo - 当前页码
   * @return {number} return.pageSize - 每页记录数
   * @return {number} return.count - 总记录数
   * @return {Array} return.lists - 日志记录数组
   *
   * @throws {Error} 当数据库查询异常时抛出错误
   *
   * @使用场景
   * - 系统管理 -> 操作日志页面
   * - 审计追踪 -> 用户行为分析
   * - 问题排查 -> 操作历史查询
   *
   * @示例
   * const result = await logService.operate({
   *   pageNo: 1,
   *   pageSize: 20,
   *   title: '用户',
   *   startTime: 1634000000,
   *   endTime: 1634000000
   * });
   */
  async operate(listReq) {
    // 从 Egg.js 应用中获取模型实例
    const { app } = this;
    // 解构获取操作日志模型和管理员模型
    const { SystemLogOperate, SystemAuthAdmin } = app.model;

    try {
      // ==================== 分页参数处理 ====================
      // 将每页记录数转换为整数，确保类型安全
      const limit = parseInt(listReq.pageSize, 10);
      // 计算偏移量：offset = pageSize * (pageNo - 1)
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      // ==================== 构建查询条件 ====================
      /**
       * 使用对象展开运算符动态构建查询条件
       * 只有参数存在时才添加对应的查询条件，实现灵活的条件组合
       */
      const where = {
        // 操作标题模糊查询：支持部分匹配
        ...(listReq.title && { title: { [Op.like]: `%${listReq.title}%` } }),

        // IP地址模糊查询：支持部分IP段搜索
        ...(listReq.ip && { ip: { [Op.like]: `%${listReq.ip}%` } }),

        // 操作类型精确匹配：如 'login', 'create', 'update', 'delete' 等
        ...(listReq.type && { type: listReq.type }),

        // 操作状态精确匹配：如 'success', 'failed' 等
        ...(listReq.status && { status: listReq.status }),

        // 操作URL精确匹配：完整的请求路径
        ...(listReq.url && { url: listReq.url }),

        // 创建时间范围查询：支持按时间段筛选日志
        ...(listReq.startTime && listReq.endTime && {
          createTime: {
            [Op.gte]: listReq.startTime, // 大于等于开始时间
            [Op.lte]: listReq.endTime, // 小于等于结束时间
          },
        }),

        /**
         * 关联查询条件：在管理员表中模糊搜索用户名
         * '$admin.username$' 是 Sequelize 的关联查询语法
         * 表示查询关联的 admin 模型的 username 字段
         */
        ...(listReq.username && { '$admin.username$': { [Op.like]: `%${listReq.username}%` } }),
      };

      // ==================== 执行数据库查询 ====================
      /**
       * 使用 Sequelize 的 findAndCountAll 方法
       * 该方法同时返回查询结果和总记录数，优化分页查询性能
       */
      const logModel = await SystemLogOperate.findAndCountAll({
        // 查询条件
        where,
        // 关联查询：包含管理员信息
        include: [
          {
            model: SystemAuthAdmin, // 关联管理员模型
            as: 'admin', // 关联别名
          },
        ],
        // 分页参数
        limit, // 每页记录数
        offset, // 偏移量
        // 排序规则：按ID降序，最新的日志显示在前面
        order: [[ 'id', 'DESC' ]],
      });

      // ==================== 处理查询结果 ====================
      // 解构查询结果：count 为总记录数，rows 为当前页数据
      const { count, rows } = logModel;

      // 构建标准化的分页响应数据
      const data = {
        pageNo: listReq.pageNo, // 当前页码
        pageSize: listReq.pageSize, // 每页记录数
        count, // 总记录数
        lists: rows, // 当前页数据列表
      };

      return data;

    } catch (err) {
      /**
       * 异常处理：捕获数据库查询过程中的所有错误
       * 记录详细的错误信息，便于问题排查
       * 抛出统一的错误信息，避免泄露敏感信息
       */
      throw new Error(`SystemLogController.operate error: ${err}`);
    }
  }
}

// 导出 LogService 类，供控制器层调用
module.exports = LogService;
