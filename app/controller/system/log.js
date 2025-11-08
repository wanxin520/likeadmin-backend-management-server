'use strict';

// 引入基础控制器，用于继承统一的响应方法
const baseController = require('../baseController');

/**
 * 系统日志控制器类
 * 负责处理操作日志相关的HTTP请求
 * @extends baseController
 */
class SystemLogController extends baseController {
  /**
   * 获取操作日志列表
   * 处理GET请求，查询系统操作日志记录
   *
   * 请求示例:
   * GET /api/log/operate?page=1&limit=20&username=admin&startTime=2023-01-01&endTime=2023-12-31
   *
   * @return {Object} 统一格式的响应数据
   * @example
   * {
   *   code: 200,
   *   data: {
   *     list: [...],     // 日志记录数组
   *     total: 100,      // 总记录数
   *     page: 1,         // 当前页码
   *     limit: 20        // 每页条数
   *   },
   *   message: '请求成功'
   * }
   */
  async operate() {
    // 获取当前请求的上下文对象
    const { ctx } = this;

    try {
      // 从请求查询字符串中获取参数
      // 可能包含: page(页码), limit(每页条数), username(用户名), startTime(开始时间), endTime(结束时间)等
      const listReq = ctx.request.query;

      // 调用日志服务层的operate方法处理业务逻辑
      // 服务层负责数据查询、过滤、分页等操作
      const data = await ctx.service.log.operate(listReq);

      // 使用基础控制器的result方法返回统一格式的成功响应
      this.result({
        data, // 服务层返回的日志数据
      });
    } catch (err) {
      // 异常处理：记录错误日志到系统日志文件
      ctx.logger.error(`SystemLogController.operate error: ${err}`);

      // 返回标准化的错误响应
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出控制器类，供路由系统调用
module.exports = SystemLogController;
