'use strict';

/**
 * website.js - 网站配置服务模块
 *
 * 功能：管理系统网站基础配置信息，包括网站信息、品牌标识、店铺信息等
 * 负责网站基础信息的读取、保存和路径处理，为前端提供统一的配置接口
 *
 * 核心特性：
 * - 网站基础信息管理（名称、Logo、图标等）
 * - 店铺信息管理（适用于电商系统）
 * - 图片路径的自动转换处理
 * - 配置数据的持久化存储
 */

// 引入 Egg.js 的 Service 基类，用于创建服务层类
const Service = require('egg').Service;

// 引入 URL 处理工具，用于相对路径和绝对路径的转换
const util = require('../util/urlUtil');

/**
 * 网站配置服务类
 * 继承自 Egg.js 的 Service 基类，专门处理网站配置相关的业务逻辑
 *
 * @class WebsiteService
 * @extends Service
 *
 * 主要职责：
 * 1. 提供网站配置信息的查询接口
 * 2. 处理网站配置信息的保存和更新
 * 3. 管理图片路径的转换和处理
 * 4. 处理配置数据的序列化和存储
 *
 * @配置项说明
 * - 网站配置: name, logo, favicon, backdrop
 * - 店铺配置: shopName, shopLogo (适用于电商场景)
 */
class WebsiteService extends Service {

  /**
   * 获取网站配置详情
   * 返回网站和店铺的所有配置信息，自动处理图片路径为绝对URL
   *
   * @return {Promise<Object>} 返回网站配置详情对象
   * @return {string} return.name - 网站名称
   * @return {string} return.logo - 网站Logo的绝对URL
   * @return {string} return.favicon - 网站图标的绝对URL
   * @return {string} return.backdrop - 网站背景图的绝对URL
   * @return {string} return.shopName - 店铺名称
   * @return {string} return.shopLogo - 店铺Logo的绝对URL
   *
   * @throws {Error} 当配置获取或数据处理异常时抛出错误
   *
   * @流程说明
   * 1. 从配置存储中获取网站配置信息
   * 2. 将所有图片路径转换为绝对URL
   * 3. 返回处理后的配置对象
   *
   * @使用场景
   * - 网站前台页面获取品牌信息
   * - 后台管理系统展示当前配置
   * - 移动端APP获取网站配置
   *
   * @示例返回值
   * {
   *   name: "我的网站",
   *   logo: "http://example.com/uploads/logo.png",
   *   favicon: "http://example.com/uploads/favicon.ico",
   *   backdrop: "http://example.com/uploads/backdrop.jpg",
   *   shopName: "我的店铺",
   *   shopLogo: "http://example.com/uploads/shop-logo.png"
   * }
   */
  async details() {
    const { ctx } = this;
    try {
      /**
       * 从配置存储中获取网站配置信息
       * 使用 common 服务的 get 方法获取整个 website 配置对象
       * 配置存储可能是数据库、Redis 或配置文件
       */
      const website = await ctx.service.common.get('website');

      /**
       * 构建返回对象，将所有图片路径转换为绝对URL
       * 绝对URL包含完整的域名和路径，便于前端直接使用
       */
      return {
        name: website.name, // 网站名称（直接使用）
        logo: util.toAbsoluteUrl(website.logo), // 网站Logo（转换为绝对URL）
        favicon: util.toAbsoluteUrl(website.favicon), // 网站图标（转换为绝对URL）
        backdrop: util.toAbsoluteUrl(website.backdrop), // 网站背景图（转换为绝对URL）
        shopName: website.shopName, // 店铺名称（直接使用）
        shopLogo: util.toAbsoluteUrl(website.shopLogo), // 店铺Logo（转换为绝对URL）
      };

    } catch (err) {
      /**
       * 异常处理：捕获配置获取或数据处理过程中的错误
       * 记录详细的错误信息，便于问题排查
       */
      throw new Error(`websiteService.config error: ${err}`);
    }
  }

  /**
   * 保存网站配置信息
   * 更新网站和店铺的所有配置信息，自动将图片路径转换为相对路径存储
   *
   * @param {Object} req - 保存请求参数对象
   * @param {string} req.name - 网站名称
   * @param {string} req.logo - 网站Logo的URL（可能是绝对或相对路径）
   * @param {string} req.favicon - 网站图标的URL
   * @param {string} req.backdrop - 网站背景图的URL
   * @param {string} req.shopName - 店铺名称
   * @param {string} req.shopLogo - 店铺Logo的URL
   *
   * @return {Promise<void>} 无返回值，保存成功时正常结束
   *
   * @throws {Error} 当配置保存异常时抛出错误
   *
   * @流程说明
   * 1. 接收前端传递的配置参数
   * 2. 将所有图片URL转换为相对路径
   * 3. 使用 Promise.all 并行保存所有配置项
   * 4. 处理保存过程中的异常
   *
   * @使用场景
   * - 管理员在后台更新网站配置
   * - 系统初始化时设置默认配置
   * - 品牌形象更新时修改配置
   *
   * @技术特点
   * - 使用 Promise.all 并行保存，提高性能
   * - 统一转换为相对路径存储，便于环境迁移
   * - 原子性操作：要么全部成功，要么全部失败
   */
  async save(req) {
    const { ctx } = this;

    try {
      /**
       * 使用 Promise.all 并行保存所有配置项
       * 这种方式比串行保存性能更好，所有操作同时进行
       *
       * 配置存储说明：
       * - 第一个参数 'website': 配置的命名空间
       * - 第二个参数: 配置项的键名
       * - 第三个参数: 配置项的值
       */
      await Promise.all([
        // 保存网站名称（直接存储）
        ctx.service.common.set('website', 'name', req.name),

        // 保存网站Logo（转换为相对路径存储）
        ctx.service.common.set('website', 'logo', util.toRelativeUrl(req.logo)),

        // 保存网站图标（转换为相对路径存储）
        ctx.service.common.set('website', 'favicon', util.toRelativeUrl(req.favicon)),

        // 保存网站背景图（转换为相对路径存储）
        ctx.service.common.set('website', 'backdrop', util.toRelativeUrl(req.backdrop)),

        // 保存店铺名称（直接存储）
        ctx.service.common.set('website', 'shopName', req.shopName),

        // 保存店铺Logo（转换为相对路径存储）
        ctx.service.common.set('website', 'shopLogo', util.toRelativeUrl(req.shopLogo)),
      ]);

      /**
       * 保存成功，无返回值
       * 调用方可以通过没有抛出异常来判断保存成功
       * 所有配置项都已成功保存到配置存储
       */

    } catch (err) {
      /**
       * 异常处理：捕获配置保存过程中的错误
       * 包括数据库连接异常、存储异常、网络异常等
       *
       * @注意
       * 由于使用 Promise.all，如果任何一个保存操作失败，
       * 整个 Promise.all 都会拒绝，确保数据的原子性
       */
      throw new Error(`websiteService.config error: ${err}`);
    }
  }
}

// 导出 WebsiteService 类，供控制器层调用
module.exports = WebsiteService;
