/* eslint-disable jsdoc/check-tag-names */
'use strict';

/**
 * server.js - 系统监控服务模块
 *
 * 功能：收集和提供服务器运行状态、性能指标和环境信息
 * 负责监控系统资源使用情况，为系统管理和性能优化提供数据支持
 *
 * 核心特性：
 * - CPU 使用率监控和统计
 * - 内存使用情况分析
 * - 系统环境信息收集
 * - Node.js 运行状态监控
 * - 磁盘空间监控（待实现）
 */

// 引入操作系统模块，用于获取系统信息
const os = require('os');
// 引入自定义工具函数库
const util = require('./index');
// 引入 IP 地址处理库
const ip = require('ip');
// 引入进程模块，用于获取 Node.js 进程信息
const process = require('process');
// 获取 Node.js 运行时版本
const runtime = require('process').version;

/**
 * 系统监控服务模块
 * 提供服务器运行状态和性能指标的收集功能
 *
 * @模块功能
 * - CPU 信息监控：使用率、核心数、负载统计
 * - 内存信息监控：总量、使用量、空闲量、使用率
 * - 系统环境信息：主机名、IP、操作系统、架构
 * - Node.js 环境信息：版本、路径、运行状态
 * - 磁盘信息监控：待实现功能
 *
 * @使用场景
 * - 系统管理后台的监控面板
 * - 性能分析和优化
 * - 资源使用预警
 * - 系统健康状态检查
 */
