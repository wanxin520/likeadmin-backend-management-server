'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;
// 引入配置常量
const { version, publicUrl } = require('../extend/config');
// 引入URL处理工具
const util = require('../util/urlUtil');

/**
 * 通用服务类
 * 功能：处理系统通用功能，包括控制台数据、配置管理、系统设置等
 * 提供系统基础信息和配置的获取、设置能力
 */
class CommonService extends Service {

  /**
   * 获取控制台首页数据
   * @return {Object} 控制台数据 {version, today, visitor}
   */
  async getConsole() {
    try {
      // ==================== 版本信息 ====================
      // 获取网站名称，默认为'LikeAdmin-Nodejs'
      const name = await this.getVal('website', 'name', 'LikeAdmin-Nodejs');
      const versionInfo = {
        name, // 系统名称
        version, // 系统版本（从配置引入）
        website: 'www.likeadmin.cn', // 官网地址
        based: 'Vue3.x、ElementUI、MySQL', // 技术栈信息
        channel: { // 相关渠道链接
          gitee: 'https://gitee.com/likeadmin/likeadmin_python',
          website: 'https://www.likeadmin.cn',
        },
      };

      // ==================== 今日数据统计 ====================
      // 注意：这里使用了静态数据，实际项目中应该从数据库动态计算
      const today = {
        time: '2022-08-11 15:08:29', // 统计时间
        todayVisits: 10, // 今日访问量
        totalVisits: 100, // 总访问量
        todaySales: 30, // 今日销售额
        totalSales: 65, // 总销售额
        todayOrder: 12, // 今日订单数
        totalOrder: 255, // 总订单数
        todayUsers: 120, // 今日新增用户
        totalUsers: 360, // 总用户数
      };

      // ==================== 访客图表数据 ====================
      const now = new Date();
      const date = [];
      // 生成最近15天的日期数组（从14天前到今天）
      for (let i = 14; i >= 0; i--) {
        const currentDate = new Date(now); // 创建新的 Date 对象保存当前日期
        currentDate.setDate(currentDate.getDate() - i); // 设置日期（向前推i天）
        date.push(currentDate.toISOString().split('T')[0]); // 格式化为 YYYY-MM-DD
      }
      const visitor = {
        date, // 日期数组
        list: [ 12, 13, 11, 5, 8, 22, 14, 9, 456, 62, 78, 12, 18, 22, 46 ], // 访客数量
      };

      // 返回控制台完整数据
      return {
        version: versionInfo, // 版本信息
        today, // 今日统计
        visitor, // 访客图表数据
      };
    } catch (err) {
      throw new Error(`IndexService.console error: ${err}`);
    }
  }

  /**
   * 获取系统配置信息
   * @return {Object} 系统配置 {webName, webLogo, webFavicon, webBackdrop, ossDomain, copyright}
   */
  async getConfig() {
    try {
      // 获取网站相关配置
      const website = await this.get('website');

      // 获取版权信息配置
      const copyrightStr = await this.getVal('website', 'copyright', '');
      let copyright = [];
      if (copyrightStr) {
        copyright = JSON.parse(copyrightStr); // 解析JSON格式的版权信息
      }

      // 返回格式化后的配置信息
      return {
        webName: website.name, // 网站名称
        webLogo: util.toAbsoluteUrl(website.logo), // 网站Logo（转换为绝对URL）
        webFavicon: util.toAbsoluteUrl(website.favicon), // 网站图标（转换为绝对URL）
        webBackdrop: util.toAbsoluteUrl(website.backdrop), // 网站背景图（转换为绝对URL）
        ossDomain: publicUrl, // OSS域名
        copyright, // 版权信息数组
      };
    } catch (err) {
      throw new Error(`IndexService.config error: ${err}`);
    }
  }

  /**
   * 获取配置值
   * @param {string} cnfType 配置类型
   * @param {string} name 配置名称
   * @param {*} defaultVal 默认值
   * @return {*} 配置值
   */
  async getVal(cnfType, name, defaultVal) {
    try {
      // 获取配置
      const config = await this.get(cnfType, name);
      let data = config[name];

      // 如果配置不存在，使用默认值
      if (!data) {
        data = defaultVal;
      }
      return data;
    } catch (err) {
      throw new Error(`ConfigUtilService.getVal error: ${err}`);
    }
  }

  /**
   * 获取Map格式的配置值
   * @param {string} cnfType 配置类型
   * @param {string} name 配置名称
   * @return {Object} 配置对象
   */
  async getMap(cnfType, name) {
    try {
      // 获取配置字符串值
      const val = await this.getVal(cnfType, name, '');
      if (val === '') {
        return {}; // 空值返回空对象
      }

      // 解析JSON字符串为对象
      const data = JSON.parse(val);
      return data;
    } catch (err) {
      throw new Error(`ConfigUtilService.getMap error: ${err}`);
    }
  }

  /**
   * 获取配置数据
   * @param {string} cnfType 配置类型
   * @param {string} name 配置名称（可选）
   * @return {Object} 配置键值对对象
   */
  async get(cnfType, name) {
    const { ctx } = this;
    try {
      // 构建查询条件
      const object = {
        type: cnfType, // 配置类型
        ...(name && { name }), // 如果传入了name，则添加到查询条件
      };

      // 查询配置数据
      const configs = await ctx.model.SystemConfig.findAll({
        where: object,
      });

      // 将配置数组转换为键值对对象
      const data = {};
      for (const config of configs) {
        data[config.name] = config.value;
      }
      return data;
    } catch (err) {
      throw new Error(`ConfigUtilService.get error: ${err}`);
    }
  }

  /**
   * 设置配置值
   * @param {string} cnfType 配置类型
   * @param {string} name 配置名称
   * @param {string} val 配置值
   */
  async set(cnfType, name, val) {
    const { ctx } = this;
    const { SystemConfig } = ctx.model;

    try {
      // 查找是否已存在该配置
      let config = await SystemConfig.findOne({
        where: { type: cnfType, name },
      });

      // 如果配置不存在，创建新配置
      if (!config) {
        config = await SystemConfig.create({ type: cnfType, name });
      }

      // 更新配置值
      await config.update({ value: val });

      // 设置HTTP状态码为200（成功）
      ctx.status = 200;
    } catch (err) {
      throw new Error('Internal server error');
    }
  }
}

// 导出服务类
module.exports = CommonService;
