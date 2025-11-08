'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;

/**
 * 版权信息服务类
 * 功能：专门处理系统版权信息的获取和保存
 * 版权信息通常用于网站底部显示，支持多链接配置
 */
class CopyrightService extends Service {

  /**
   * 获取版权信息详情
   * @return {Array} 版权信息数组，包含多个版权链接项
   * 返回示例: [{name: '链接名称', link: 'https://example.com'}, ...]
   */
  async details() {
    const { ctx } = this;
    try {
      // 从通用配置服务中获取版权信息配置值
      // 参数说明:
      // - 'website': 配置类型
      // - 'copyright': 配置名称
      // - '[]': 默认值（空数组的JSON字符串）
      const copyrightStr = await ctx.service.common.getVal('website', 'copyright', '[]');

      let copyright = [];
      if (copyrightStr) {
        // 将JSON字符串解析为JavaScript数组对象
        copyright = JSON.parse(copyrightStr);
      }

      // 返回版权信息数组
      // 示例结构:
      // [
      //   { name: '关于我们', link: '/about' },
      //   { name: '联系我们', link: '/contact' },
      //   { name: '隐私政策', link: '/privacy' }
      // ]
      return copyright;
    } catch (err) {
      throw new Error(`IndexService.config error: ${err}`);
    }
  }

  /**
   * 保存版权信息
   * @param {string} req 版权信息的JSON字符串
   * 参数示例: '[{"name":"关于我们","link":"/about"},{"name":"联系我们","link":"/contact"}]'
   */
  async save(req) {
    const { ctx } = this;

    try {
      // 使用通用配置服务保存版权信息
      // 参数说明:
      // - 'website': 配置类型
      // - 'copyright': 配置名称
      // - req: 版权信息的JSON字符串
      await ctx.service.common.set('website', 'copyright', req);

      // 保存成功后，配置会自动存储到系统配置表中
      // 后续可以通过 details() 方法重新读取
    } catch (err) {
      throw new Error(`IndexService.config error: ${err}`);
    }
  }
}

// 导出服务类
module.exports = CopyrightService;