module.exports = {
  /**
   * 获取 CPU 信息和使用情况
   * 统计所有 CPU 核心的使用时间，计算总体使用率
   *
   * @return {Promise<Object>} 返回 CPU 信息对象
   * @return {number} return.cpu_num - CPU 核心数量
   * @return {number} return.total - 总 CPU 时间（单位未指定，可能是毫秒或滴答数）
   * @return {number} return.sys - 系统态 CPU 使用率（0-1之间的小数）
   * @return {number} return.used - 用户态 CPU 使用率（0-1之间的小数）
   * @return {number} return.free - 空闲 CPU 比率（0-1之间的小数）
   *
   * @指标说明
   * - user: 用户程序运行时间
   * - nice: 低优先级用户程序运行时间
   * - sys: 系统内核运行时间
   * - idle: 空闲时间
   * - irq: 中断处理时间
   *
   * @计算原理
   * 1. 累加所有 CPU 核心的各项时间
   * 2. 计算总时间 = user + nice + sys + idle + irq
   * 3. 各项使用率 = 该项时间 / 总时间
   *
   * @示例返回值
   * {
   *   cpu_num: 8,
   *   total: 3846294.12,
   *   sys: 0.15,
   *   used: 0.25,
   *   free: 0.60
   * }
   */
  async getCpuInfo() {
    // 获取所有 CPU 核心的信息
    const cpus = os.cpus();

    // 初始化时间统计变量
    let user = 0, // 用户程序运行时间
      nice = 0, // 低优先级用户程序运行时间
      sys = 0, // 系统内核运行时间
      idle = 0, // 空闲时间
      irq = 0, // 中断处理时间
      total = 0; // 总时间

    // 遍历所有 CPU 核心，累加各项时间
    for (const cpu in cpus) {
      const times = cpus[cpu].times;
      user += times.user;
      nice += times.nice;
      sys += times.sys;
      idle += times.idle;
      irq += times.irq;
    }

    // 计算总时间
    total += user + nice + sys + idle + irq;

    // 返回格式化后的 CPU 信息
    return {
      cpu_num: cpus.length, // CPU 核心数量
      total: util.round(total, 2), // 总 CPU 时间
      sys: util.round(sys / total, 2), // 系统态使用率
      used: util.round(user / total, 2), // 用户态使用率
      // wait: util.round(wait/total, 2),      // 等待IO时间（当前未计算）
      free: util.round(idle / total, 2), // 空闲比率
    };
  },

  /**
   * 获取内存信息和使用情况
   * 统计系统总内存和 Node.js 进程内存使用情况
   *
   * @return {Promise<Object>} 返回内存信息对象
   * @return {number} return.total - 总内存大小（GB）
   * @return {number} return.used - 已使用内存大小（GB）
   * @return {number} return.free - 空闲内存大小（GB）
   * @return {number} return.usage - 内存使用率（百分比）
   *
   * @指标说明
   * - totalmem: 系统总物理内存
   * - rss: Resident Set Size，进程占用物理内存
   * - free: 系统空闲物理内存
   * - usage: 内存使用百分比
   *
   * @单位换算
   * 1 GB = 1024 * 1024 * 1024 字节
   *
   * @注意
   * 这里统计的是 Node.js 进程的 RSS 内存，不是系统总使用内存
   * 系统总使用内存需要通过其他方式获取
   *
   * @示例返回值
   * {
   *   total: 16.00,
   *   used: 2.50,
   *   free: 13.50,
   *   usage: 15.63
   * }
   */
  async getMemInfo() {
    // 定义单位换算基数：1GB = 1024^3 字节
    const number = Math.pow(1024, 3);

    // 获取系统总物理内存
    const total = await os.totalmem();

    // 获取 Node.js 进程的常驻内存集大小
    const used = process.memoryUsage().rss;

    // 计算系统空闲内存（注意：这里计算的是系统空闲，不是进程空闲）
    const free = total - used;

    // 计算内存使用率（进程内存占系统总内存的百分比）
    const usage = (used / total) * 100;

    // 返回格式化后的内存信息（转换为 GB 单位）
    return {
      total: util.round(total / number, 2), // 总内存（GB）
      used: util.round(used / number, 2), // 已使用内存（GB）
      free: util.round(free / number, 2), // 空闲内存（GB）
      usage: util.round(usage, 2), // 使用率（百分比）
    };
  },

  /**
   * 获取系统环境信息
   * 收集服务器的基础环境配置信息
   *
   * @return {Promise<Object>} 返回系统环境信息对象
   * @return {string} return.computerName - 计算机名称/主机名
   * @return {string} return.computerIp - 服务器 IP 地址
   * @return {string} return.userDir - 用户主目录路径
   * @return {string} return.osName - 操作系统名称
   * @return {string} return.osArch - 操作系统架构
   *
   * @信息说明
   * - hostname: 网络主机名
   * - IP: 服务器主要网络接口的 IP 地址
   * - homedir: 当前用户的主目录
   * - type: 操作系统类型（Linux、Windows_NT、Darwin）
   * - arch: 处理器架构（x64、arm、ia32等）
   *
   * @使用场景
   * - 服务器标识和识别
   * - 环境配置检查
   * - 部署环境验证
   *
   * @示例返回值
   * {
   *   computerName: "web-server-01",
   *   computerIp: "192.168.1.100",
   *   userDir: "/home/user",
   *   osName: "Linux",
   *   osArch: "x64"
   * }
   */
  async getSysInfo() {
    // 获取计算机主机名
    const computerName = os.hostname();

    // 获取服务器 IP 地址（自动检测）
    const computerIp = ip.address();

    // 获取当前用户的主目录
    const userDir = os.homedir();

    // 获取操作系统名称
    const osName = os.type();

    // 获取操作系统架构
    const osArch = os.arch();

    // 返回系统环境信息
    return {
      computerName,
      computerIp,
      userDir,
      osName,
      osArch,
    };
  },

  /**
   * 获取磁盘信息（待实现）
   * 计划用于收集磁盘空间使用情况
   *
   * @return {Promise<Array>} 返回磁盘信息数组（当前返回空数组）
   *
   * @计划功能
   * - 各磁盘分区的总空间
   * - 已使用空间
   * - 空闲空间
   * - 使用率
   * - 文件系统类型
   *
   * @实现建议
   * 可以使用以下方式实现：
   * 1. 使用 `require('diskusage')` 第三方库（跨平台）
   * 2. 使用 `child_process` 执行系统命令（平台相关）
   * 3. 使用 `require('fs').statfs`（Linux/Mac）
   *
   * @当前状态
   * 功能尚未实现，返回空数组
   */
  async getDiskInfo() {
    const data = [];
    // TODO: 实现磁盘信息收集功能
    return data;
  },

  /**
   * 获取 Node.js 环境及服务信息
   * 收集 Node.js 运行时的版本、路径等信息
   *
   * @return {Promise<Object>} 返回 Node.js 环境信息对象
   * @return {string} return.name - 运行时名称（固定为 "Node"）
   * @return {string} return.version - Node.js 版本号
   * @return {string} return.home - Node.js 可执行文件路径
   *
   * @注释说明
   * 原代码中包含更多进程信息的获取，但由于以下原因被注释：
   * 1. process.getProcess 和 process.getMemoryInfo 不是 Node.js 标准 API
   * 2. 进程启动时间等信息获取方式因平台而异
   * 3. 内存信息在 getMemInfo 中已有部分统计
   *
   * @可扩展信息
   * - 进程运行时间
   * - 进程启动时间
   * - 命令行参数
   * - 环境变量
   * - 堆内存使用详情
   *
   * @示例返回值
   * {
   *   name: "Node",
   *   version: "v16.14.2",
   *   home: "/usr/local/bin/node"
   * }
   */
  async getNodeInfo() {
    // 以下代码被注释，因为相关 API 不是 Node.js 标准功能
    // const number = Math.pow(1024, 2);
    // console.log(process, 'os.getpid()....')
    // const curProc = await process.getProcess(process.pid);
    // const memInfo = await process.getMemoryInfo(curProc.pid);
    // const startTime = curProc.createTime;

    // 返回基础的 Node.js 环境信息
    return {
      name: 'Node', // 运行时名称
      version: runtime, // Node.js 版本
      home: process.argv[0], // Node.js 可执行文件路径

      // 以下字段需要额外实现
      // inputArgs: process.argv.slice(1).join(', '),      // 启动参数
      // total: util.round(memInfo.vms / number, 2),       // 虚拟内存大小
      // max: util.round(memInfo.vms / number, 2),         // 最大内存
      // free: util.round((memInfo.vms - memInfo.rss) / number, 2), // 空闲内存
      // usage: util.round(memInfo.rss / number, 2),       // 内存使用量
      // runTime: util.getFmtTime(Date.now() - startTime), // 运行时长
      // startTime: new Date(startTime).toISOString(),     // 启动时间
    };
  },
};
