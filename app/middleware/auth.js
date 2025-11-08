'use strict';

/**
 * auth.js 是系统核心认证授权中间件，负责处理用户 Token 验证、
 * 权限检查、会话管理等功能，是系统安全防护的第一道防线。
 */

// 引入系统配置常量
const {
  notAuthUri, // 免权限验证的接口列表
  notLoginUri, // 免登录验证的接口列表
  backstageTokenKey, // Token 缓存键前缀
  backstageManageKey, // 管理员信息缓存键
  backstageRolesKey, // 角色权限缓存键
  reqAdminIdKey, // 会话中管理员ID的键名
  reqRoleIdKey, // 会话中角色ID的键名
  reqUsernameKey, // 会话中用户名的键名
  reqNicknameKey, // 会话中昵称的键名
} = require('../extend/config');

/**
 * Token 认证授权中间件
 * 负责用户身份验证、权限检查、会话管理等安全功能
 *
 * @param {Object} options - 中间件配置选项
 * @return {Function} 返回 Egg.js 中间件函数
 *
 * @功能特性
 * - Token 有效性验证
 * - 用户状态检查（删除、禁用）
 * - 自动 Token 续签
 * - 基于角色的权限控制
 * - 会话信息管理
 * - 接口访问权限验证
 */
module.exports = options => {

  /**
   * Token 认证中间件主函数
   * 处理每个请求的身份验证和权限检查
   *
   * @param {Object} ctx - Egg.js 上下文对象
   * @param {Function} next - 下一个中间件函数
   *
   * @验证流程
   * 1. 免登录接口检查 → 2. Token 存在性验证 → 3. Token 有效性检查
   * 4. 用户状态检查 → 5. Token 自动续签 → 6. 会话信息保存
   * 7. 免权限接口检查 → 8. 角色权限验证 → 9. 接口权限验证
   */
  async function tokenAuth(ctx, next) {
    // 输出中间件配置和免登录接口列表（用于调试）
    console.log(options);
    console.log(notLoginUri, '这里是中间件。');

    // 获取请求 URL 并转换为权限标识格式
    const url = ctx.request.url;
    // 将 URL 路径转换为权限标识，例如: /api/system/login → system:login
    const auths = replaceAll(url.replace('/api/', ''), '/', ':');

    /**
     * 步骤1: 免登录接口检查
     * 检查当前请求是否在免登录接口列表中
     * 如果是免登录接口，直接放行到下一个中间件
     */
    if (notLoginUri.includes(auths)) {
      await next();
      return;
    }

    /**
     * 步骤2: Token 存在性验证
     * 检查请求头中是否包含 Token
     * 如果 Token 为空，返回 403 错误
     */
    const token = ctx.request.header.token;
    if (!token) {
      ctx.response.status = 403;
      ctx.body = { code: 332, data: '', message: 'token参数为空' };
      return;
    }

    /**
     * 步骤3: Token 有效性验证
     * 检查 Token 在 Redis 中是否存在及是否有效
     */
    const tokenKey = backstageTokenKey + token;
    const exist = await ctx.service.redis.exists(tokenKey);

    // Redis 操作异常处理
    if (exist < 0) {
      ctx.response.status = 403;
      ctx.body = { code: 500, data: '', message: '系统错误' };
      return;
    }
    // Token 不存在或已过期
    else if (exist === 0) {
      ctx.response.status = 403;
      ctx.body = { code: 333, data: '', message: 'token参数无效' };
      return;
    }

    /**
     * 步骤4: 用户信息获取和验证
     * 从 Redis 中获取用户ID并验证用户状态
     */

    // 从 Redis 中获取用户ID
    const uidStr = await ctx.service.redis.get(tokenKey);
    const uid = uidStr === '' ? 0 : parseInt(uidStr, 10);

    // 用户ID格式验证
    if (isNaN(uid)) {
      ctx.response.status = 403;
      ctx.body = { code: 333, data: '', message: 'token参数无效' };
      return;
    }

    /**
     * 步骤5: 用户信息缓存检查
     * 检查用户信息是否已缓存，如果未缓存则从数据库加载
     */
    const hexist = await ctx.service.redis.hExists(backstageManageKey, uidStr);
    if (!hexist) {
      // 缓存用户信息到 Redis
      ctx.service.authAdmin.CacheAdminUserByUid(uid);
    }

    /**
     * 步骤6: 用户状态检查
     * 检查用户是否被删除或禁用
     */

    // 从 Redis 中获取用户信息
    const userInfo = JSON.parse(await ctx.service.redis.hGet(backstageManageKey, uidStr));

    // 检查用户是否被删除
    if (userInfo.is_delete === 1) {
      // 清理相关缓存
      await ctx.service.redis.del(tokenKey);
      await ctx.service.redis.hDel(backstageManageKey + uidStr);
      ctx.response.status = 403;
      ctx.body = { code: 333, data: '', message: '用户被删除' };
      return;
    }

    // 检查用户是否被禁用
    if (userInfo.is_disable === 1) {
      ctx.response.status = 403;
      ctx.body = { code: 331, data: '', message: '登录账号已被禁用了' };
      return;
    }

    /**
     * 步骤7: Token 自动续签
     * 当 Token 剩余时间小于30分钟时自动续签2小时
     */
    const ttl = await ctx.service.redis.ttl(tokenKey);
    if (ttl < 1800) {
      ctx.service.redis.expire(tokenKey, 7200);
    }

    /**
     * 步骤8: 会话信息保存
     * 将用户信息保存到会话中，供后续中间件和控制器使用
     */
    ctx.session[reqAdminIdKey] = uid;
    ctx.session[reqRoleIdKey] = userInfo.role;
    ctx.session[reqUsernameKey] = userInfo.username;
    ctx.session[reqNicknameKey] = userInfo.nickname;

    /**
     * 步骤9: 免权限验证检查
     * 检查是否为免权限接口或超级管理员
     * 超级管理员（UID=1）拥有所有权限
     */
    if (notAuthUri.includes(auths) || uid === 1) {
      await next();
      return;
    }

    /**
     * 步骤10: 角色权限验证
     * 验证用户角色对应的菜单权限
     */
    const roleId = userInfo.role;
    const hExists = ctx.service.redis.hExists(backstageRolesKey, roleId);

    // 如果角色权限未缓存，则从数据库加载并缓存
    if (hExists) {
      // 缓存角色菜单权限
      const roleMenu = await ctx.service.authAdmin.cacheRoleMenusByRoleId(roleId);
      if (!roleMenu) {
        ctx.response.status = 403;
        ctx.body = { code: 500, data: '', message: '系统错误' };
        return;
      }
    }

    /**
     * 步骤11: 接口权限验证
     * 检查当前用户是否有访问当前接口的权限
     */
    const menus = ctx.service.redis.hGet(backstageRolesKey, roleId);
    const menusArray = menus.split(',');

    // 验证用户权限列表中是否包含当前接口的权限标识
    if (!(menus !== '' && menusArray.includes(auths))) {
      ctx.response.status = 403;
      ctx.body = { code: 403, data: '', message: '无相关权限' };
      return;
    }

    /**
     * 步骤12: 验证通过，继续后续处理
     * 所有验证都通过后，执行下一个中间件或路由处理器
     */
    await next();
  }

  /**
   * 字符串替换工具函数
   * 将字符串中所有匹配的子串替换为指定内容
   *
   * @param {string} str - 原始字符串
   * @param {string} find - 要查找的子串
   * @param {string} replace - 替换为的子串
   * @return {string} 替换后的字符串
   *
   * @使用示例
   * replaceAll('system/user/list', '/', ':') → 'system:user:list'
   */
  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  }

  // 返回中间件函数
  return tokenAuth;
};