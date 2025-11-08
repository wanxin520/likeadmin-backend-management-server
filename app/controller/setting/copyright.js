'use strict';

/**
 * 版权信息设置控制器
 * 功能: 处理系统版权信息的查看和保存操作
 * 位置: app/controller/setting/copyright.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 系统设置 - 版权信息管理
 */
const baseController = require('../baseController');

class SettingCopyrightController extends baseController {

  /**
   * 获取版权信息详情
   * 接口地址: GET /api/setting/copyright/detail
   * 功能: 获取系统中配置的版权信息内容
   * 权限: 需要管理员权限
   * 请求参数: 无
   * 返回数据: 版权信息的详细内容
   * 数据内容可能包括:
   *   - 公司名称
   *   - 版权年份
   *   - 备案信息
   *   - 官方网站链接
   *   - 版权声明文本
   *   - 其他版权相关配置
   */
  async details() {
    const { ctx } = this;
    try {
      // 调用版权信息服务层获取版权信息详情
      const data = await ctx.service.copyright.details();
      // 返回版权信息数据
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理：记录错误日志并返回500错误
      ctx.logger.error(`SettingCopyrightController.details error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 保存版权信息
   * 接口地址: POST /api/setting/copyright/save
   * 功能: 更新或保存系统的版权信息配置
   * 权限: 需要管理员权限
   * 请求参数:
   *   - 版权信息的各个字段（JSON格式）
   * 请求体示例:
   *   {
   *     "companyName": "LikeAdmin",
   *     "copyrightYear": "2023",
   *     "icpNumber": "京ICP备12345678号",
   *     "officialWebsite": "https://www.likeadmin.cn",
   *     "copyrightText": "版权所有 © LikeAdmin"
   *   }
   * 返回数据: 空对象，表示保存成功
   * 技术特点: 将整个请求体转换为JSON字符串进行存储，便于灵活处理各种版权字段
   */
  async save() {
    const { ctx } = this;
    // 将请求体对象转换为JSON字符串进行存储
    // 这种方式可以灵活存储各种结构的版权信息，无需预定义固定字段
    const params = ctx.request.body && JSON.stringify(ctx.request.body);
    try {
      // 调用服务层保存版权信息
      await ctx.service.copyright.save(params);
      // 返回成功响应
      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`SettingCopyrightController.save error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出版权设置控制器类
module.exports = SettingCopyrightController;
