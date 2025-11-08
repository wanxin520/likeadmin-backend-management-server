'use strict';

// 引入必要的依赖模块
const Service = require('egg').Service;
const Sequelize = require('sequelize');
const Op = Sequelize.Op; // Sequelize 操作符
const util = require('../util'); // 自定义工具函数
const urlUtil = require('../util/urlUtil'); // URL处理工具
const path = require('path'); // Node.js路径模块
const { reqAdminIdKey } = require('../extend/config'); // 配置中的管理员ID键名
const fs = require('fs'); // 文件系统模块

// 异步二进制写入流处理
const awaitWriteStream = require('await-stream-ready').write;
// 管道读入虫洞（用于处理流错误）
const sendToWormhole = require('stream-wormhole');
// 递归创建目录
const mkdirp = require('mkdirp');
// 日期处理库
const dayjs = require('dayjs');

/**
 * 相册服务类
 * 功能：处理相册分类、文件管理、文件上传等业务逻辑
 * 服务层负责核心业务逻辑，与数据库交互
 */
class AlbumService extends Service {

  /**
   * 获取相册分类列表
   * @param {Object} listReq 请求参数 {type, name}
   * @return {Array} 树形结构的分类列表
   */
  async cateList(listReq) {
    const { ctx } = this;

    // 解构请求参数
    const { type, name } = listReq;

    // 构建查询条件
    const where = {
      isDelete: 0, // 只查询未删除的记录
    };

    // 按类型筛选
    if (type > 0) {
      where.type = type;
    }

    // 按名称模糊搜索
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    // 查询数据库获取分类列表
    const cates = await ctx.model.AlbumCate.findAll({
      where,
      order: [[ 'id', 'DESC' ]], // 按ID降序排列
    });

    // 处理查询结果
    const cateResps = cates.map(cate => {
      const cateResp = cate;
      return cateResp;
    });

    // 将列表转换为树形结构
    const mapList = util.listToTree(
      util.structsToMaps(cateResps), // 先转换为Map结构
      'id', // ID字段名
      'pid', // 父ID字段名
      'children' // 子节点字段名
    );

    return mapList;
  }

  /**
   * 添加相册分类
   * @param {Object} addReq 添加请求参数
   */
  async cateAdd(addReq) {
    const { ctx } = this;
    try {
      // 获取当前时间戳（秒）
      const dateTime = Math.floor(Date.now() / 1000);
      const timeObject = {
        createTime: dateTime,
        updateTime: dateTime,
      };

      // 创建新的分类实例
      const cate = new ctx.model.AlbumCate();

      // 合并请求参数和时间参数
      Object.assign(cate, addReq, timeObject);

      // 保存到数据库
      await cate.save();
    } catch (err) {
      throw new Error('CateAdd Create err');
    }
  }

  /**
   * 重命名相册分类
   * @param {number} id 分类ID
   * @param {string} name 新的分类名称
   */
  async cateRename(id, name) {
    const { ctx } = this;
    try {
      // 查找指定分类
      const cate = await ctx.model.AlbumCate.findOne({
        where: {
          id,
          isDelete: 0, // 确保分类未被删除
        },
      });

      // 分类不存在时抛出错误
      if (!cate) {
        throw new Error('分类已不存在！');
      }

      // 更新分类名称
      cate.name = name;

      // 保存更改
      await cate.save();
    } catch (err) {
      throw new Error('CateRename Save err');
    }
  }

  /**
   * 删除相册分类
   * @param {number} id 分类ID
   */
  async cateDel(id) {
    const { ctx } = this;
    try {
      // 查找指定分类
      const cate = await ctx.model.AlbumCate.findOne({
        where: {
          id,
          isDelete: 0,
        },
      });

      if (!cate) {
        throw new Error('分类已不存在！');
      }

      // 检查分类下是否有文件
      const albumCount = await ctx.model.Album.count({
        where: {
          cid: id, // 分类ID
          isDelete: 0, // 未删除的文件
        },
      });

      // 如果分类下有文件，不允许删除
      if (albumCount > 0) {
        throw new Error('当前分类正被使用中，不能删除！');
      }

      // 执行软删除
      cate.isDelete = 1;
      cate.deleteTime = Math.floor(Date.now() / 1000);

      await cate.save();
    } catch (err) {
      throw new Error('CateDel Save err');
    }
  }

  /**
   * 获取相册文件列表（分页）
   * @param {Object} listReq 请求参数 {cid, name, type, pageSize, pageNo}
   * @return {Object} 分页结果 {pageNo, pageSize, count, lists}
   */
  async albumList(listReq) {
    const { ctx } = this;

    const { cid, name, type, pageSize, pageNo } = listReq;

    // 计算分页参数
    const limit = parseInt(pageSize, 10);
    const offset = pageSize * (pageNo - 1);

    // 构建查询条件
    const where = {
      isDelete: 0,
    };

    // 按分类ID筛选
    if (cid > 0) {
      where.cid = cid;
    }

    // 按文件名模糊搜索
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    // 按文件类型筛选
    if (type > 0) {
      where.type = type;
    }

    // 获取总数
    const count = await ctx.model.Album.count({ where });

    // 获取分页数据
    const albums = await ctx.model.Album.findAll({
      where,
      limit,
      offset,
      order: [[ 'id', 'DESC' ]],
    });

    // 处理查询结果
    const albumResps = albums.map(album => {
      const albumResp = album;
      return albumResp;
    });

    // 当前存储引擎（目前只支持local）
    const engine = 'local';

    // 处理每个文件的路径和大小显示
    for (let i = 0; i < albumResps.length; i++) {
      if (engine === 'local') {
        // 本地存储：直接使用URI作为路径
        albumResps[i].path = albums[i].uri;
      } else {
        // TODO: 其他存储引擎（如OSS、COS等）
      }
      // 转换为绝对URL
      albumResps[i].uri = urlUtil.toAbsoluteUrl(albums[i].uri);
      // 格式化文件大小显示
      albumResps[i].size = util.getFmtSize(albums[i].size);
    }

    // 返回分页结果
    return {
      pageNo,
      pageSize,
      count,
      lists: albumResps,
    };
  }

