'use strict';

/**
 * 这个文件是相册相关的控制器，处理相册分类和文件的增删改查以及上传操作。
 * 文件功能概述：
该文件是相册模块的控制器，负责处理相册分类和相册文件的各类请求，包括：

相册分类的列表、添加、重命名、删除

相册文件的列表、重命名、移动、添加、删除

图片和视频的上传

每个方法都调用了对应的service方法进行业务处理，并捕获异常。

注意：这个控制器继承自baseController，所以可以使用this.result来统一返回格式。
 */

/**
 * 相册管理完整流程
 * 用户请求 → 认证中间件 → 权限验证 → 控制器接收参数 → 服务层业务处理 → 数据库操作 → 返回结果
 * 文件上传特殊流程
 * 文件上传请求 → 认证中间件 → 权限验证 → 获取文件流 → 服务层文件处理 → 文件存储 + 数据库记录 → 返回文件信息
 */

/**
 * 相册管理控制器
 * 功能: 处理图片/视频素材的分类管理和文件上传相关业务
 * 位置: app/controller/common/album.js
 * 继承: baseController - 拥有统一的响应格式方法
 * 业务模块: 素材管理中心
 */
const baseController = require('../baseController');

class CommonAblumController extends baseController {
  /**
   * 获取相册分类列表
   * 接口地址: GET /api/common/album/cateList
   * 功能: 查询所有相册分类，支持分页和搜索参数
   * 权限: 需要登录认证，无需特殊操作权限
   * 请求参数:
   *   - page: 页码（可选）
   *   - pageSize: 每页数量（可选）
   *   - keyword: 搜索关键词（可选）
   * 返回数据: 分类列表数据，包含分页信息
   */
  async cateList() {
    const { ctx } = this;
    try {
      // 从URL查询字符串获取请求参数
      const params = ctx.query;
      // 调用相册服务层的分类列表方法
      const data = await ctx.service.album.cateList(params);
      // 使用基类方法返回统一格式的成功响应
      this.result({
        data,
      });
    } catch (err) {
      // 错误处理：记录详细错误日志到应用日志系统
      ctx.logger.error(`CommonAblumController.cateList error: ${err}`);
      // 返回标准的HTTP 500错误响应
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 添加新的相册分类
   * 接口地址: POST /api/common/album/cateAdd
   * 功能: 创建新的素材分类目录
   * 权限: 需要管理员权限
   * 请求参数:
   *   - name: 分类名称（必填）
   *   - sort: 排序号（可选）
   *   - pid: 父级分类ID（可选）
   * 返回数据: 空对象，表示操作成功
   */
  async cateAdd() {
    const { ctx } = this;

    try {
      // 从请求体获取分类添加所需参数
      const addReq = ctx.request.body;

      // 调用服务层执行分类添加操作
      await ctx.service.album.cateAdd(addReq);

      // 返回成功响应，data为空对象表示操作成功
      this.result({
        data: {},
      });
    } catch (err) {
      // 错误处理
      ctx.logger.error(`CommonAblumController.cateAdd error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 重命名相册分类
   * 接口地址: POST /api/common/album/cateRename
   * 功能: 修改指定分类的名称
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 分类ID（必填）
   *   - name: 新的分类名称（必填）
   * 返回数据: 空对象，表示操作成功
   */
  async cateRename() {
    const { ctx } = this;

    try {
      // 从请求体解构出分类ID和新名称
      const { id, name } = ctx.request.body;

      // 调用服务层执行分类重命名操作
      await ctx.service.album.cateRename(id, name);

      // 返回成功响应
      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`CommonAblumController.cateRename error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 删除相册分类
   * 接口地址: POST /api/common/album/cateDel
   * 功能: 删除指定的分类（通常为软删除）
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 要删除的分类ID（必填）
   * 返回数据: 空对象，表示操作成功
   * 注意: 删除前应该检查分类下是否还有素材文件
   */
  async cateDel() {
    const { ctx } = this;

    try {
      // 获取要删除的分类ID
      const { id } = ctx.request.body;

      // 调用服务层执行分类删除操作
      await ctx.service.album.cateDel(id);

      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`CommonAblumController.cateDel error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 获取相册素材列表
   * 接口地址: GET /api/common/album/albumList
   * 功能: 查询指定分类下的所有图片/视频素材文件
   * 权限: 需要登录认证
   * 请求参数:
   *   - cid: 分类ID（可选，默认为所有分类）
   *   - page: 页码（可选）
   *   - pageSize: 每页数量（可选）
   *   - type: 文件类型（可选，10-图片，20-视频）
   * 返回数据: 素材列表，包含文件信息和分页数据
   */
  async albumList() {
    const { ctx } = this;
    try {
      // 获取查询参数
      const params = ctx.query;
      // 调用服务层获取素材列表
      const data = await ctx.service.album.albumList(params);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`CommonAblumController.albumList error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 重命名相册素材
   * 接口地址: POST /api/common/album/albumRename
   * 功能: 修改素材文件的显示名称
   * 权限: 需要管理员权限
   * 请求参数:
   *   - id: 素材文件ID（必填）
   *   - name: 新的文件名称（必填）
   * 返回数据: 空对象，表示操作成功
   */
  async albumRename() {
    const { ctx } = this;

    try {
      // 获取素材ID和新名称
      const { id, name } = ctx.request.body;

      // 调用服务层执行素材重命名
      await ctx.service.album.albumRename(id, name);

      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`CommonAblumController.albumRename error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 移动相册素材到其他分类
   * 接口地址: POST /api/common/album/albumMove
   * 功能: 将素材文件从一个分类移动到另一个分类
   * 权限: 需要管理员权限
   * 请求参数:
   *   - ids: 素材ID数组（必填，支持批量移动）
   *   - cid: 目标分类ID（必填）
   * 返回数据: 空对象，表示操作成功
   */
  async albumMove() {
    const { ctx } = this;
    const { request } = ctx;

    try {
      // 获取要移动的素材ID数组和目标分类ID
      const { ids, cid } = request.body;

      // 调用服务层执行批量移动操作
      await ctx.service.album.albumMove(ids, cid);
      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`CommonAblumController.albumMove error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 添加相册素材记录
   * 接口地址: POST /api/common/album/albumAdd
   * 功能: 手动添加素材记录到数据库（非文件上传）
   * 权限: 需要管理员权限
   * 请求参数:
   *   - name: 素材名称（必填）
   *   - cid: 分类ID（必填）
   *   - url: 素材文件路径（必填）
   *   - type: 文件类型（必填，10-图片，20-视频）
   * 返回数据: 包含新素材ID的对象
   */
  async albumAdd() {
    const { ctx } = this;
    const { request } = ctx;
    try {
      // 获取素材信息
      const addReq = request.body;

      // 调用服务层添加素材，返回新素材的ID
      const res = await ctx.service.album.albumAdd(addReq);

      // 返回包含新素材ID的响应，便于前端后续操作
      this.result({
        data: {
          id: res,
        },
      });
    } catch (err) {
      ctx.logger.error(`CommonAblumController.albumAdd error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 删除相册素材
   * 接口地址: POST /api/common/album/albumDel
   * 功能: 批量删除素材记录（可能包含物理文件删除）
   * 权限: 需要管理员权限
   * 请求参数:
   *   - ids: 素材ID数组（必填，支持批量删除）
   * 返回数据: 空对象，表示操作成功
   * 注意: 删除操作可能同时删除数据库记录和物理文件
   */
  async albumDel() {
    const { ctx } = this;
    const { request } = ctx;

    try {
      // 获取要删除的素材ID数组
      const { ids } = request.body;

      // 调用服务层执行批量删除
      await ctx.service.album.albumDel(ids);
      this.result({
        data: {},
      });
    } catch (err) {
      ctx.logger.error(`CommonAblumController.albumDel error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 上传图片文件
   * 接口地址: POST /api/common/upload/image
   * 功能: 处理图片文件上传，支持流式上传大文件
   * 权限: 需要管理员权限
   * 请求格式: multipart/form-data
   * 请求参数:
   *   - file: 图片文件（必填）
   *   - cid: 分类ID（可选，默认为0-未分类）
   * 返回数据: 包含文件URL和文件信息的对象
   * 技术特点: 使用流式处理，避免内存溢出
   */
  async uploadImage() {
    const { ctx } = this;
    try {
      // 获取文件流（Egg.js内置的文件上传处理方法）
      // 使用流式处理可以支持大文件上传，避免内存占用过高
      const stream = await ctx.getFileStream();
      // 从表单字段获取分类ID，默认为0（未分类）
      const cid = stream.fields.cid || 0;

      // 调用服务层处理文件上传
      // 不传递type参数，默认为图片类型(10)
      const data = await ctx.service.album.uploadFile(cid, stream);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`CommonAblumController.uploadImage error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }

  /**
   * 上传视频文件
   * 接口地址: POST /api/common/upload/video
   * 功能: 处理视频文件上传
   * 权限: 需要管理员权限
   * 请求格式: multipart/form-data
   * 请求参数:
   *   - file: 视频文件（必填）
   *   - cid: 分类ID（可选，默认为0-未分类）
   * 返回数据: 包含文件URL和文件信息的对象
   * 技术特点: 使用流式处理，支持大视频文件上传
   */
  async uploadVideo() {
    const { ctx } = this;
    try {
      // 获取文件流
      const stream = await ctx.getFileStream();
      // 获取分类ID
      const cid = stream.fields.cid || 0;
      // 指定文件类型为视频（type=20）
      const type = 20;

      // 调用服务层处理视频文件上传
      const data = await ctx.service.album.uploadFile(cid, stream, type);
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`CommonAblumController.uploadVideo error: ${err}`);
      ctx.body = 'Internal Server Error';
      ctx.status = 500;
    }
  }
}

// 导出控制器类，供路由系统使用
module.exports = CommonAblumController;
