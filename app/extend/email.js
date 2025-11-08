'use strict';

/**
 * email.js 是邮件发送服务模块，基于 nodemailer 库实现邮件发送功能，
 * 支持 HTML 模板邮件，用于系统通知、验证码发送等邮件通信场景。
 */

// 引入 nodemailer 邮件发送库
const nodemailer = require('nodemailer');
// 引入邮件模板模块，用于生成格式化的邮件内容
const emailTmp = require('./emailTmp');

/**
 * 邮件传输器配置
 * 创建 SMTP 客户端连接，配置发送者邮箱服务器信息
 *
 * @配置说明
 * - host: SMTP 服务器地址（163邮箱服务器）
 * - secure: 启用 SSL 安全连接
 * - port: SMTP 端口号（SSL 安全端口）
 * - auth: 邮箱认证信息
 */
const transporter = nodemailer.createTransport({
  // SMTP 服务器主机地址 - 使用 163 邮箱服务器
  // 支持的其他服务商：QQ、Gmail、Outlook 等，详见：https://nodemailer.com/smtp/well-known/
  host: 'smtp.163.com',

  // 启用 SSL 安全连接，确保数据传输加密
  secure: true,

  // SMTP 端口号，163 邮箱的 SSL 端口为 994
  // 非 SSL 端口一般为 25 或 587
  port: 994,

  // 邮箱认证信息
  auth: {
    // 发件人邮箱账号
    user: 'vipbic@163.com',

    /**
     * SMTP 授权码（不是邮箱登录密码）
     * 需要在邮箱设置中申请 SMTP 服务并获取授权码
     *
     * @安全警告
     * - 实际生产中不应将授权码硬编码在代码中
     * - 建议使用环境变量或配置文件存储敏感信息
     * - 定期更换授权码以提高安全性
     */
    pass: 'QWERTYKVRJAKIXVAXJKD',
  },
});

/**
 * 邮件发送服务模块
 * 提供统一的邮件发送接口，支持自定义收件人、标题和模板内容
 */
module.exports = {

  /**
   * 发送邮件方法
   * 根据提供的参数发送格式化的 HTML 邮件
   *
   * @param {Object} options - 邮件发送选项
   * @param {string} options.userEmail - 收件人邮箱地址
   * @param {string} options.title - 邮件主题/标题
   * @return {Promise} 返回 nodemailer 的发送结果 Promise
   *
   * @邮件内容
   * - 发件人: vipbic@163.com（固定）
   * - 收件人: 根据参数动态指定
   * - 主题: 根据参数动态指定
   * - 内容: 使用 emailTmp 模板生成 HTML 格式内容
   *
   * @使用示例
   * await ctx.helper.email.sendEmail({
   *   userEmail: 'user@example.com',
   *   title: '系统通知'
   * });
   *
   * @典型应用场景
   * - 用户注册验证码
   * - 密码重置链接
   * - 系统通知提醒
   * - 订单状态更新
   * - 安全报警通知
   */
  async sendEmail({ userEmail, title }) {
    // 配置邮件选项
    const mailOptions = {
      // 发件人地址，必须与认证的 user 一致
      from: 'vipbic@163.com',

      // 收件人地址，支持多个收件人（用逗号分隔）
      // 例如: 'user1@example.com, user2@example.com'
      to: userEmail,

      // 邮件主题/标题
      subject: title,

      // 邮件纯文本内容（当前被注释，使用 HTML 内容）
      // text: '测试内容',

      /**
       * 邮件 HTML 内容
       * 使用邮件模板函数生成格式化的 HTML 内容
       * 传入参数：收件人邮箱和下载量（示例数据）
       *
       * @注意 示例中使用了固定的 downloads: 6000，实际应根据业务需求传递动态数据
       */
      html: emailTmp({ userEmail, downloads: 6000 }),
    };

    // 发送邮件并返回 Promise
    return await transporter.sendMail(mailOptions);
  },
};
