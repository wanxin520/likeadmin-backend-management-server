'use strict';

/**
 * redis.js - Redis 缓存服务模块
 *
 * 功能：提供完整的 Redis 操作封装，包括字符串、集合、哈希等数据结构操作
 * 负责系统缓存管理、会话存储、临时数据存储等核心功能
 *
 * 核心特性：
 * - 统一的 Redis 操作接口
 * - 自动 JSON 序列化/反序列化
 * - 灵活的过期时间管理
 * - 连接状态容错处理
 * - 键名前缀隔离
 */

// 引入 Egg.js 的 Service 基类，用于创建服务层类
const Service = require('egg').Service;

// 默认缓存失效时间：30天（60秒 * 60分钟 * 24小时 * 30天）
const time = 60 * 60 * 24 * 30;

// 引入配置中的 Redis 键前缀，用于环境隔离和键名管理
const { redisPrefix } = require('../extend/config');

/**
 * Redis 缓存服务类
 * 继承自 Egg.js 的 Service 基类，封装所有 Redis 相关操作
 *
 * @class RedisService
 * @extends Service
 *
 * 主要职责：
 * 1. 提供统一的缓存读写接口
 * 2. 管理缓存数据的序列化和反序列化
 * 3. 处理缓存过期时间
 * 4. 支持多种 Redis 数据结构操作
 * 5. 提供 Redis 状态监控和管理功能
 *
 * @数据结构支持
 * - 字符串 (String): 通用键值存储
 * - 集合 (Set): 无序唯一值集合
 * - 哈希 (Hash): 字段-值映射表
 * - 键管理: 过期时间、存在性检查等
 */
class RedisService extends Service {

  /**
   * 设置缓存键值对
   * 将数据序列化为 JSON 并设置到 Redis，支持过期时间
   *
   * @param {String} key - 缓存键名
   * @param {*} value - 缓存值，可以是任意可序列化的数据类型
   * @param {Number} [seconds] - 过期时间（秒），不传则使用默认30天
   *
   * @return {Promise<void>} 无返回值，设置成功时正常结束
   *
   * @流程说明
   * 1. 检查 Redis 连接状态
   * 2. 将值序列化为 JSON 字符串
   * 3. 根据是否指定过期时间调用不同的设置命令
   *
   * @使用场景
   * - 用户会话数据缓存
   * - 接口响应数据缓存
   * - 临时计算结果的存储
   *
   * @示例
   * await redisService.set('user:123', {name: 'John', age: 25}, 3600);
   */
  async set(key, value, seconds) {
    const { redis } = this.app;

    // Redis 连接状态检查：如果 Redis 未启用则直接返回
    if (!redis) {
      return;
    }

    // 将任意数据类型序列化为 JSON 字符串，便于存储
    value = JSON.stringify(value);

    // 根据是否指定过期时间选择不同的设置方式
    if (!seconds) {
      // 使用默认过期时间（30天）
      await redis.set(key, value, 'EX', time);
    } else {
      // 使用指定的过期时间
      await redis.set(key, value, 'EX', seconds);
    }
  }

  /**
   * 获取缓存值
   * 从 Redis 获取数据并反序列化为原始类型
   *
   * @param {String} key - 要获取的缓存键名
   * @return {Promise<*|boolean>} 返回解析后的数据，键不存在时返回 false
   *
   * @流程说明
   * 1. 检查 Redis 连接状态
   * 2. 从 Redis 获取数据
   * 3. 数据存在时反序列化为原始类型
   * 4. 返回解析后的数据或 false
   *
   * @注意事项
   * - 如果存储的是 undefined，序列化后会变成 "null"
   * - 不存在的键返回 false，与存储 false 值的行为不同
   */
  async get(key) {
    const { redis } = this.app;

    // Redis 连接状态检查
    if (!redis) {
      return;
    }

    let data = await redis.get(key);

    // 键不存在时返回 false
    if (!data) return false;

    // 将 JSON 字符串反序列化为原始数据类型
    data = JSON.parse(data);
    return data;
  }

  /**
   * 删除指定的缓存键
   *
   * @param {String} key - 要删除的缓存键名
   * @return {Promise<Number>} 返回删除的键数量（0或1）
   *
   * @说明
   * - 返回值 1 表示键存在且被成功删除
   * - 返回值 0 表示键不存在
   */
  async del(key) {
    const { redis } = this.app;
    const data = await redis.del(key);
    return data;
  }

  /**
   * 清空整个 Redis 数据库
   * 危险操作：会删除所有数据，包括其他服务的缓存
   *
   * @return {Promise<void>} 无返回值
   *
   * @使用场景
   * - 测试环境数据清理
   * - 系统初始化
   * - 紧急数据清理
   *
   * @警告
   * 生产环境慎用，会影响所有使用同一 Redis 实例的服务
   */
  async flushall() {
    const { redis } = this.app;
    await redis.flushall();
    return;
  }

  /**
   * 向集合中添加成员
   * 集合特性：无序、成员唯一
   *
   * @param {String} key - 集合键名
   * @param {Array} values - 要添加的成员数组（当前实现只使用第一个元素）
   * @return {Promise<Number>} 返回成功添加的新成员数量
   *
   * @说明
   * - 已存在的成员不会被重复添加
   * - 返回值 1 表示添加了新成员，0 表示成员已存在
   *
   * @使用场景
   * - 用户标签管理
   * - 好友关系存储
   * - 唯一值集合
   */
  async sSet(key, values) {
    const { redis } = this.app;
    const prefix = redisPrefix;

    // 注意：当前实现只添加数组的第一个元素
    // 可以考虑扩展支持添加多个成员
    const result = await redis.sadd(prefix + key, values[0]);
    return result;
  }

