'use strict';

/**
 * config.js 是系统业务常量配置文件，集中定义了系统中
 * 使用的所有常量、配置参数、缓存键、权限设置、代码生成配置等，是整个系统的核心配置中心。
 */

// 生成一个1024长度的密钥对的示例代码（已注释，实际使用预生成的密钥对）
// const nodeRSA = require("node-rsa");
// const key = new nodeRSA({b: 1024})
// const publicKey = key.exportKey('pkcs8-public') // 公钥
// const privateKey = key.exportKey('pkcs8-private') // 私钥

// 获取项目根路径
const path = require('path');
const runPath = path.dirname(path.dirname(__filename));

/**
 * 系统业务常量配置
 * 集中定义系统中使用的所有常量、配置参数、缓存键、权限设置等
 * 是整个系统的核心配置中心，便于统一管理和维护
 */
const rsa = {
  /**
   * RSA加密密钥对
   * 用于数据加密、签名验证等安全场景
   * 公钥用于加密，私钥用于解密
   */
  publicKey: '-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCGZ9nIiSJT+N66Y44G4R1exi9Zg7C141cCzHL9avlYdpxGHtXUWvUX2wcOXe2AtCTH54cBVbWdudlFpN0M2PBUDfFE+rx5KzRWqDm3vAolAb8Tr7+LHVLdcPGc3j8h/XUnsM6rVCxDGM/PcdMp1sM5Nec5BJ3oGwCgt92HgT8BtwIDAQAB-----END PUBLIC KEY-----',
  privateKey: '-----BEGIN PRIVATE KEY-----MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAIZn2ciJIlP43rpjjgbhHV7GL1mDsLXjVwLMcv1q+Vh2nEYe1dRa9RfbBw5d7YC0JMfnhwFVtZ252UWk3QzY8FQN8UT6vHkrNFaoObe8CiUBvxOvv4sdUt1w8ZzePyH9dSewzqtULEMYz89x0ynWwzk15zkEnegbAKC33YeBPwG3AgMBAAECgYByudCvGUdhECzmQrZn7t4IGPkv2nYLPAv4ipWY9SfzuAL647U4N4/AFii2vbxOQPaoYFvf6s5E3O+2P9yj68Vvas25Z/gw5t+BcpliMCTM7Va2r3KZkozng+KakKqEXvRT8O0X8Tb/0fwoRCM62gOrFWQRq7BneOyEPiuFBUATUQJBANL/WO9SWISrtFXtre6Y8ZlDHILCcSaL67301WJo2l0hTwctcSMBjf3ROvk0X+dX1cU39dUCCyynMgcia8S4/+8CQQCjEoW1Elw4ImiIOEGSI3ySlTLopnWNZvdVYAbhwkbeeXDSXzqvVGkgRDKCt8CW47mdgh89mkiRSWoszs7oJNK5AkA1wm2sfHSlSQJnqmlYk4trG1hWUKh3w8rK2WjM7B5HAEecco2S98Bv3TGDcT7GOPD0kO+H2D90nxz2CGUg+GntAkEAiOak33Wxe+LPFQT9b11hWIHvAke0ymgV3lPGk0MRUfZr1ADkeIsJ0m/OY9U11rcJfgTei035/BbBDyrzowo+6QJBAJyl3vn3DlFgONWMsndXzB/GJSLTJhWuIuWcEV4I3b38HcTJkidkoKGNAOY+IZo2b9ww/X9FBhB+jstfQnQEU2M=-----END PRIVATE KEY-----',

  // ==================== Redis缓存键配置 ====================
  /**
   * 角色权限缓存键
   * 存储格式: backstage:roles -> {roleId: 'menu1,menu2,menu3'}
   * 用于快速验证用户角色对应的菜单权限
   */
  backstageRolesKey: 'backstage:roles',

  /**
   * Token缓存键前缀
   * 存储格式: backstage:token:{token} -> userId
   * 用于Token与用户ID的映射关系，验证Token有效性
   */
  backstageTokenKey: 'backstage:token:',

  /**
   * 用户Token集合前缀
   * 存储格式: backstage:token:set:{userId} -> [token1, token2]
   * 用于管理用户的多个登录Token，支持单点登录控制
   */
  backstageTokenSet: 'backstage:token:set:',

  /**
   * Redis键前缀
   * 所有Redis键的前缀，用于区分不同环境或项目
   */
  redisPrefix: 'Like:',

  /**
   * 管理员信息缓存键
   * 存储格式: backstage:manage -> {userId: userInfoJSON}
   * 缓存管理员用户信息，减少数据库查询
   */
  backstageManageKey: 'backstage:manage',

  // ==================== 会话键配置 ====================
  /**
   * 超级管理员ID
   * 拥有所有权限，不受权限验证限制
   */
  superAdminId: 1,

  /**
   * 会话中存储的管理员ID键名
   */
  reqAdminIdKey: 'admin_id',

  /**
   * 会话中存储的角色ID键名
   */
  reqRoleIdKey: 'role',

  /**
   * 会话中存储的用户名键名
   */
  reqUsernameKey: 'username',

  /**
   * 会话中存储的昵称键名
   */
  reqNicknameKey: 'nickname',

  // ==================== 数据库配置 ====================
  /**
   * 数据库表前缀
   * 所有数据库表的前缀，用于区分不同系统或模块
   */
  dbTablePrefix: 'la_',

  // ==================== 代码生成器配置 ====================
  /**
   * 代码生成器配置
   */
  genConfig: {
    // 基础包名，生成的代码的包名
    packageName: 'gencode',
    // 是否去除表前缀，生成实体类时是否去掉表前缀
    isRemoveTablePrefix: true,
    // 生成代码的根路径
    genRootPath: '/tmp/target',
  },

  // ==================== 数据类型常量 ====================
  /**
   * Node.js数据类型映射常量
   */
  nodeConstants: {
    typeString: 'string', // 字符串类型
    typeFloat: 'float64', // 浮点型
    typeInt: 'int', // 整型
    typeDate: 'core.TsTime', // 时间类型
  },

  // ==================== 代码生成常量 ====================
  /**
   * 代码生成相关常量
   */
  genConstants: {
    UTF8: 'utf-8', // 文件编码
    tplCrud: 'crud', // 单表模板 (增删改查)
    tplTree: 'tree', // 树表模板 (增删改查)
    queryLike: 'LIKE', // 模糊查询操作符
    queryEq: '=', // 相等查询操作符
    qequire: 1, // 必填字段标识
  },

  // ==================== 数据库字段常量 ====================
  /**
   * 数据库字段类型和操作相关常量
   */
  sqlConstants: {
    // 数据库字符串类型字段
    columnTypeStr: [ 'char', 'varchar', 'nvarchar', 'varchar2' ],

    // 数据库文本类型字段
    columnTypeText: [ 'tinytext', 'text', 'mediumtext', 'longtext' ],

    // 数据库时间类型字段
    columnTypeTime: [ 'datetime', 'time', 'date', 'timestamp' ],

    // 数据库数字类型字段
    columnTypeNumber: [
      'tinyint', 'smallint', 'mediumint', 'int', 'integer',
      'bit', 'bigint', 'float', 'double', 'decimal',
    ],

    // 时间日期字段名（自动处理字段）
    columnTimeName: [
      'create_time', 'update_time', 'delete_time',
      'start_time', 'end_time',
    ],

    // 页面不需要插入的字段（系统自动维护）
    columnNameNotAdd: [
      'id', 'is_delete', 'create_time',
      'update_time', 'delete_time',
    ],

    // 页面不需要编辑的字段（只读字段）
    columnNameNotEdit: [
      'is_delete', 'create_time', 'update_time', 'delete_time',
    ],

    // 页面列表不需要显示的字段
    columnNameNotList: [
      'id', 'intro', 'content', 'is_delete', 'delete_time',
    ],

    // 页面查询不需要的字段
    columnNameNotQuery: [
      'is_delete', 'create_time', 'update_time', 'delete_time',
    ],
  },

  // ==================== HTML控件类型常量 ====================
  /**
   * 前端HTML控件类型常量
   * 用于代码生成器生成对应的表单控件
   */
  htmlConstants: {
    htmlInput: 'input', // 文本框
    htmlTextarea: 'textarea', // 文本域
    htmlSelect: 'select', // 下拉框
    htmlRadio: 'radio', // 单选框
    htmlDatetime: 'datetime', // 日期时间选择器
    htmlImageUpload: 'imageUpload', // 图片上传控件
    htmlFileUpload: 'fileUpload', // 文件上传控件
    htmlEditor: 'editor', // 富文本编辑器
  },

  // ==================== 权限验证白名单 ====================
  /**
   * 免登录验证的接口URI
   * 这些接口不需要用户登录即可访问
   */
  notLoginUri: [
    'system:login', // 登录接口
    'common:index:config', // 系统配置接口
  ],

  /**
   * 免权限验证的接口URI
   * 这些接口登录后即可访问，不需要特定权限
   */
  notAuthUri: [
    'system:logout', // 退出登录
    'system:menu:menus', // 系统菜单
    'system:menu:route', // 菜单路由
    'system:admin:upInfo', // 管理员更新自身信息
    'system:admin:self', // 获取管理员自身信息
    'system:role:all', // 获取所有角色（用于下拉选择）
    'system:post:all', // 获取所有岗位（用于下拉选择）
    'system:dept:list', // 获取所有部门（用于下拉选择）
    'setting:dict:type:all', // 获取所有字典类型
    'setting:dict:data:all', // 获取所有字典数据
    'article:cate:all', // 获取所有文章分类
  ],

  // ==================== 系统基础配置 ====================
  /**
   * 系统公网访问地址
   * 用于生成完整的文件访问URL等
   */
  publicUrl: 'http://127.0.0.1:8001',

  /**
   * 资源文件访问前缀
   * 上传文件的URL访问路径前缀
   */
  publicPrefix: '/api/uploads',

  /**
   * 系统版本号
   */
  version: 'v1.0.0',

  /**
   * 项目根路径
   */
  rootPath: runPath,
};

// 导出配置对象
module.exports = rsa;
