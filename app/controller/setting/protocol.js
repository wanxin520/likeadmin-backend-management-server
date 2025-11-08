'use strict';

/**
 * 协议管理控制器
 * 功能: 处理系统协议内容的查看和保存操作，如用户协议、隐私政策等
 * 位置: app/controller/setting/protocol.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 系统设置 - 协议内容管理
 * 协议类型说明:
 *   - 用户协议: 用户注册和使用服务的基本条款
 *   - 隐私政策: 用户数据收集和使用的说明
 *   - 服务条款: 平台服务的详细规定
 *   - 其他法律文书
 */
const baseController = require('../baseController');

class SettingProtocolController extends baseController {

  /**
   * 获取协议详情
   * 接口地址: GET /api/setting/protocol/detail
   * 功能: 获取系统中配置的协议内容详情
   * 权限: 需要登录认证
   * 请求参数: 无
   * 返回数据: 协议内容的详细信息
   * 数据内容可能包括:
   *   - 协议类型（如：user_agreement, privacy_policy等）
   *   - 协议标题
   *   - 协议内容（HTML或富文本格式）
   *   - 协议版本号
   *   - 生效日期
   *   - 状态信息
   */
  async details() {
    const { ctx } = this;
    try {
      // 调用协议服务层获取协议详情
      // 可能根据协议类型返回不同的协议内容
      const data = await ctx.service.protocol.details();
      // 返回协议详情数据
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理：记录错误日志并返回500错误
      ctx.logger.error(`SettingProtocolController.details error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 保存协议内容
   * 接口地址: POST /api/setting/protocol/save
   * 功能: 更新或保存系统的协议内容配置
   * 权限: 需要管理员权限
   * 请求参数:
   *   - name: 协议名称（必填）
   *   - content: 协议内容（必填，HTML格式）
   *   - type: 协议类型（必填）
   *   - version: 协议版本（可选）
   *   - effectiveDate: 生效日期（可选）
   * 请求体示例:
   *   {
   *     "name": "用户协议",
   *     "content": "<h1>用户协议</h1><p>欢迎使用我们的服务...</p>",
   *     "type": "user_agreement",
   *     "version": "2.0",
   *     "effectiveDate": "2024-01-01"
   *   }
   * 返回数据: 空对象，表示保存成功
   * 技术特点: 支持富文本内容存储，可能包含HTML标签和样式
   */
  async save() {
    const { ctx } = this;
    // 直接获取请求体参数，不进行JSON字符串化处理
    // 因为协议内容可能包含HTML标签，需要保持原始格式
    const params = ctx.request.body;
    try {
      // 调用服务层保存协议内容
      await ctx.service.protocol.save(params);
      // 返回成功响应
      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`SettingProtocolController.save error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出协议设置控制器类
module.exports = SettingProtocolController;