  /**
   * 重命名相册文件
   * @param {number} id 文件ID
   * @param {string} name 新的文件名
   */
  async albumRename(id, name) {
    const { ctx } = this;
    try {
      const album = await ctx.model.Album.findOne({
        where: {
          id,
          isDelete: 0,
        },
      });

      if (!album) {
        throw new Error('文件丢失！');
      }

      album.name = name;

      await album.save();
    } catch (err) {
      throw new Error('AlbumRename Save err');
    }
  }

  /**
   * 移动文件到其他分类
   * @param {Array} ids 文件ID数组
   * @param {number} cid 目标分类ID
   */
  async albumMove(ids, cid) {
    const { ctx } = this;
    try {
      // 查找所有指定文件
      const albums = await ctx.model.Album.findAll({
        where: {
          id: ids,
          isDelete: 0,
        },
      });

      if (albums.length === 0) {
        throw new Error('文件丢失！');
      }

      // 验证目标分类是否存在（cid为0表示无分类）
      if (cid > 0) {
        const cate = await ctx.model.AlbumCate.findOne({
          where: {
            id: cid,
            isDelete: 0,
          },
        });

        if (!cate) {
          throw new Error('类目已不存在！');
        }
      }

      // 批量更新文件分类
      await ctx.model.Album.update(
        { cid },
        {
          where: {
            id: ids,
          },
        }
      );
    } catch (err) {
      throw new Error('AlbumMove UpdateColumn err');
    }
  }

  /**
   * 添加相册文件记录
   * @param {Object} addReq 文件信息
   * @return {number} 新创建的文件ID
   */
  async albumAdd(addReq) {
    const { ctx } = this;
    try {
      // 创建文件记录
      const alb = await ctx.model.Album.create(addReq);

      return alb.id;
    } catch (err) {
      throw new Error('AlbumAdd Create err');
    }
  }

  /**
   * 删除相册文件（软删除）
   * @param {Array} ids 文件ID数组
   */
  async albumDel(ids) {
    const { ctx } = this;
    try {
      // 验证文件是否存在
      const albums = await ctx.model.Album.findAll({
        where: {
          id: ids,
          isDelete: 0,
        },
      });

      if (albums.length === 0) {
        throw new Error('文件丢失！');
      }

      // 批量软删除
      await ctx.model.Album.update(
        {
          isDelete: 1,
          deleteTime: Math.floor(Date.now() / 1000),
        },
        {
          where: {
            id: ids,
          },
        }
      );
    } catch (err) {
      throw new Error('AlbumDel UpdateColumn err');
    }
  }

  /**
   * 上传文件处理
   * @param {number} cid 分类ID
   * @param {Stream} stream 文件流
   * @param {number} type 文件类型（10-图片，其他-视频）
   * @return {Object} 上传结果 {id, path}
   */
  async uploadFile(cid, stream, type = 10) {
    const { ctx } = this;
    try {
      // 处理文件上传，获取文件URL和名称
      const { url, fileName } = await this.handleUploadFile(stream, type);

      // 获取当前管理员ID
      const aid = ctx.session[reqAdminIdKey];

      // 获取文件大小
      const stats = fs.statSync('app' + url);
      const fileSizeInBytes = stats.size;

      // 构建文件记录数据
      const addReq = {
        aid, // 管理员ID
        cid, // 分类ID
        type, // 文件类型
        uri: url, // 文件存储路径
        name: fileName, // 原始文件名
        size: fileSizeInBytes, // 文件大小
        createTime: Math.floor(Date.now() / 1000),
        updateTime: Math.floor(Date.now() / 1000),
      };

      // 添加文件记录到数据库
      const albumId = await this.albumAdd(addReq);

      // 构建返回结果
      const res = {
        id: albumId, // 文件ID
        path: urlUtil.toAbsoluteUrl(url), // 绝对URL路径
      };

      return res;

    } catch (err) {
      throw new Error('uploadImage UpdateColumn err');
    }
  }

  /**
   * 处理文件上传流
   * @param {Stream} stream 文件流
   * @param {number} type 文件类型
   * @return {Object} 文件信息 {url, fileName}
   */
  async handleUploadFile(stream, type = 10) {
    // 根据文件类型确定存储目录
    const pathDir = type === 10 ? '/public/uploads/image/' : '/public/uploads/video/';
    // 按日期分目录
    const targetDir = pathDir + dayjs().format('YYYY-MM-DD');
    // 完整目录路径
    const dir = path.join(this.config.baseDir, 'app', targetDir);

    // 递归创建目录
    await mkdirp.sync(dir);

    // 生成唯一文件名：时间戳 + 原文件扩展名
    const filename = Date.now() + path.extname(stream.filename).toLocaleLowerCase();
    // 目标文件完整路径
    const target = path.join('app', targetDir, filename);

    // 创建写入流
    const writeStream = fs.createWriteStream(target);

    try {
      // 异步将文件流写入磁盘
      await awaitWriteStream(stream.pipe(writeStream));
    } catch (err) {
      // 如果出现错误，关闭管道并清理
      await sendToWormhole(stream);
      throw new Error(err);
    }

    // 返回文件信息
    const data = {
      url: `${targetDir}/${filename}`, // 相对URL路径
      fileName: stream.filename, // 原始文件名
    };
    return data;
  }
}

// 导出服务类
module.exports = AlbumService;
