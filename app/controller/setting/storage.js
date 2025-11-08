'use strict';

/**
 * 存储配置控制器
 * 功能: 处理文件存储引擎的配置管理，支持多种存储方式（本地、阿里云OSS、腾讯云COS等）
 * 位置: app/controller/setting/storage.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 系统设置 - 存储引擎管理
 * 存储引擎说明:
 *   - 本地存储: 文件存储在服务器本地磁盘
 *   - 云存储: 文件存储在第三方云存储服务
 *   - 支持动态切换和配置不同的存储引擎
 */
const baseController = require('../baseController');

class SettingStorageController extends baseController {

  /**
   * 获取存储引擎列表
   * 接口地址: GET /api/setting/storage/list
   * 功能: 获取系统中所有可用的存储引擎配置列表
   * 权限: 需要管理员权限
   * 请求参数: 无
   * 返回数据: 存储引擎配置列表
   * 数据内容可能包括:
   *   - 存储引擎别名（唯一标识）
   *   - 存储引擎名称（显示用）
   *   - 存储类型（local、oss、cos等）
   *   - 状态（0-禁用，1-启用）
   *   - 配置信息（部分敏感信息可能隐藏）
   *   - 是否为当前使用引擎
   */
  async list() {
    const { ctx } = this;
    try {
      // 调用存储服务层获取所有存储引擎配置列表
      const data = await ctx.service.storage.list();
      // 返回存储引擎列表
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理：记录错误日志并返回500错误
      ctx.logger.error(`SettingStorageController.list error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取存储引擎详情
   * 接口地址: GET /api/setting/storage/detail
   * 功能: 根据别名获取指定存储引擎的详细配置信息
   * 权限: 需要管理员权限
   * 请求参数:
   *   - alias: 存储引擎别名（必填）
   * 返回数据: 存储引擎的完整配置详情
   * 数据内容可能包括:
   *   - 完整的配置参数（包含敏感信息如AccessKey等）
   *   - 存储引擎的详细描述
   *   - 支持的配置选项
   *   - 状态信息和启用时间
   */
  async detail() {
    const { ctx } = this;
    // 从查询参数获取存储引擎别名
    const { alias } = ctx.query;
    try {
      // 调用服务层获取指定存储引擎的详细配置
      const data = await ctx.service.storage.detail(alias);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingStorageController.details error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 编辑存储引擎配置
   * 接口地址: POST /api/setting/storage/edit
   * 功能: 更新指定存储引擎的配置信息
   * 权限: 需要管理员权限
   * 请求参数:
   *   - alias: 存储引擎别名（必填）
   *   - name: 存储引擎显示名称（可选）
   *   - config: 配置信息对象（必填）
   * 配置信息示例（阿里云OSS）:
   *   {
   *     "accessKeyId": "your_access_key",
   *     "accessKeySecret": "your_secret_key",
   *     "bucket": "your_bucket_name",
   *     "region": "oss-cn-hangzhou",
   *     "endpoint": "https://oss-cn-hangzhou.aliyuncs.com"
   *   }
   * 返回数据: 操作结果
   * 注意: 修改配置后可能需要重新初始化存储客户端
   */
  async edit() {
    const { ctx } = this;
    // 获取编辑存储配置的请求参数
    const editReq = ctx.request.body;
    try {
      // 调用服务层更新存储引擎配置
      const data = await ctx.service.storage.edit(editReq);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingStorageController.edit error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 切换存储引擎状态
   * 接口地址: POST /api/setting/storage/change
   * 功能: 启用或禁用指定的存储引擎
   * 权限: 需要管理员权限
   * 请求参数:
   *   - alias: 存储引擎别名（必填）
   *   - status: 目标状态（必填，1-启用，0-禁用）
   * 返回数据: 操作结果
   * 业务规则:
   *   - 同一时间只能有一个存储引擎处于启用状态
   *   - 启用一个存储引擎时会自动禁用其他存储引擎
   *   - 系统必须保证至少有一个可用的存储引擎
   * 使用场景: 在不同存储引擎之间切换，如从本地存储切换到云存储
   */
  async change() {
    const { ctx } = this;
    // 从请求体获取存储引擎别名和目标状态
    const { alias, status } = ctx.request.body;
    try {
      // 调用服务层执行存储引擎状态切换
      const data = await ctx.service.storage.change(alias, status);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`SettingStorageController.change error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出存储配置控制器类
module.exports = SettingStorageController;
