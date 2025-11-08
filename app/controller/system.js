'use strict';

/**
 * system.js 是系统核心功能控制器，处理用户登录认证、菜单权限、系统配置、登出
 * 等核心系统操作，是整个后台管理系统的入口和基础功能模块。
 */

// 引入基础控制器，继承统一的响应方法
const baseController = require('./baseController');
// 引入 MD5 加密模块，用于密码加密验证
const md5 = require('md5');
// 引入系统配置常量
const {
  backstageTokenSet,
  backstageTokenKey,
  reqRoleIdKey,
} = require('../extend/config');

/**
 * 系统核心功能控制器
 * 处理用户登录认证、菜单权限、系统配置、登出等核心系统操作
 * 是整个后台管理系统的入口和基础功能模块
 */
class SystemController extends baseController {

  /**
   * 用户登录接口
   * 处理管理员登录认证，包含密码验证、Token生成、登录日志记录等功能
   * 路由: POST /api/system/login
   *
   * @流程说明
   * 1. 参数验证 → 2. 用户查询 → 3. 状态检查 → 4. 密码验证 → 5. Token生成
   * 6. 登录控制 → 7. 缓存设置 → 8. 信息更新 → 9. 日志记录 → 10. 返回Token
   */
  async login() {
    const { ctx } = this;
    const body = ctx.request.body;
    try {
      // 1. 参数验证：验证用户名和密码的格式和必填性
      this.ctx.validate({
        username: { type: 'string', min: 2, max: 20, require: true },
        password: { type: 'string', min: 6, max: 20, require: true },
      });

      // 2. 根据用户名查询管理员信息
      const sysAdmin = await ctx.model.SystemAuthAdmin.findOne({
        where: {
          username: body.username,
        },
      });

      /**
       * 用户状态代码
       * @param 1001 用户不存在
       * @param 1002 密码错误或请求错误
       * @param 1003 用户被禁用
       * @param 1004 该账户已被删除
       */

      // 3. 用户存在性检查
      if (!sysAdmin) {
        this.result({ data: '', message: '没有找到该用户', code: 1001 });
        return;
      }

      // 4. 用户状态检查：是否被删除
      if (sysAdmin.is_delete === 1) {
        this.result({ data: '', message: '该账户已被删除', code: 1004 });
        return;
      }

      // 5. 用户状态检查：是否被禁用
      if (sysAdmin.is_disable === 1) {
        this.result({ data: '', message: '该账户已被禁用', code: 1003 });
        return;
      }

      // 6. 密码验证：使用 MD5(密码 + 盐值) 进行加密验证
      const md5Pwd = md5(body.password + sysAdmin.salt);
      if (sysAdmin.password !== md5Pwd) {
        this.result({ data: '', message: '密码错误', code: 1002 });
        return;
      }

      // 7. 生成登录 Token（基于用户名和密码）
      const token = ctx.setToken({ password: body.password, username: body.username });
      const adminIdStr = String(sysAdmin.id);

      // 8. 单点登录控制：如果用户设置为非多点登录，则清除之前的登录状态
      if (sysAdmin.is_multipoint === 0) {
        const sysAdminSetKey = backstageTokenSet + adminIdStr;
        // 获取该用户的所有历史 Token
        const ts = ctx.service.redis.sGet(sysAdminSetKey);
        if (ts.length > 0) {
          const keys = [];
          // 构建要删除的 Token 键列表
          for (const t of ts) {
            keys.push(t);
          }
          // 删除所有历史 Token 缓存
          ctx.service.redis.del(keys);
        }
        // 删除用户的 Token 集合
        ctx.service.redis.del(sysAdminSetKey);
        // 设置新的 Token 到集合中
        ctx.service.redis.sSet(sysAdminSetKey, token);
      }

      // 9. 缓存登录信息：Token 与用户ID的映射关系，有效期2小时
      ctx.service.redis.set(backstageTokenKey + token, adminIdStr, 7200);
      // 缓存用户信息到 Redis
      ctx.service.authAdmin.cacheAdminUserByUid(sysAdmin.id);

      // 10. 更新用户登录信息：最后登录IP、最后登录时间等
      const dateTime = Math.floor(Date.now() / 1000);
      await ctx.model.SystemAuthAdmin.update({
        last_login_ip: ctx.request.ip,
        last_login_time: dateTime,
        update_time: dateTime,
      }, {
        where: {
          id: sysAdmin.id,
        },
      });

      // 11. 记录登录日志，包含用户代理信息等
      const resultLog = await ctx.service.authAdmin.recordLoginLog(sysAdmin.id, body.username, '');
      if (!resultLog) {
        this.result({ data: '', message: '请求错误', code: 1002 });
        return;
      }

      // 12. 返回登录成功的 Token
      this.result({
        data: {
          token,
        },
      });
    } catch (err) {
      // 13. 错误处理：参数验证失败或其他异常
      const { errors = [] } = err;
      this.result({ data: '', message: errors[0].message, code: 1001 });
    }
  }

