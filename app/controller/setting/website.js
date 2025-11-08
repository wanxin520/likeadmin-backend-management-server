'use strict';

/**
 * 网站信息配置控制器
 * 功能: 处理系统网站基本信息的管理，包括查看和保存网站配置
 * 位置: app/controller/setting/website.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 系统设置 - 网站信息管理
 * 网站信息说明:
 *   - 网站基础信息：名称、Logo、描述等
 *   - 联系信息：电话、邮箱、地址等
 *   - SEO配置：关键词、描述等
 *   - 社交媒体链接
 *   - 备案信息等
 */
const baseController = require('../baseController');

class SettingWebsiteController extends baseController {

  /**
   * 获取网站信息详情
   * 接口地址: GET /api/setting/website/detail
   * 功能: 获取系统中配置的网站基本信息详情
   * 权限: 需要登录认证
   * 请求参数: 无
   * 返回数据: 网站信息的详细配置
   * 数据内容可能包括:
   *   - 网站名称、Logo、Favicon
   *   - 网站描述、关键词（SEO）
   *   - 联系信息（电话、邮箱、地址）
   *   - 社交媒体链接
   *   - 备案信息
   *   - 其他网站相关配置
   */
  async details() {
    const { ctx } = this;
    try {
      // 调用网站信息服务层获取网站配置详情
      // 通常返回系统全局的网站设置信息
      const data = await ctx.service.website.details();
      // 返回网站信息数据
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理：记录错误日志并返回500错误
      ctx.logger.error(`SettingWebsiteController.details error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 保存网站信息配置
   * 接口地址: POST /api/setting/website/save
   * 功能: 更新或保存系统的网站信息配置
   * 权限: 需要管理员权限
   * 请求参数:
   *   - name: 网站名称（必填）
   *   - logo: 网站Logo图片地址（可选）
   *   - favicon: 网站图标地址（可选）
   *   - description: 网站描述（可选，SEO用）
   *   - keywords: 网站关键词（可选，SEO用）
   *   - contact: 联系信息对象（可选）
   *   - social: 社交媒体链接对象（可选）
   * 请求体示例:
   *   {
   *     "name": "LikeAdmin管理系统",
   *     "logo": "/public/logo.png",
   *     "favicon": "/public/favicon.ico",
   *     "description": "基于Egg.js开发的现代化后台管理系统",
   *     "keywords": "LikeAdmin,后台管理,Egg.js,Node.js",
   *     "contact": {
   *       "phone": "400-123-4567",
   *       "email": "contact@likeadmin.cn",
   *       "address": "北京市朝阳区某某大厦"
   *     },
   *     "social": {
   *       "weibo": "https://weibo.com/likeadmin",
   *       "github": "https://github.com/likeadmin"
   *     }
   *   }
   * 返回数据: 空对象，表示保存成功
   * 技术特点: 支持结构化配置数据存储，便于前端使用
   */
  async save() {
    const { ctx } = this;
    // 获取请求体参数，保持原始数据结构
    // 网站配置通常包含多个字段和嵌套对象
    const params = ctx.request.body;
    try {
      // 调用服务层保存网站信息配置
      await ctx.service.website.save(params);
      // 返回成功响应
      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`SettingWebsiteController.save error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出网站信息控制器类
module.exports = SettingWebsiteController;
