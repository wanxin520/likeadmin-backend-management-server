'use strict';

/**
 * storage.js - 存储引擎服务模块
 *
 * 功能：管理系统存储引擎的配置、启用、禁用和查询功能
 * 负责统一管理文件存储的后端引擎，支持本地存储、云存储等多种存储方式
 *
 * 核心特性：
 * - 存储引擎列表管理
 * - 存储引擎状态控制
 * - 默认存储引擎设置
 * - 存储引擎配置持久化
 *
 * @当前限制
 * - 目前仅支持本地存储 (local)
 * - 其他存储引擎（如OSS、COS等）暂不支持
 */

// 引入 Egg.js 的 Service 基类，用于创建服务层类
const Service = require('egg').Service;

// 以下导入被注释，可能在后续版本中用于版本控制和URL处理
// const { version, publicUrl } = require('../extend/config');
// const util = require('../util/urlUtil');

/**
 * 存储引擎服务类
 * 继承自 Egg.js 的 Service 基类，专门处理存储引擎相关的业务逻辑
 *
 * @class WebsiteService
 * @extends Service
 *
 * 主要职责：
 * 1. 提供存储引擎列表查询
 * 2. 管理存储引擎的详细配置
 * 3. 处理存储引擎的编辑和更新
 * 4. 控制存储引擎的启用和禁用状态
 * 5. 设置系统默认存储引擎
 *
 * @存储引擎概念
 * - 本地存储 (local): 文件存储在服务器本地磁盘
 * - 云存储 (oss/cos): 文件存储在云服务商的对象存储
 * - 状态: 0-禁用, 1-启用
 */
class WebsiteService extends Service {

  /**
   * 获取存储引擎列表
   * 返回所有可用的存储引擎及其状态信息
   *
   * @return {Promise<Array>} 返回存储引擎列表数组
   * @return {Object[]} return - 存储引擎对象数组
   * @return {string} return[].name - 存储引擎显示名称
   * @return {string} return[].alias - 存储引擎别名（唯一标识）
   * @return {string} return[].describe - 存储引擎描述
   * @return {number} return[].status - 存储引擎状态（0-禁用, 1-启用）
   *
   * @throws {Error} 当数据处理异常时抛出错误
   *
   * @流程说明
   * 1. 定义支持的存储引擎列表
   * 2. 标记当前正在使用的存储引擎
   * 3. 返回处理后的引擎列表
   *
   * @使用场景
   * - 系统设置中的存储引擎管理页面
   * - 文件上传时的存储引擎选择
   * - 存储配置的概览展示
   *
   * @示例返回值
   * [{
   *   name: "本地存储",
   *   alias: "local",
   *   describe: "存储在本地服务器",
   *   status: 1
   * }]
   */
  async list() {
    // 当前代码中 ctx 未被使用，但保留以备后续扩展
    // const { ctx } = this;

    try {
      /**
       * 当前使用的存储引擎
       * 硬编码为 'local'，实际应该从配置中动态获取
       * 后续可以扩展支持 oss、cos 等云存储
       */
      const engine = 'local';

      /**
       * 存储引擎列表定义
       * 目前只支持本地存储，其他存储引擎可以在此扩展
       */
      const storageList = [
        {
          name: '本地存储', // 引擎显示名称
          alias: 'local', // 引擎唯一标识
          describe: '存储在本地服务器', // 引擎功能描述
          status: 0, // 初始状态：禁用
        },
        // 后续可以在此添加其他存储引擎，如：
        // {
        //   name: '阿里云OSS',
        //   alias: 'oss',
        //   describe: '存储在阿里云对象存储',
        //   status: 0
        // }
      ];

      // 创建列表的副本，避免修改原始数据
      const mapList = storageList;

      /**
       * 标记当前正在使用的存储引擎
       * 遍历引擎列表，将当前使用的引擎状态设置为启用(1)
       */
      mapList.forEach(item => {
        if (engine === item.alias) {
          item.status = 1; // 设置为启用状态
        }
      });

      return mapList;

    } catch (err) {
      // 异常处理：捕获数据处理过程中的错误
      throw new Error(`storageService.config error: ${err}`);
    }
  }

