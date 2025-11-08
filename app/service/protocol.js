'use strict';

/**
 * protocol.js - 系统协议服务模块
 *
 * 功能：管理系统服务协议和隐私协议的读取、保存和配置功能
 * 负责处理用户协议、隐私政策等法律文档的存储和展示
 *
 * 核心特性：
 * - 服务协议和隐私协议的双重管理
 * - JSON格式的协议内容存储
 * - 默认值保障机制
 * - 统一的配置存储接口
 */

// 引入 Egg.js 的 Service 基类，用于创建服务层类
const Service = require('egg').Service;

/**
 * 协议服务类
 * 继承自 Egg.js 的 Service 基类，专门处理系统协议相关的业务逻辑
 *
 * @class ProtocolService
 * @extends Service
 *
 * 主要职责：
 * 1. 提供协议内容的查询接口
 * 2. 处理协议内容的保存和更新
 * 3. 管理协议数据的JSON序列化
 * 4. 提供默认值保障
 * 5. 异常处理和错误管理
 *
 * @涉及协议类型
 * - 服务协议 (service): 用户使用服务的条款和条件
 * - 隐私协议 (privacy): 用户隐私保护和数据处理政策
 */
class ProtocolService extends Service {

  /**
   * 获取协议详情
   * 同时获取服务协议和隐私协议的内容
   *
   * @return {Promise<Object>} 返回协议详情对象
   * @return {Object} return.service - 服务协议内容 {name: string, content: string}
   * @return {Object} return.privacy - 隐私协议内容 {name: string, content: string}
   *
   * @throws {Error} 当数据获取或JSON解析异常时抛出错误
   *
   * @流程说明
   * 1. 从配置存储中获取服务协议内容
   * 2. 从配置存储中获取隐私协议内容
   * 3. 将JSON字符串解析为对象
   * 4. 返回结构化的协议数据
   *
   * @使用场景
   * - 用户注册页面显示协议内容
   * - 系统设置中查看协议详情
   * - 法律合规检查
   *
   * @示例返回值
   * {
   *   service: {name: "用户服务协议", content: "协议详细内容..."},
   *   privacy: {name: "隐私保护政策", content: "隐私政策详细内容..."}
   * }
   */
  async details() {
    const { ctx } = this;
    try {
      /**
       * 默认协议内容结构
       * 当配置存储中没有协议内容时使用此默认值
       * 确保系统始终有可用的协议内容
       */
      const defaultVal = '{"name":"","content":""}';

      // ==================== 获取协议内容 ====================
      /**
       * 从配置存储中获取服务协议内容
       * 使用 common 服务的 getVal 方法，支持默认值回退
       *
       * @参数说明
       * - 'protocol': 配置的命名空间或分类
       * - 'service': 服务协议的键名
       * - defaultVal: 当配置不存在时的默认值
       */
      const service = await ctx.service.common.getVal('protocol', 'service', defaultVal);

      /**
       * 从配置存储中获取隐私协议内容
       * 同样使用默认值保障机制
       */
      const privacy = await ctx.service.common.getVal('protocol', 'privacy', defaultVal);

      // ==================== 数据处理和返回 ====================
      /**
       * 构建返回数据对象
       * 将存储的JSON字符串解析为JavaScript对象
       */
      const data = {
        service: JSON.parse(service), // 解析服务协议JSON
        privacy: JSON.parse(privacy), // 解析隐私协议JSON
      };

      return data;

    } catch (err) {
      /**
       * 异常处理：捕获数据获取或JSON解析过程中的错误
       * 记录错误信息并抛出统一的异常
       */
      throw new Error(`service error: ${err}`);
    }
  }

  /**
   * 保存协议内容
   * 更新服务协议和隐私协议的内容到配置存储
   *
   * @param {Object} req - 保存请求参数对象
   * @param {Object} req.service - 服务协议内容对象 {name: string, content: string}
   * @param {Object} req.privacy - 隐私协议内容对象 {name: string, content: string}
   *
   * @return {Promise<void>} 无返回值，保存成功时正常结束，失败时抛出异常
   *
   * @throws {Error} 当数据保存异常时抛出错误
   *
   * @流程说明
   * 1. 接收前端传递的协议内容对象
   * 2. 将对象序列化为JSON字符串
   * 3. 调用配置服务保存到存储系统
   * 4. 处理保存过程中的异常
   *
   * @使用场景
   * - 管理员在后台更新协议内容
   * - 系统初始化时设置默认协议
   * - 法律条款变更时更新协议
   *
   * @数据验证
   * 注意：当前代码未对输入数据进行严格验证
   * 实际生产环境中应对协议内容进行合法性校验
   */
  async save(req) {
    const { ctx } = this;
    // 解构请求参数，获取服务协议和隐私协议内容
    const { service, privacy } = req;

    try {
      // ==================== 数据序列化 ====================
      /**
       * 将协议对象序列化为JSON字符串
       * 便于存储到数据库或配置中心
       */
      const serviceJson = JSON.stringify(service);
      const privacyJson = JSON.stringify(privacy);

      // ==================== 保存到配置存储 ====================
      /**
       * 使用 common 服务的 set 方法保存协议内容
       * 将序列化后的JSON字符串存储到配置系统
       */
      await ctx.service.common.set('protocol', 'service', serviceJson);
      await ctx.service.common.set('protocol', 'privacy', privacyJson);

      /**
       * 保存成功，无返回值
       * 调用方可以通过没有抛出异常来判断保存成功
       */

    } catch (err) {
      /**
       * 异常处理：捕获数据保存过程中的错误
       * 包括数据库连接异常、存储异常等
       */
      throw new Error(`service error: ${err}`);
    }
  }
}

// 导出 ProtocolService 类，供控制器层调用
module.exports = ProtocolService;
