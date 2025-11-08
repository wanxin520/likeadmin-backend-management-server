'use strict';

/**
 * baseController.js 是基础控制器类，为系统中所有其他控制器提供
 * 统一的响应格式和公共方法，实现了标准的 API 响应规范。
 */

// 引入 Egg.js 的 Controller 基类
const Controller = require('egg').Controller;

/**
 * 基础控制器类
 * 所有业务控制器的基类，提供统一的响应格式和公共方法
 * 实现了标准化的 API 响应规范，确保前后端数据交互的一致性
 */
module.exports = class baseController extends Controller {

  /**
   * 统一响应方法
   * 标准化所有 API 接口的返回格式，包含状态码、数据和消息
   *
   * @param {Object} options 响应配置对象
   * @param {number} options.code - 业务状态码，默认200表示成功
   * @param {any} options.data - 响应数据，默认空字符串
   * @param {string} options.message - 响应消息，默认'请求成功'
   * @param {number} options.status - HTTP 状态码，默认200
   *
   * @example
   * // 成功响应
   * this.result({ data: userInfo });
   *
   * // 失败响应
   * this.result({
   *   code: 400,
   *   message: '参数错误',
   *   status: 400
   * });
   *
   * // 自定义业务码
   * this.result({
   *   code: 1001,
   *   data: null,
   *   message: '用户不存在'
   * });
   */
  result({ code = 200, data = '', message = '请求成功', status = 200 }) {
    const { ctx } = this;

    // 自动处理消息：当业务状态码不是200时，自动将默认成功消息改为失败消息
    if (code !== 200) {
      message = message === '请求成功' ? '请求失败' : message;
    }

    // 设置 HTTP 响应状态码
    ctx.response.status = status;

    // 设置响应体，统一格式：{ code, data, message }
    ctx.body = {
      code, // 业务状态码
      data, // 响应数据
      message, // 响应消息
    };
  }
};
