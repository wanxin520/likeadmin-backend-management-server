'use strict';

/**
 * 系统监控控制器
 * 功能: 处理系统服务器状态监控和Redis缓存监控相关业务
 * 位置: app/controller/monitor/monitor.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 系统监控模块
 */
const baseController = require('../baseController');
// 引入服务器监控工具类，用于获取系统硬件和运行状态信息
const serverUtil = require('../../util/server');

class MonitorController extends baseController {

  /**
   * 获取服务器状态信息
   * 接口地址: GET /api/monitor/server
   * 功能: 获取服务器的CPU、内存、磁盘、系统和Node.js运行状态信息
   * 权限: 需要管理员权限
   * 返回数据: 包含服务器各项指标的完整状态对象
   * 监控指标:
   *   - CPU使用率、负载、核心数
   *   - 内存使用情况（总量、已用、空闲）
   *   - 磁盘使用情况（各分区使用率）
   *   - 系统信息（运行时间、操作系统等）
   *   - Node.js运行状态（版本、内存使用等）
   */
  async server() {
    // 并行获取各项服务器指标信息，提高接口响应速度
    const cpu = await serverUtil.getCpuInfo(); // CPU信息：使用率、负载、核心数等
    const mem = await serverUtil.getMemInfo(); // 内存信息：总量、已用、空闲、缓存等
    const sys = await serverUtil.getSysInfo(); // 系统信息：运行时间、操作系统、主机名等
    const disk = await serverUtil.getDiskInfo(); // 磁盘信息：各分区使用情况、IO状态等
    const node = await serverUtil.getNodeInfo(); // Node.js信息：版本、运行时间、内存使用等

    // 返回完整的服务器状态信息
    this.result({
      data: {
        cpu, // CPU相关监控数据
        mem, // 内存相关监控数据
        sys, // 系统相关监控数据
        disk, // 磁盘相关监控数据
        node, // Node.js运行时监控数据
      },
    });
  }

  /**
   * 获取Redis缓存状态信息
   * 接口地址: GET /api/monitor/cache
   * 功能: 获取Redis服务器的运行状态、命令统计和数据库大小信息
   * 权限: 需要管理员权限
   * 返回数据: Redis服务器的详细运行状态信息
   * 监控指标:
   *   - Redis基本信息（版本、运行模式、连接数等）
   *   - 命令执行统计（各命令调用次数）
   *   - 数据库键数量
   *   - 内存使用情况
   *   - 持久化状态
   */
  async cache() {
    const { ctx } = this;
    // 获取Redis命令统计信息，包含各个命令的执行次数和耗时
    const cmdStatsMap = await ctx.service.redis.info('commandstats');
    const stats = [];

    // 解析命令统计信息，转换为前端友好的格式
    for (const [ k, v ] of Object.entries(cmdStatsMap)) {
      // 命令统计原始格式: "cmdstat_get:calls=21,usec=175,usec_per_call=8.33"
      // 解析出命令名称和调用次数
      stats.push({
        name: k.split('_')[1], // 提取命令名称，如从"cmdstat_get"中提取"get"
        value: v.slice(v.indexOf('=') + 1, v.indexOf(',')), // 提取调用次数
      });
    }

    // 获取Redis服务器的完整信息
    const info = await ctx.service.redis.info();
    // 获取当前数据库的键数量
    const dbSize = await ctx.service.redis.dbSize();

    // 返回Redis监控数据
    this.result({
      data: {
        info, // Redis服务器的完整信息
        commandStats: stats, // 命令执行统计
        dbSize, // 当前数据库的键数量
      },
    });
  }
}

// 导出监控控制器类
module.exports = MonitorController;