  /**
   * 获取集合中的所有成员
   *
   * @param {String} key - 集合键名
   * @return {Promise<Array>} 返回集合中的所有成员数组
   *
   * @说明
   * - 返回无序的成员数组
   * - 集合为空时返回空数组
   */
  async sGet(key) {
    const { redis } = this.app;
    const prefix = redisPrefix;
    const result = await redis.smembers(prefix + key);
    return result;
  }

  /**
   * 获取哈希表中指定字段的值
   *
   * @param {String} key - 哈希表键名
   * @param {String} field - 字段名
   * @return {Promise<*|boolean>} 返回字段值，字段不存在时返回 false
   *
   * @使用场景
   * - 用户对象属性存储
   * - 配置信息管理
   * - 对象的部分更新
   */
  async hGet(key, field) {
    const { redis } = this.app;
    const prefix = redisPrefix;
    const result = await redis.hget(prefix + key, field);

    if (!result) {
      return false;
    }
    return result;
  }

  /**
   * 设置哈希表中字段的值
   * 如果哈希表不存在会自动创建
   *
   * @param {String} key - 哈希表键名
   * @param {String} field - 字段名
   * @param {*} value - 字段值
   * @param {Number} [timeSec=0] - 整个哈希表的过期时间（秒），0表示不过期
   * @return {Promise<Number|boolean>} 返回操作结果
   *
   * @说明
   * - 返回值 1 表示新建了字段，0 表示更新了已有字段
   * - 设置过期时间失败时返回 false
   *
   * @使用场景
   * - 缓存用户完整信息
   * - 存储对象的多属性数据
   * - 计数器集合
   */
  async hSet(key, field, value, timeSec) {
    const { redis } = this.app;
    const prefix = redisPrefix;

    // 设置哈希字段值
    const result = await redis.hset(prefix + key, field, value);

    // 如果指定了过期时间，为整个哈希表设置过期时间
    if (timeSec > 0) {
      if (!(await redis.expire(redisPrefix + key, timeSec))) {
        return false;
      }
    }
    return result;
  }

  /**
   * 删除哈希表中的指定字段
   *
   * @param {String} key - 哈希表键名
   * @param {String} field - 要删除的字段名
   * @return {Promise<Number>} 返回成功删除的字段数量（0或1）
   */
  async hDel(key, field) {
    const { redis } = this.app;
    const prefix = redisPrefix;
    const result = await redis.hdel(prefix + key, field);
    return result;
  }

  /**
   * 检查哈希表中字段是否存在
   *
   * @param {String} key - 哈希表键名
   * @param {String} field - 要检查的字段名
   * @return {Promise<Number>} 返回 1 表示存在，0 表示不存在
   */
  async hExists(key, field) {
    const { redis } = this.app;
    const prefix = redisPrefix;
    const result = await redis.hexists(prefix + key, field);
    return result;
  }

  /**
   * 检查键是否存在
   *
   * @param {String} key - 要检查的键名
   * @return {Promise<Number>} 返回 1 表示存在，0 表示不存在
   */
  async exists(key) {
    const { redis } = this.app;
    const result = await redis.exists(key);
    return result;
  }

  /**
   * 获取键的剩余生存时间
   *
   * @param {String} key - 要检查的键名
   * @return {Promise<Number>} 返回剩余生存时间（秒）
   *
   * @返回值说明
   * - -2: 键不存在
   * - -1: 键存在但没有设置过期时间
   * - 正数: 剩余的生存时间（秒）
   */
  async ttl(key) {
    const { redis } = this.app;
    const result = await redis.ttl(key);
    return result;
  }

  /**
   * 为键设置过期时间
   *
   * @param {String} key - 要设置过期时间的键名
   * @param {Number} timeSec - 过期时间（秒）
   * @return {Promise<Number>} 返回 1 表示设置成功，0 表示键不存在
   */
  async expire(key, timeSec) {
    const { redis } = this.app;
    const result = await redis.expire(key, timeSec);
    return result;
  }

  /**
   * 获取 Redis 服务器信息
   *
   * @param {String} [sections] - 信息章节，如 'server', 'clients', 'memory' 等
   * @return {Promise<Object>} 返回解析后的 Redis 信息对象
   *
   * @使用场景
   * - Redis 状态监控
   * - 性能分析和调优
   * - 容量规划
   */
  async info(sections) {
    const { redis } = this.app;

    // 获取 Redis INFO 命令的输出
    const infoStr = sections ? await redis.info(sections) : await redis.info();
    const res = {};

    // 按行解析 INFO 输出
    const lines = infoStr.split('\r\n');
    for (let i = 0; i < lines.length; i++) {
      // 跳过空行和注释行
      if (lines[i] === '' || lines[i].startsWith('# ')) {
        continue;
      }

      // 按冒号分割键值对
      const [ k, v ] = lines[i].split(':');
      res[k] = v;
    }

    return res;
  }

  /**
   * 获取当前数据库的键数量
   *
   * @return {Promise<Number>} 返回当前数据库中的键总数
   *
   * @使用场景
   * - 监控缓存数据量
   * - 容量预警
   * - 性能分析
   */
  async dbSize() {
    const { redis } = this.app;
    const res = await redis.dbsize();
    return res;
  }
}

// 导出 RedisService 类，供整个应用使用
module.exports = RedisService;
