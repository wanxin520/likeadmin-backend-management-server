/* eslint-disable jsdoc/require-param */
'use strict';
// 引入 moment 库，用于处理时间格式
const moment = require('moment');

/**
 * 相册/文件模型文件
 * 功能：定义相册文件存储的数据表结构和字段
 * 对应数据库表：la_album
 * 使用技术：Sequelize ORM
 */
module.exports = app => {
  // 从 app 中解构 Sequelize 的数据类型
  const { STRING, INTEGER, SMALLINT } = app.Sequelize;

  /**
   * 数据模型定义对象
   * 描述 la_album 表的所有字段及其属性
   */
  const modelDefinition = {
    // 主键ID，自增长
    id: {
      type: INTEGER.UNSIGNED, // 无符号整数
      autoIncrement: true, // 自动递增
      allowNull: false, // 不允许为空
      primaryKey: true, // 主键
    },
    // 分类ID (category id)
    cid: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0, // 默认值为0
    },
    // 关联ID (association id)，可能关联其他业务表
    aid: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // 用户ID (user id)，文件所属用户
    uid: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // 文件类型
    type: {
      type: SMALLINT.UNSIGNED, // 小整数，节省存储空间
      allowNull: false,
      defaultValue: 10, // 默认类型为10
    },
    // 文件原始名称
    name: {
      type: STRING(100), // 字符串类型，最大长度100
      allowNull: false,
      defaultValue: '', // 默认空字符串
    },
    // 文件存储路径或URI
    uri: {
      type: STRING(200), // 字符串类型，最大长度200
      allowNull: false, // 不允许为空，必须提供文件路径
    },
    // 文件扩展名
    ext: {
      type: STRING(10), // 字符串类型，最大长度10
      allowNull: false,
      defaultValue: '',
    },
    // 文件大小（字节）
    size: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // 软删除标记 (0-未删除, 1-已删除)
    isDelete: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'is_delete', // 数据库字段名与实际属性名映射
    },
    // 创建时间
    createTime: {
      type: INTEGER.UNSIGNED, // 使用时间戳存储
      allowNull: false,
      defaultValue: 0,
      field: 'create_time',
      // Getter方法：查询时自动将时间戳转换为可读格式
      get() {
        const timestamp = this.getDataValue('createTime') * 1000;
        return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    // 更新时间
    updateTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'update_time',
      get() {
        const timestamp = this.getDataValue('updateTime') * 1000;
        return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    // 删除时间（软删除时记录）
    deleteTime: {
      type: INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'delete_time',
      get() {
        const timestamp = this.getDataValue('deleteTime') * 1000;
        return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
      },
    },
  };

  /**
   * 创建 Sequelize 模型实例
   * @param {string} 'Album' - 模型名称
   * @param {Object} modelDefinition - 模型定义
   * @param {Object} options - 模型配置选项
   */
  const Album = app.model.define('Album', modelDefinition, {
    createdAt: false, // 禁用 Sequelize 自动管理的 createdAt 字段
    updatedAt: false, // 禁用 Sequelize 自动管理的 updatedAt 字段
    tableName: 'la_album', // 指定实际数据库表名
  });

  // 返回模型实例，供其他文件使用
  return Album;
};