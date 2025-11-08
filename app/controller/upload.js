'use strict';

/**
 * upload.js 是文件上传控制器，专门处理系统中图片和文件的上传功能，
 * 为前端提供统一的上传接口，支持多种文件类型的上传操作。
 */

// 引入基础控制器，继承统一的响应方法
const baseController = require('./baseController');

/**
 * 文件上传控制器
 * 专门处理系统中图片和文件的上传功能
 * 为前端提供统一的上传接口，支持多种文件类型的上传操作
 *
 * @功能特点
 * - 支持图片上传（jpg、png、gif等格式）
 * - 支持文件上传（文档、压缩包、视频等格式）
 * - 统一的文件处理和响应格式
 * - 集成到系统的文件管理体系中
 */
class UploadController extends baseController {

  /**
   * 图片上传接口
   * 处理图片文件的上传，包括验证、存储、缩略图生成等操作
   * 路由: POST /api/upload/img
   *
   * @支持格式 通常包括: jpg、jpeg、png、gif、webp 等常见图片格式
   // eslint-disable-next-line jsdoc/check-tag-names
   * @文件限制 大小限制、尺寸验证、格式白名单等（在配置文件中定义）
   *
   * @返回数据
   * {
   *   "code": 200,
   *   "data": {
   *     "url": "/uploads/images/2023/01/abc.jpg", // 文件访问URL
   *     "name": "example.jpg",                    // 文件名
   *     "size": 102400,                          // 文件大小(字节)
   *     "type": "image/jpeg"                     // 文件类型
   *   },
   *   "message": "上传成功"
   * }
   *
   * @使用场景
   * - 用户头像上传
   * - 文章封面图片
   * - 产品图片
   * - 富文本编辑器中的图片上传
   */
  async uploadImg() {
    const { ctx } = this;
    // 调用上传服务处理图片上传，包括文件验证、存储、路径生成等
    const result = await ctx.service.upload.uploadImg();
    // 返回标准化的上传结果
    this.result({ data: result });
  }

  /**
   * 文件上传接口
   * 处理各类文件的上传，支持文档、压缩包、视频等多种格式
   * 路由: POST /api/upload/file
   *
   * @支持格式 基于配置的白名单，通常包括:
   * - 文档类: txt、pdf、doc、docx、xls、xlsx、ppt、pptx
   * - 压缩包: zip、rar、7z
   * - 视频类: mp4、avi、mov、wmv
   * - 其他: 根据业务需求配置
   *
   * @返回数据
   * {
   *   "code": 200,
   *   "data": {
   *     "url": "/uploads/files/2023/01/document.pdf", // 文件访问URL
   *     "name": "document.pdf",                       // 文件名
   *     "size": 2048000,                             // 文件大小(字节)
   *     "type": "application/pdf",                   // 文件类型
   *     "ext": "pdf"                                 // 文件扩展名
   *   },
   *   "message": "上传成功"
   * }
   *
   * @使用场景
   * - 文档资料上传
   * - 产品资料下载
   * - 视频课程文件
   * - 附件管理
   */
  async uploadFile() {
    const { ctx } = this;
    // 调用上传服务处理文件上传，包含格式验证、安全扫描、存储管理等
    const result = await ctx.service.upload.uploadFile();
    // 返回标准化的上传结果
    this.result({ data: result });
  }

}

// 导出上传控制器类
module.exports = UploadController;