  /**
   * 获取存储引擎详情
   * 根据引擎别名获取指定存储引擎的详细信息
   *
   * @param {string} alias - 存储引擎别名（如 'local'）
   * @return {Promise<Object>} 返回存储引擎详情对象
   * @return {string} return.name - 存储引擎名称
   * @return {string} return.alias - 存储引擎别名
   * @return {number} return.status - 存储引擎状态（0-禁用, 1-启用）
   *
   * @throws {Error} 当配置获取异常时抛出错误
   *
   * @流程说明
   * 1. 从配置存储中获取引擎配置
   * 2. 判断引擎是否为当前使用引擎
   * 3. 返回引擎详情信息
   *
   * @使用场景
   * - 存储引擎配置编辑页面
   * - 存储引擎状态查看
   */
  async detail(alias) {
    const { ctx } = this;
    try {
      // 当前使用的存储引擎
      const engine = 'local';

      /**
       * 从配置存储中获取存储引擎的详细配置
       * 使用 common 服务的 getMap 方法
       *
       * @参数说明
       * - 'storage': 配置的命名空间
       * - alias: 存储引擎的别名
       */
      const cnf = await ctx.service.common.getMap('storage', alias);

      // 判断该引擎是否为当前使用的引擎
      const status = engine === alias ? 1 : 0;

      // 返回引擎详情信息
      return {
        name: cnf.name, // 引擎名称
        alias, // 引擎别名
        status, // 引擎状态
      };

    } catch (err) {
      throw new Error(`storageService.config error: ${err}`);
    }
  }

  /**
   * 编辑存储引擎配置
   * 更新存储引擎的配置信息并设置默认引擎
   *
   * @param {Object} editReq - 编辑请求参数对象
   * @param {string} editReq.alias - 存储引擎别名
   * @param {number} editReq.status - 存储引擎状态（0-禁用, 1-启用）
   *
   * @return {Promise<void>} 无返回值，操作成功时正常结束
   *
   * @throws {Error} 当存储引擎不支持或配置保存异常时抛出错误
   *
   * @流程说明
   * 1. 验证存储引擎是否支持
   * 2. 保存引擎配置到存储系统
   * 3. 根据状态设置默认存储引擎
   *
   * @使用场景
   * - 管理员在后台配置存储引擎
   * - 启用或禁用特定存储引擎
   */
  async edit(editReq) {
    const { ctx } = this;
    try {
      // 当前支持的存储引擎
      const engine = 'local';

      /**
       * 验证请求的存储引擎是否受支持
       * 目前只支持本地存储，其他引擎抛出错误
       */
      if (engine !== editReq.alias) {
        throw new Error(`engine:${editReq.alias} 暂时不支持`);
      }

      /**
       * 构建存储引擎配置对象并序列化为JSON
       * 目前配置比较简单，只有名称信息
       * 后续可以扩展更多配置项，如存储路径、访问密钥等
       */
      const json = JSON.stringify({ name: '本地存储' });

      /**
       * 保存存储引擎配置到配置存储
       * 将配置持久化到数据库或配置中心
       */
      await ctx.service.common.set('storage', editReq.alias, json);

      /**
       * 根据状态设置默认存储引擎
       * 如果状态为启用(1)，设置为默认引擎
       * 如果状态为禁用(0)，清空默认引擎设置
       */
      if (editReq.status === 1) {
        // 设置为默认存储引擎
        await ctx.service.common.set('storage', 'default', editReq.alias);
      } else {
        // 清空默认存储引擎设置
        await ctx.service.common.set('storage', 'default', '');
      }

    } catch (err) {
      throw new Error('Edit Set default err');
    }
  }

  /**
   * 切换存储引擎状态
   * 启用或禁用指定的存储引擎
   *
   * @param {string} alias - 存储引擎别名
   * @param {number} status - 目标状态（0-禁用, 1-启用）
   *
   * @return {Promise<void>} 无返回值，操作成功时正常结束
   *
   * @throws {Error} 当存储引擎不支持或状态设置异常时抛出错误
   *
   * @流程说明
   * 1. 验证存储引擎是否支持
   * 2. 根据目标状态设置默认存储引擎
   *
   * @业务规则
   * - 只能启用当前已支持的存储引擎
   * - 禁用当前使用的引擎时会清空默认设置
   * - 启用引擎时会将其设置为默认引擎
   */
  async change(alias, status) {
    const { ctx } = this;
    try {
      // 当前支持的存储引擎
      const engine = 'local';

      /**
       * 验证请求的存储引擎是否受支持
       * 目前只支持本地存储
       */
      if (engine !== alias) {
        throw new Error(`engine:${alias} 暂时不支持`);
      }

      /**
       * 状态切换逻辑：
       * - 如果要禁用的是当前使用的引擎，清空默认设置
       * - 如果要启用一个引擎，将其设置为默认引擎
       */
      if (engine === alias && status === 0) {
        // 禁用当前使用的引擎：清空默认存储引擎设置
        await ctx.service.common.set('storage', 'default', '');
      } else {
        // 启用存储引擎：设置为默认存储引擎
        await ctx.service.common.set('storage', 'default', alias);
      }

    } catch (err) {
      throw new Error('Change Set err');
    }
  }
}

// 导出 WebsiteService 类，供控制器层调用
// 注意：类名与文件名不太匹配，建议改为 StorageService 更合适
module.exports = WebsiteService;