  /**
   * 获取菜单路由
   * 根据当前用户的角色ID获取对应的菜单权限和路由信息
   * 路由: GET /api/system/menusRoute
   *
   * @返回数据 树形结构的菜单列表，用于前端动态生成导航菜单
   */
  async menusRoute() {
    const { ctx } = this;
    // 从会话中获取当前用户的角色ID
    const roleId = ctx.session[reqRoleIdKey];
    // 根据角色ID查询对应的菜单权限
    const data = await ctx.service.authAdmin.selectMenuByRoleId(roleId);
    this.result({
      data,
    });
  }

  /**
   * 获取控制台数据
   * 返回系统控制台所需的统计数据和图表信息
   * 路由: GET /api/system/console
   *
   * @使用场景 管理员登录后的首页仪表盘
   */
  async console() {
    const { ctx } = this;
    try {
      // 获取控制台统计信息，如用户数、订单数、访问量等
      const data = await ctx.service.common.getConsole();
      this.result({
        data,
      });
    } catch (err) {
      // 错误日志记录，但不中断请求
      ctx.logger.error(`systemController.console error: ${err}`);
    }
  }

  /**
   * 获取系统配置信息
   * 返回系统的基础配置参数和设置信息
   * 路由: GET /api/system/configInfo
   *
   * @使用场景 前端初始化时获取系统配置
   */
  async configInfo() {
    const { ctx } = this;
    try {
      // 获取系统配置信息，如站点名称、Logo、主题设置等
      const data = await ctx.service.common.getConfig();
      this.result({
        data,
      });
    } catch (err) {
      // 错误日志记录
      ctx.logger.error(`systemController.config error: ${err}`);
    }
  }

  /**
   * 用户退出登录
   * 清除用户的登录状态和Token缓存
   * 路由: POST /api/system/logout
   *
   * @安全机制 立即失效Token，防止被继续使用
   */
  async logout() {
    const { ctx } = this;
    const { req } = ctx;
    try {
      // 从Redis中删除对应的Token缓存，立即失效
      ctx.service.redis.del(backstageTokenKey + req.token);
      this.result({ data: '' });
    } catch (err) {
      // 退出登录错误记录
      ctx.logger.error(`systemController.logout error: ${err}`);
    }
  }

  /**
   * 获取站点IP信息
   * 查询当前请求的IP地址相关信息
   * 路由: GET /api/system/siteIpInfo
   *
   * @使用场景 地理位置显示、访问分析等
   */
  async siteIpInfo() {
    const { data, error } = await this.ctx.service.user.ipInfo();
    if (error) {
      this.result({ data: '', message: error, code: 1001 });
    } else {
      this.result({ data });
    }
  }
}

// 导出系统控制器类
module.exports = SystemController;
