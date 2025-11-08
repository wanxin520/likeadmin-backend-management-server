# LikeAdmin Egg.js 后台管理系统开发文档

## 📖 项目概述

### 项目简介

LikeAdmin是一个基于Egg.js框架开发的企业级后台管理系统，提供完整的用户权限管理、系统监控、代码生成等功能。

### 技术栈

- **后端框架**: Egg.js (基于Koa)
- **数据库**: MySQL + Sequelize ORM
- **缓存**: Redis
- **认证**: JWT Token + RBAC权限控制
- **文件存储**: 本地存储 + 静态资源服务
- **代码生成**: 自动化CRUD代码生成

------

## 🗂 项目目录结构详解

### 目录结构

text

```
likeadmin-server/
├── app/                    # 核心业务代码
├── config/                # 配置文件
├── logs/                  # 日志文件
├── run/                   # 运行时文件
├── test/                  # 测试文件
├── typings/               # TypeScript类型定义
├── node_modules/          # 依赖包
├── .eslintrc             # ESLint配置
├── .gitignore            # Git忽略配置
├── package.json          # 项目依赖
└── README.md             # 项目说明
```



## 项目完整结构

```
app
├── controller
│   ├── common
│   │   └── album.js
│   ├── gen
│   │   └── gen.js
│   ├── monitor
│   │   └── monitor.js
│   ├── setting
│   │   ├── copyright.js
│   │   ├── dict.js
│   │   ├── protocol.js
│   │   ├── storage.js
│   │   └── website.js
│   ├── system
│   │   ├── admin.js
│   │   ├── dept.js
│   │   ├── log.js
│   │   ├── menu.js
│   │   ├── post.js
│   │   └── role.js
│   ├── baseController.js
│   ├── system.js
│   └── upload.js
├── extend
│   ├── config.js
│   ├── context.js
│   ├── crypto.js
│   ├── email.js
│   ├── emailTmp.js
│   └── nodersa.js
├── generator
├── io
│   ├── controller
│   │   └── index.js
│   └── middleware
│       ├── auth.js
│       └── filter.js
├── middleware
│   ├── auth.js
│   └── authority.js
├── model
│   ├── albumCate.js
│   ├── article.js
│   ├── articleCategory.js
│   ├── articleCollect.js
│   ├── decoratePage.js
│   ├── decorateTabbar.js
│   ├── dictData.js
│   ├── dictType.js
│   ├── genTable.js
│   ├── genTableColumn.js
│   ├── hotSearch.js
│   ├── noticeSetting.js
│   ├── officialReply.js
│   ├── systemAuthAdmin.js
│   ├── systemAuthDept.js
│   ├── systemAuthMenu.js
│   ├── systemAuthPerm.js
│   ├── systemAuthPost.js
│   ├── systemAuthRole.js
│   ├── systemConfig.js
│   ├── systemLogLogin.js
│   ├── systemLogOperate.js
│   ├── systemLogSms.js
│   ├── user.js
│   └── userAuth.js
├── public
│   ├── downloads
│   │   └── file.zip
│   └── static
│       ├── backend_avatar.png
│       ├── backend_backdrop.png
│       ├── backend_favicon.ico
│       └── backend_logo.png
├── router
│   ├── system.js
│   └── upload.js
├── service
│   ├── album.js
│   ├── authAdmin.js
│   ├── authDept.js
│   ├── authMenu.js
│   ├── authPost.js
│   ├── authRole.js
│   ├── common.js
│   ├── copyright.js
│   ├── dict.js
│   ├── gen.js
│   ├── log.js
│   ├── protocol.js
│   ├── redis.js
│   ├── storage.js
│   ├── upload.js
│   └── website.js
├── util
|    ├── index.js
|    ├── server.js
|    ├── stringUtil.js
|    ├── templateUtil.js
|    └── urlUtil.js
├──config
|    ├── config.default.js
|    ├── config.local.example.js
|    ├── config.prod.example.js
|    └── plugin.js
├──test
|    └──app
|		 └──contoller
|		 		└────home.test.js
├──.autod.conf.js
├──.eslintignore
├──.eslintrc
├──.gitignore
├──.travis.yml
├──.appveyor.yml
├──jsconfig.json
├──package-lock.json
├──package.json
└──README.md
```



## 项目目录完整结构（注释版）

```
├── app/                          # 应用核心代码
│   ├── controller/               # 控制器层（按功能模块组织）
│   │   ├── common/               # 通用功能控制器
│   │   │   └── album.js          # 相册管理
│   │   ├── gen/                  # 代码生成模块
│   │   │   └── gen.js            # 代码生成器
│   │   ├── monitor/              # 系统监控模块
│   │   │   └── monitor.js        # 监控相关功能
│   │   ├── setting/              # 系统设置模块
│   │   │   ├── copyright.js      # 版权设置
│   │   │   ├── dict.js           # 字典管理
│   │   │   ├── protocol.js       # 协议管理
│   │   │   ├── storage.js        # 存储设置
│   │   │   └── website.js        # 网站设置
│   │   ├── system/               # 系统管理核心模块
│   │   │   ├── admin.js          # 管理员管理
│   │   │   ├── dept.js           # 部门管理
│   │   │   ├── log.js            # 日志管理
│   │   │   ├── menu.js           # 菜单管理
│   │   │   ├── post.js           # 岗位管理
│   │   │   └── role.js           # 角色管理
│   │   ├── baseController.js     # 基础控制器类
│   │   ├── system.js             # 系统核心控制器（登录/登出等）
│   │   └── upload.js             # 文件上传控制器
│   ├── extend/                   # 框架扩展
│   │   ├── config.js             # 业务配置常量
│   │   ├── context.js            # 上下文扩展
│   │   ├── crypto.js             # 加密工具
│   │   ├── email.js              # 邮件服务
│   │   ├── emailTmp.js           # 邮件模板
│   │   └── nodersa.js            # RSA加密
│   ├── generator/                # 代码生成器相关（目录）
│   ├── io/                       # WebSocket 相关
│   │   ├── controller/
│   │   │   └── index.js          # WebSocket控制器
│   │   └── middleware/
│   │       ├── auth.js           # WS认证中间件
│   │       └── filter.js         # WS过滤器
│   ├── middleware/               # HTTP中间件
│   │   ├── auth.js               # 认证中间件
│   │   └── authority.js          # 权限中间件
│   ├── model/                    # 数据模型层
│   │   ├── albumCate.js          # 相册分类
│   │   ├── article.js            # 文章
│   │   ├── articleCategory.js    # 文章分类
│   │   ├── articleCollect.js     # 文章收藏
│   │   ├── decoratePage.js       # 装修页面
│   │   ├── decorateTabbar.js     # 装修底部导航
│   │   ├── dictData.js           # 字典数据
│   │   ├── dictType.js           # 字典类型
│   │   ├── genTable.js           # 代码生成表
│   │   ├── genTableColumn.js     # 代码生成表字段
│   │   ├── hotSearch.js          # 热门搜索
│   │   ├── noticeSetting.js      # 通知设置
│   │   ├── officialReply.js      # 官方回复
│   │   ├── systemAuthAdmin.js    # 系统管理员
│   │   ├── systemAuthDept.js     # 系统部门
│   │   ├── systemAuthMenu.js     # 系统菜单
│   │   ├── systemAuthPerm.js     # 系统权限
│   │   ├── systemAuthPost.js     # 系统岗位
│   │   ├── systemAuthRole.js     # 系统角色
│   │   ├── systemConfig.js       # 系统配置
│   │   ├── systemLogLogin.js     # 登录日志
│   │   ├── systemLogOperate.js   # 操作日志
│   │   ├── systemLogSms.js       # 短信日志
│   │   ├── user.js               # 用户表
│   │   └── userAuth.js           # 用户认证
│   ├── public/                   # 静态资源
│   │   ├── downloads/
│   │   │   └── file.zip
│   │   └── static/
│   │       ├── backend_avatar.png
│   │       ├── backend_backdrop.png
│   │       ├── backend_favicon.ico
│   │       └── backend_logo.png
│   ├── router/                   # 路由配置
│   │   ├── system.js             # 系统路由
│   │   └── upload.js             # 上传路由
│   ├── service/                  # 服务层
│   │   ├── album.js              # 相册服务
│   │   ├── authAdmin.js          # 管理员认证服务
│   │   ├── authDept.js           # 部门服务
│   │   ├── authMenu.js           # 菜单服务
│   │   ├── authPost.js           # 岗位服务
│   │   ├── authRole.js           # 角色服务
│   │   ├── common.js             # 通用服务
│   │   ├── copyright.js          # 版权服务
│   │   ├── dict.js               # 字典服务
│   │   ├── gen.js                # 代码生成服务
│   │   ├── log.js                # 日志服务
│   │   ├── protocol.js           # 协议服务
│   │   ├── redis.js              # Redis服务
│   │   ├── storage.js            # 存储服务
│   │   ├── upload.js             # 上传服务
│   │   └── website.js            # 网站服务
│   └── util/                     # 工具类
│       ├── index.js
│       ├── server.js
│       ├── stringUtil.js
│       ├── templateUtil.js
│       └── urlUtil.js
├── config/                       # 框架配置
│   ├── config.default.js
│   ├── config.local.example.js
│   ├── config.prod.example.js
│   └── plugin.js
├──test
|    └──app
|		 └──contoller
|		 		└────home.test.js
├──.autod.conf.js
├──.eslintignore
├──.eslintrc
├──.gitignore
├──.travis.yml
├──.appveyor.yml
├──jsconfig.json
├──package-lock.json
├──package.json
└──README.md
```





### 核心目录详细说明

#### `app/` - 主要业务逻辑

text

```
app/
├── controller/           # 控制器层
│   ├── common/          # 通用控制器
│   ├── gen/             # 代码生成控制器
│   ├── monitor/         # 系统监控控制器
│   ├── setting/         # 系统设置控制器
│   ├── system/          # 系统管理控制器
│   ├── baseController.js # 基础控制器
│   ├── system.js        # 系统核心控制器
│   └── upload.js        # 文件上传控制器
├── service/             # 服务层
│   ├── authAdmin.js     # 管理员服务
│   ├── authRole.js      # 角色服务
│   ├── authMenu.js      # 菜单服务
│   ├── common.js        # 通用服务
│   ├── upload.js        # 上传服务
│   └── ...
├── middleware/          # 中间件
│   ├── auth.js          # 认证中间件
│   └── authority.js     # 权限中间件
├── model/               # 数据模型
├── public/              # 静态资源
├── router/              # 路由配置
│   ├── system.js        # 系统路由
│   └── router.js        # 主路由文件
├── extend/              # 扩展功能
│   ├── config.js        # 配置扩展
│   ├── context.js       # 上下文扩展
│   ├── crypto.js        # 加密扩展
│   └── ...
├── util/                # 工具类
├── validate/            # 参数验证
├── io/                  # WebSocket处理
└── generator/           # 代码生成器
```



#### `config/` - 配置文件

text

```
config/
├── config.default.js    # 默认配置
├── config.prod.js       # 生产环境配置
└── plugin.js           # 插件配置
```



------

## 🔧 核心文件功能详解

### 1. 路由文件

#### `app/router.js` - 主路由入口

javascript

```
module.exports = app => {
  // 启动前同步数据库模型
  app.beforeStart(async () => {
    await app.model.sync({});// force false 为不覆盖
  });
  
  // 加载系统路由
  require('./router/system')(app);
};
```



**作用**:

- 应用启动时自动同步数据库表结构
- 加载所有业务路由模块

#### `app/router/system.js` - 系统路由配置

包含所有API端点，按功能模块组织：

- 系统认证：登录、退出、菜单路由
- 组织架构：部门、岗位管理
- 权限管理：管理员、角色、菜单
- 内容管理：素材、上传
- 系统配置：网站、协议、存储
- 监控日志：服务监控、操作日志
- 字典管理：数据字典
- 代码生成：自动化代码生成

### 2. 控制器文件

#### `app/controller/baseController.js` - 基础控制器

javascript

```
module.exports = class baseController extends Controller {
  result({ code = 200, data = '', message = '请求成功', status = 200 }) {
    // 统一响应格式
    ctx.body = { code, data, message };
  }
};
```



**作用**: 封装统一的API响应格式，确保所有接口返回格式一致。

#### `app/controller/system.js` - 系统核心控制器

**主要方法**:

- `login()` - 用户登录处理
- `logout()` - 用户退出处理
- `menusRoute()` - 获取菜单路由
- `console()` - 控制台数据
- `configInfo()` - 系统配置信息

### 3. 服务文件

#### `app/service/authAdmin.js` - 管理员服务

**核心方法**:

- `cacheAdminUserByUid()` - 缓存用户信息到Redis
- `cacheRoleMenusByRoleId()` - 缓存角色权限菜单
- `selectMenuByRoleId()` - 根据角色获取菜单
- `adminList()` - 管理员列表查询
- `add()` - 添加管理员
- `edit()` - 编辑管理员
- `update()` - 更新管理员信息
- `del()` - 删除管理员
- `disable()` - 禁用/启用管理员

### 4. 中间件文件

#### `app/middleware/auth.js` - 认证中间件

**完整认证流程**:

javascript

```
async function tokenAuth(ctx, next) {
  // 1. 免登录接口检查
  // 2. Token存在性验证
  // 3. Token有效性验证（Redis）
  // 4. 用户状态检查（删除/禁用）
  // 5. Token自动续期
  // 6. 用户信息保存到Session
  // 7. 免权限接口检查
  // 8. 角色权限验证
  // 9. 接口权限验证
}
```



### 5. 配置文件

#### `config/config.default.js` - 默认配置

**主要配置项**:

- 数据库连接配置（MySQL + Sequelize）
- Redis缓存配置
- 中间件配置
- 安全配置（CSRF、CORS）
- 静态资源配置
- 文件上传配置
- Session配置
- 集群配置

#### `app/extend/config.js` - 扩展配置

**重要常量定义**:

- RSA加密密钥对
- Redis键前缀和结构
- 免登录/免权限接口列表
- 代码生成配置
- 数据库字段类型映射
- 系统版本信息

------

## 🔄 核心业务流程详解

### 1. 用户登录流程

```
graph TD
    A[用户登录] --> B[参数验证]
    B --> C[查询用户信息]
    C --> D{用户存在?}
    D -->|否| E[返回用户不存在]
    D -->|是| F{用户状态检查}
    F -->|已删除| G[返回用户被删除]
    F -->|已禁用| H[返回用户被禁用]
    F -->|正常| I[密码验证]
    I --> J{密码正确?}
    J -->|否| K[返回密码错误]
    J -->|是| L[生成Token]
    L --> M[缓存用户信息]
    M --> N[更新登录信息]
    N --> O[记录登录日志]
    O --> P[返回Token]
```



**详细步骤**:

1. **参数验证**: 验证用户名密码格式
2. **用户查询**: 根据用户名查询用户信息
3. **状态检查**: 检查用户是否被删除或禁用
4. **密码验证**: MD5加盐验证密码
5. **Token生成**: 使用RSA加密生成Token
6. **缓存处理**:
   - 单点登录控制：根据`is_multipoint`清理旧Token
   - 用户信息缓存：缓存到Redis
7. **数据更新**: 更新最后登录时间和IP
8. **日志记录**: 记录登录日志
9. **返回结果**: 返回Token给客户端

### 2. 请求认证授权流程

```
graph TD
    A[请求到达] --> B{免登录接口?}
    B -->|是| C[直接放行]
    B -->|否| D{Token存在?}
    D -->|否| E[返回Token为空]
    D -->|是| F{Token有效?}
    F -->|否| G[返回Token无效]
    F -->|是| H[获取用户信息]
    H --> I{用户状态检查}
    I -->|已删除| J[返回用户被删除]
    I -->|已禁用| K[返回用户被禁用]
    I -->|正常| L[Token自动续期]
    L --> M{免权限接口?}
    M -->|是| N[放行到业务]
    M -->|否| O{超级管理员?}
    O -->|是| N
    O -->|否| P[验证角色权限]
    P --> Q{有权限?}
    Q -->|否| R[返回无权限]
    Q -->|是| N
```



**权限验证逻辑**:

javascript

```
// 免权限检查条件
if (notAuthUri.includes(auths) || uid === 1) {
  await next(); // 直接放行
} else {
  // 普通用户权限验证
  const menus = await redis.hGet(backstageRolesKey, roleId);
  if (!menusArray.includes(auths)) {
    return 403; // 无权限
  }
}
```



### 3. 菜单权限加载流程

javascript

```
// 1. 从数据库查询角色权限
const perms = await SystemAuthPerm.findAll({ roleId });

// 2. 获取菜单ID列表
const menuIds = perms.map(perm => perm.menuId);

// 3. 查询有效菜单
const menus = await SystemAuthMenu.findAll({
  where: {
    isDisable: 0,
    id: { [Op.in]: menuIds },
    menuType: ['C', 'A'] // 菜单和按钮类型
  }
});

// 4. 提取权限标识
const menuArray = menus
  .filter(menu => menu.perms !== '')
  .map(menu => menu.perms.trim());

// 5. 缓存到Redis
await redis.hSet(backstageRolesKey, roleId, menuArray.join(','));
```



------

## 🗄 数据存储设计

### Redis缓存结构

| 键名                           | 类型   | 说明                            | 过期时间 |
| :----------------------------- | :----- | :------------------------------ | :------- |
| `backstage:token:{token}`      | String | 存储用户ID                      | 2小时    |
| `backstage:manage`             | Hash   | 存储用户信息 {userId: userInfo} | 永久     |
| `backstage:roles`              | Hash   | 存储角色权限 {roleId: menus}    | 永久     |
| `backstage:token:set:{userId}` | Set    | 用户Token集合                   | 永久     |

### 数据库表关系

text

```
SystemAuthAdmin (管理员表)
  ↳ SystemAuthRole (角色表)
  ↳ SystemAuthDept (部门表)
  
SystemAuthRole (角色表)
  ↳ SystemAuthPerm (权限表)
    ↳ SystemAuthMenu (菜单表)
```



------

## 🔐 安全机制详解

### 1. 密码安全

javascript

```
// 密码加盐加密
const salt = util.randomString(5);
const password = md5(rawPassword + salt);
```



### 2. Token安全

- **生成**: RSA加密生成
- **存储**: Redis存储，2小时过期
- **续期**: 剩余30分钟自动续期
- **单点登录**: 支持控制多端登录

### 3. 权限安全

- **接口级权限控制**
- **角色权限分离**
- **实时权限生效**
- **超级管理员特权**

### 4. 数据安全

- **软删除机制**
- **操作日志记录**
- **参数验证过滤**
- **SQL注入防护**

------

## ⚡ 性能优化策略

### 1. 缓存优化

- **用户信息缓存**: 减少数据库查询
- **权限菜单缓存**: 加速权限验证
- **Token自动续期**: 提升用户体验

### 2. 数据库优化

- **连接池管理**
- **索引优化**
- **查询优化**

### 3. 中间件优化

- **尽早返回**: 在中间件层完成认证授权
- **减少IO**: 缓存减少数据库访问

------

## 🛠 代码生成器

### 功能特性

- **自动识别表结构**
- **支持单表和树表**
- **可配置代码模板**
- **多类型字段映射**

### 生成流程

1. **表结构分析**: 读取数据库表信息
2. **模板渲染**: 根据模板生成代码
3. **文件输出**: 生成Controller、Service、Model等文件
4. **代码预览**: 支持预览生成结果

------

## 📊 系统监控

### 监控指标

- **服务状态**: CPU、内存、磁盘使用率
- **缓存状态**: Redis内存、连接数
- **业务监控**: 用户活跃、接口调用

### 日志体系

- **操作日志**: 用户行为记录
- **登录日志**: 登录成功/失败记录
- **系统日志**: 应用运行日志
- **错误日志**: 异常错误记录

------

## 🚀 部署配置

### 环境要求

- Node.js >= 12.0.0
- MySQL >= 5.7
- Redis >= 4.0

### 启动命令

bash

```
# 开发环境
npm run dev

# 生产环境  
npm start

# 测试
npm test
```



### 配置文件

根据环境配置不同的数据库连接、Redis连接等参数。

------

## 🔄 扩展开发指南

### 1. 添加新功能模块

javascript

```
// 1. 创建Controller
// app/controller/module/xxx.js

// 2. 创建Service  
// app/service/xxx.js

// 3. 创建Model
// app/model/xxx.js

// 4. 配置路由
// app/router/xxx.js
```



### 2. 自定义中间件

javascript

```
// app/middleware/xxx.js
module.exports = options => {
  return async (ctx, next) => {
    // 中间件逻辑
    await next();
  };
};
```



### 3. 扩展配置

在 `app/extend/` 目录下添加扩展文件，支持context、helper等扩展。

------

## 💡 最佳实践

### 代码规范

- 使用ES6+语法
- 统一的错误处理
- 规范的注释文档
- 合理的代码分层

### 安全实践

- 定期更换加密密钥
- 监控异常登录行为
- 定期备份重要数据
- 及时更新依赖包

### 性能实践

- 合理使用缓存
- 避免N+1查询
- 优化数据库索引
- 监控系统资源


# 📋 主要路由文件



### 1. **`app/router/system.js`** - 核心路由文件

这个文件包含了**系统所有的API接口定义**，是了解项目功能的最重要文件。

### 2. **`app/router/upload.js`** - 上传功能路由

处理文件上传相关的接口。

### 3. **`app/router.js`** - 路由入口文件

定义了路由的加载顺序和初始化逻辑。

## 🔍 接口分类整理

根据 `system.js` 路由文件，我将所有接口按功能模块整理如下：

### 🏠 系统基础功能

javascript

```js
// 用户认证
POST /api/system/login           // 用户登录
POST /api/system/logout          // 用户退出登录
GET  /api/system/menu/route      // 获取菜单路由信息
GET  /api/common/index/console   // 控制台首页数据
GET  /api/common/index/config    // 获取系统配置信息
```



### 👥 部门管理

javascript

```js
GET    /api/system/dept/list     // 获取部门列表
POST   /api/system/dept/add      // 添加部门
GET    /api/system/dept/detail   // 获取部门详情
PUT    /api/system/dept/edit     // 编辑部门信息
DELETE /api/system/dept/del      // 删除部门
GET    /api/system/dept/all      // 获取所有部门（树形结构）
```



### 💼 岗位管理

javascript

```js
GET    /api/system/post/list     // 获取岗位列表
POST   /api/system/post/add      // 添加岗位
GET    /api/system/post/detail   // 获取岗位详情
PUT    /api/system/post/edit     // 编辑岗位信息
DELETE /api/system/post/del      // 删除岗位
GET    /api/system/post/all      // 获取所有岗位
```



### 👨‍💼 管理员管理

javascript

```js
GET    /api/system/admin/list    // 获取管理员列表
GET    /api/system/admin/self    // 获取当前登录管理员信息
POST   /api/system/admin/add     // 添加管理员
GET    /api/system/admin/detail  // 获取管理员详情
PUT    /api/system/admin/edit    // 编辑管理员信息
PUT    /api/system/admin/upInfo  // 更新管理员信息
DELETE /api/system/admin/del     // 删除管理员
PUT    /api/system/admin/disable // 禁用/启用管理员
```



### 🛡️ 角色管理

javascript

```js
GET    /api/system/role/all      // 获取所有角色
GET    /api/system/role/list     // 获取角色列表
GET    /api/system/role/detail   // 获取角色详情
POST   /api/system/role/add      // 添加角色
PUT    /api/system/role/edit     // 编辑角色信息
DELETE /api/system/role/del      // 删除角色
```



### 📊 菜单管理

javascript

```js
GET    /api/system/menu/list     // 获取菜单列表
GET    /api/system/menu/detail   // 获取菜单详情
POST   /api/system/menu/add      // 添加菜单
PUT    /api/system/menu/edit     // 编辑菜单信息
DELETE /api/system/menu/del      // 删除菜单
```



### 🖼️ 素材管理（相册）

javascript

```js
// 相册分类管理
GET    /api/common/album/cateList     // 获取相册分类列表
POST   /api/common/album/cateAdd      // 添加相册分类
PUT    /api/common/album/cateRename   // 重命名相册分类
DELETE /api/common/album/cateDel      // 删除相册分类

// 相册文件管理
GET    /api/common/album/albumList    // 获取相册文件列表
PUT    /api/common/album/albumRename  // 重命名相册文件
DELETE /api/common/album/albumDel     // 删除相册文件
POST   /api/common/album/albumAdd     // 添加相册文件
PUT    /api/common/album/albumMove    // 移动相册文件到其他分类
```



### 📁 文件上传

javascript

```js
POST /api/common/upload/image    // 上传图片文件
POST /api/common/upload/video    // 上传视频文件
POST /upload/uploadImg           // 上传图片（旧接口）
POST /upload/uploadFile          // 上传文件（旧接口）
```



### ⚙️ 网站设置

javascript

```js
// 网站信息
GET  /api/setting/website/detail  // 获取网站信息详情
POST /api/setting/website/save    // 保存网站信息

// 版权信息
GET  /api/setting/copyright/detail // 获取版权信息详情
POST /api/setting/copyright/save   // 保存版权信息

// 协议信息
GET  /api/setting/protocol/detail  // 获取协议信息详情
POST /api/setting/protocol/save    // 保存协议信息

// 存储配置
GET  /api/setting/storage/list     // 获取存储配置列表
GET  /api/setting/storage/detail   // 获取存储配置详情
PUT  /api/setting/storage/edit     // 编辑存储配置
PUT  /api/setting/storage/change   // 切换存储配置
```



### 📊 系统监控

javascript

```js
GET /api/monitor/server    // 获取服务器监控信息
GET /api/monitor/cache     // 获取缓存监控信息
```



### 📝 日志管理

javascript

```
GET /api/system/log/operate    // 获取操作日志列表
```



### 📚 字典管理

javascript

```js
// 字典类型管理
GET    /api/setting/dict/type/list    // 获取字典类型列表
GET    /api/setting/dict/type/all     // 获取所有字典类型
POST   /api/setting/dict/type/add     // 添加字典类型
GET    /api/setting/dict/type/detail  // 获取字典类型详情
PUT    /api/setting/dict/type/edit    // 编辑字典类型
DELETE /api/setting/dict/type/del     // 删除字典类型

// 字典数据管理
GET    /api/setting/dict/data/list    // 获取字典数据列表
GET    /api/setting/dict/data/all     // 获取所有字典数据
GET    /api/setting/dict/data/detail  // 获取字典数据详情
POST   /api/setting/dict/data/add     // 添加字典数据
PUT    /api/setting/dict/data/edit    // 编辑字典数据
DELETE /api/setting/dict/data/del     // 删除字典数据
```



### 🔧 代码生成器

javascript

```javascript
GET  /api/gen/list           // 获取已生成代码列表
GET  /api/gen/db             // 获取数据库表列表
POST /api/gen/importTable    // 导入数据库表
POST /api/gen/delTable       // 删除已导入的表
POST /api/gen/syncTable      // 同步数据库表结构
GET  /api/gen/previewCode    // 预览生成代码
GET  /api/gen/downloadCode   // 下载生成代码
```





# 🎯创建API接口完整操作流程



在 Egg.js 项目中创建新的功能模块并添加新的 API 接口，通常需要以下步骤：

1. **创建数据模型（Model）**：如果新功能模块需要操作数据库，首先需要定义数据模型。
2. **创建服务（Service）**：编写业务逻辑，处理数据模型和业务规则。
3. **创建控制器（Controller）**：处理请求参数，调用服务，返回响应。
4. **创建验证规则（Validate）**：可选，但推荐，用于验证请求参数。
5. **配置路由（Router）**：将 URL 路径映射到控制器的具体方法。
6. **添加权限控制（可选）**：如果接口需要权限，在权限中间件中配置。

​	如果接口需要权限，可以在 `app/middleware/auth.js` 中定义的免权限列表 `notAuthUri` 中添加这些接口的权限标识，或者不添加（即需要权限）。

根据 `auth.js` 中间件的逻辑，接口的权限标识是 URL 路径转换的，例如：

- `/api/article/list` 会转换为 `article:list`

所以，你需要在角色权限管理中为角色分配 `article:list` 等权限。



下面我们以一个具体的例子来说明：假设我们要创建一个“文章管理”模块，包含文章的增删改查。



### 第一步：创建数据模型 (Model)

在 `app/model/` 目录下创建新的模型文件：

javascript

```js
// app/model/Article.js
'use strict';

module.exports = app => {
  const { STRING, INTEGER, TEXT, DATE } = app.Sequelize;

  const Article = app.model.define('Article', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: STRING(255),
      allowNull: false,
      comment: '文章标题',
    },
    content: {
      type: TEXT,
      allowNull: false,
      comment: '文章内容',
    },
    author: {
      type: STRING(100),
      allowNull: false,
      comment: '作者',
    },
    status: {
      type: INTEGER,
      defaultValue: 1, // 1: 正常, 0: 禁用
      comment: '状态',
    },
    categoryId: {
      type: INTEGER,
      allowNull: false,
      comment: '分类ID',
    },
    viewCount: {
      type: INTEGER,
      defaultValue: 0,
      comment: '浏览数',
    },
    createTime: {
      type: DATE,
      field: 'create_time',
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
    },
  }, {
    tableName: 'articles',
    timestamps: true,
    createdAt: 'createTime',
    updatedAt: 'updateTime',
    comment: '文章表',
  });

  return Article;
};
```



### 第二步：创建服务层 (Service)

在 `app/service/` 目录下创建服务文件：

javascript

```js
// app/service/article.js
'use strict';

const Service = require('egg').Service;

class ArticleService extends Service {
  /**
   * 获取文章列表（分页）
   */
  async list(listReq) {
    const { ctx } = this;
    try {
      const { pageNo = 1, pageSize = 10, title, categoryId, status } = listReq;
      
      const limit = parseInt(pageSize, 10);
      const offset = pageSize * (pageNo - 1);

      // 构建查询条件
      const where = {};
      if (title) {
        where.title = { [ctx.model.Op.like]: `%${title}%` };
      }
      if (categoryId) {
        where.categoryId = categoryId;
      }
      if (status !== undefined) {
        where.status = status;
      }

      // 查询数据
      const articles = await ctx.model.Article.findAndCountAll({
        where,
        limit,
        offset,
        order: [[ 'createTime', 'DESC' ]],
      });

      return {
        pageNo,
        pageSize,
        count: articles.count,
        lists: articles.rows.map(article => article.toJSON()),
      };
    } catch (err) {
      throw new Error(`获取文章列表失败: ${err.message}`);
    }
  }

  /**
   * 获取文章详情
   */
  async detail(id) {
    const { ctx } = this;
    try {
      const article = await ctx.model.Article.findOne({
        where: { id },
      });

      if (!article) {
        throw new Error('文章不存在');
      }

      // 增加浏览数
      await article.increment('viewCount');

      return article.toJSON();
    } catch (err) {
      throw new Error(`获取文章详情失败: ${err.message}`);
    }
  }

  /**
   * 创建文章
   */
  async create(createReq) {
    const { ctx } = this;
    try {
      // 获取当前管理员ID
      const adminId = ctx.session.adminId;
      
      const article = await ctx.model.Article.create({
        ...createReq,
        author: adminId, // 使用管理员ID作为作者
        createTime: Math.floor(Date.now() / 1000),
        updateTime: Math.floor(Date.now() / 1000),
      });

      return article.toJSON();
    } catch (err) {
      throw new Error(`创建文章失败: ${err.message}`);
    }
  }

  /**
   * 更新文章
   */
  async update(id, updateReq) {
    const { ctx } = this;
    try {
      const article = await ctx.model.Article.findOne({
        where: { id },
      });

      if (!article) {
        throw new Error('文章不存在');
      }

      await article.update({
        ...updateReq,
        updateTime: Math.floor(Date.now() / 1000),
      });

      return article.toJSON();
    } catch (err) {
      throw new Error(`更新文章失败: ${err.message}`);
    }
  }

  /**
   * 删除文章（软删除）
   */
  async delete(id) {
    const { ctx } = this;
    try {
      const article = await ctx.model.Article.findOne({
        where: { id },
      });

      if (!article) {
        throw new Error('文章不存在');
      }

      // 软删除
      await article.update({
        status: 0,
        updateTime: Math.floor(Date.now() / 1000),
      });

      return true;
    } catch (err) {
      throw new Error(`删除文章失败: ${err.message}`);
    }
  }
}

module.exports = ArticleService;
```



### 第三步：创建控制器 (Controller)

在 `app/controller/` 目录下创建控制器文件：

javascript

```js
// app/controller/article.js
'use strict';

const baseController = require('./baseController');

/**
 * 文章管理控制器
 * 处理文章的增删改查等操作
 */
class ArticleController extends baseController {

  /**
   * 获取文章列表
   * GET /api/article/list
   */
  async list() {
    const { ctx } = this;
    try {
      const listReq = ctx.query;
      const result = await ctx.service.article.list(listReq);
      this.result({ data: result });
    } catch (err) {
      ctx.logger.error(`ArticleController.list error: ${err}`);
      this.result({ 
        code: 500, 
        message: err.message 
      });
    }
  }

  /**
   * 获取文章详情
   * GET /api/article/detail
   */
  async detail() {
    const { ctx } = this;
    try {
      const { id } = ctx.query;
      if (!id) {
        this.result({ code: 400, message: '文章ID不能为空' });
        return;
      }

      const article = await ctx.service.article.detail(parseInt(id, 10));
      this.result({ data: article });
    } catch (err) {
      ctx.logger.error(`ArticleController.detail error: ${err}`);
      this.result({ 
        code: 500, 
        message: err.message 
      });
    }
  }

  /**
   * 创建文章
   * POST /api/article/add
   */
  async add() {
    const { ctx } = this;
    try {
      // 参数验证
      ctx.validate({
        title: { type: 'string', min: 1, max: 255 },
        content: { type: 'string', min: 1 },
        categoryId: { type: 'number' },
      });

      const createReq = ctx.request.body;
      const article = await ctx.service.article.create(createReq);
      this.result({ 
        data: article,
        message: '创建成功' 
      });
    } catch (err) {
      ctx.logger.error(`ArticleController.add error: ${err}`);
      this.result({ 
        code: 500, 
        message: err.message 
      });
    }
  }

  /**
   * 更新文章
   * PUT /api/article/edit
   */
  async edit() {
    const { ctx } = this;
    try {
      const { id, ...updateReq } = ctx.request.body;
      if (!id) {
        this.result({ code: 400, message: '文章ID不能为空' });
        return;
      }

      const article = await ctx.service.article.update(parseInt(id, 10), updateReq);
      this.result({ 
        data: article,
        message: '更新成功' 
      });
    } catch (err) {
      ctx.logger.error(`ArticleController.edit error: ${err}`);
      this.result({ 
        code: 500, 
        message: err.message 
      });
    }
  }

  /**
   * 删除文章
   * DELETE /api/article/del
   */
  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      if (!id) {
        this.result({ code: 400, message: '文章ID不能为空' });
        return;
      }

      await ctx.service.article.delete(parseInt(id, 10));
      this.result({ 
        message: '删除成功' 
      });
    } catch (err) {
      ctx.logger.error(`ArticleController.del error: ${err}`);
      this.result({ 
        code: 500, 
        message: err.message 
      });
    }
  }
}

module.exports = ArticleController;
```



### 第四步：创建参数验证规则 (Validate)

在 `app/validate/` 目录下创建验证文件：

javascript

```js
// app/validate/article.js
'use strict';

module.exports = app => {
  const { validate } = app;

  // 创建文章的验证规则
  const createRule = {
    title: { type: 'string', min: 1, max: 255, message: '标题长度1-255字符' },
    content: { type: 'string', min: 1, message: '内容不能为空' },
    categoryId: { type: 'number', message: '分类ID必须为数字' },
    status: { type: 'number', required: false, message: '状态必须为数字' },
  };

  // 更新文章的验证规则
  const updateRule = {
    id: { type: 'number', message: '文章ID必须为数字' },
    title: { type: 'string', min: 1, max: 255, required: false, message: '标题长度1-255字符' },
    content: { type: 'string', min: 1, required: false, message: '内容不能为空' },
    categoryId: { type: 'number', required: false, message: '分类ID必须为数字' },
    status: { type: 'number', required: false, message: '状态必须为数字' },
  };

  return {
    create: validate(createRule),
    update: validate(updateRule),
  };
};
```



### 第五步：配置路由 (Router)

在 `app/router/` 目录下的 `system.js` 文件中添加新路由：

javascript

```js
// 在 app/router/system.js 文件中添加：

// ==================== 文章管理路由 ====================

/** 获取文章列表 */
router.all('/api/article/list', controller.article.list);
/** 获取文章详情 */
router.all('/api/article/detail', controller.article.detail);
/** 添加文章 */
router.all('/api/article/add', controller.article.add);
/** 编辑文章 */
router.all('/api/article/edit', controller.article.edit);
/** 删除文章 */
router.all('/api/article/del', controller.article.del);
```



### 第六步：更新权限配置

在 `app/extend/config.js` 中添加新接口的权限标识：

javascript

```js
// 在免权限验证的接口列表中添加（如果需要）
const notAuthUri = [
  // ... 原有接口
  'article:list',
  'article:detail',
];

// 或者在权限中间件中自动转换
// 接口 /api/article/list 会自动转换为 article:list 权限标识
```



### 第七步：数据库迁移（可选）

如果需要创建数据库表，可以创建迁移文件：

sql

```sql
-- 在数据库中执行
CREATE TABLE `articles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT '文章标题',
  `content` text NOT NULL COMMENT '文章内容',
  `author` varchar(100) NOT NULL COMMENT '作者',
  `status` int(11) DEFAULT '1' COMMENT '状态',
  `category_id` int(11) NOT NULL COMMENT '分类ID',
  `view_count` int(11) DEFAULT '0' COMMENT '浏览数',
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章表';
```



# 🏗️ 数据库操作架构

这个项目使用 Sequelize 作为 ORM 框架来操作 MySQL 数据库

### 技术栈

- **ORM**: Sequelize 6.0+
- **数据库驱动**: MySQL2
- **Egg.js 插件**: egg-sequelize

## 📝 详细操作步骤

### 第一步：配置数据库连接

在 `config.default.js` 中配置数据库：

javascript

```js
// 数据库配置
config.sequelize = {
  dialect: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root", // 数据库用户名
  password: "270013", // 数据库密码
  database: "likeadmin_server", // 数据库名称
  define: {
    // model的全局配置
    timestamps: true, // 添加create,update,delete时间戳
    paranoid: false, // 添加软删除
    freezeTableName: true, // 防止修改表名为复数
    underscored: false, // 防止驼峰式字段被默认转为下划线
  },
};
```



### 第二步：定义数据模型 (Model)

在 `app/model/` 目录下创建模型文件：

```js
// app/model/SystemAuthAdmin.js
'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;

  const SystemAuthAdmin = app.model.define('SystemAuthAdmin', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '管理员ID',
    },
    username: {
      type: STRING(32),
      allowNull: false,
      unique: true,
      comment: '管理员账号',
    },
    nickname: {
      type: STRING(32),
      allowNull: false,
      comment: '管理员昵称',
    },
    password: {
      type: STRING(64),
      allowNull: false,
      comment: '管理员密码',
    },
    salt: {
      type: STRING(6),
      allowNull: false,
      comment: '密码盐',
    },
    avatar: {
      type: STRING(256),
      defaultValue: '',
      comment: '管理员头像',
    },
    role: {
      type: STRING(512),
      allowNull: false,
      comment: '管理员角色',
    },
    deptId: {
      type: INTEGER,
      defaultValue: 0,
      comment: '部门ID',
    },
    isMultipoint: {
      type: INTEGER,
      defaultValue: 0,
      comment: '多端登录: 0=否, 1=是',
    },
    isDisable: {
      type: INTEGER,
      defaultValue: 0,
      comment: '是否禁用: 0=否, 1=是',
    },
    isDelete: {
      type: INTEGER,
      defaultValue: 0,
      comment: '是否删除: 0=否, 1=是',
    },
    lastLoginIp: {
      type: STRING(32),
      defaultValue: '',
      comment: '最后登录IP',
    },
    lastLoginTime: {
      type: DATE,
      comment: '最后登录时间',
    },
    createTime: {
      type: DATE,
      field: 'create_time',
      comment: '创建时间',
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      comment: '更新时间',
    },
    deleteTime: {
      type: DATE,
      field: 'delete_time',
      comment: '删除时间',
    },
  }, {
    tableName: 'system_auth_admin', // 数据库表名
    timestamps: true, // 自动管理 createdAt 和 updatedAt
    createdAt: 'createTime', // 映射字段
    updatedAt: 'updateTime',
    deletedAt: 'deleteTime', // 软删除字段
    paranoid: true, // 启用软删除
    comment: '系统管理员表',
  });

  return SystemAuthAdmin;
};
```



### 第三步：在服务层操作数据库

在 `app/service/` 目录下的服务文件中使用模型：

javascript

```js
// app/service/authAdmin.js 中的数据库操作示例

class AuthAdminService extends Service {
  
  /**
   * 查询单个记录 - findOne
   */
  async findAdminByUsername(username) {
    const { ctx } = this;
    
    // 方法1: 使用 findOne
    const admin = await ctx.model.SystemAuthAdmin.findOne({
      where: {
        username: username,
        isDelete: 0, // 未删除的记录
      },
    });
    
    return admin;
  }

  /**
   * 查询单个记录 - findByPk (通过主键)
   */
  async findAdminById(id) {
    const { ctx } = this;
    
    // 方法2: 使用 findByPk
    const admin = await ctx.model.SystemAuthAdmin.findByPk(id);
    
    return admin;
  }

  /**
   * 查询多个记录 - findAll
   */
  async getAdminList(listReq) {
    const { ctx } = this;
    const { pageNo = 1, pageSize = 10, username, nickname } = listReq;

    // 计算分页
    const limit = parseInt(pageSize, 10);
    const offset = pageSize * (pageNo - 1);

    // 构建查询条件
    const where = {
      isDelete: 0,
    };

    // 模糊查询条件
    if (username) {
      where.username = { [ctx.model.Op.like]: `%${username}%` };
    }
    if (nickname) {
      where.nickname = { [ctx.model.Op.like]: `%${nickname}%` };
    }

    // 查询数据
    const adminModel = await ctx.model.SystemAuthAdmin.findAndCountAll({
      where,
      limit,
      offset,
      order: [[ 'id', 'DESC' ]], // 排序
      attributes: { 
        exclude: [ 'password', 'salt' ] // 排除敏感字段
      },
    });

    return {
      pageNo,
      pageSize,
      count: adminModel.count,
      lists: adminModel.rows.map(admin => admin.toJSON()),
    };
  }

  /**
   * 创建记录 - create
   */
  async createAdmin(adminData) {
    const { ctx } = this;
    
    // 生成时间戳
    const dateTime = Math.floor(Date.now() / 1000);
    const timeObject = {
      createTime: dateTime,
      updateTime: dateTime,
    };

    try {
      // 创建记录
      const admin = await ctx.model.SystemAuthAdmin.create({
        ...adminData,
        ...timeObject,
      });

      return admin.toJSON();
    } catch (err) {
      throw new Error(`创建管理员失败: ${err.message}`);
    }
  }

  /**
   * 更新记录 - update
   */
  async updateAdmin(id, updateData) {
    const { ctx } = this;
    
    try {
      // 方法1: 先查询再更新
      const admin = await ctx.model.SystemAuthAdmin.findByPk(id);
      if (!admin) {
        throw new Error('管理员不存在');
      }

      // 更新记录
      await admin.update({
        ...updateData,
        updateTime: Math.floor(Date.now() / 1000),
      });

      return admin.toJSON();
    } catch (err) {
      throw new Error(`更新管理员失败: ${err.message}`);
    }
  }

  /**
   * 批量更新 - 直接使用 update 方法
   */
  async batchUpdateAdminStatus(ids, status) {
    const { ctx } = this;
    
    try {
      // 批量更新
      const result = await ctx.model.SystemAuthAdmin.update(
        {
          isDisable: status,
          updateTime: Math.floor(Date.now() / 1000),
        },
        {
          where: {
            id: ids,
            isDelete: 0,
          },
        }
      );

      return result;
    } catch (err) {
      throw new Error(`批量更新失败: ${err.message}`);
    }
  }

  /**
   * 删除记录 - 软删除
   */
  async softDeleteAdmin(id) {
    const { ctx } = this;
    
    try {
      const admin = await ctx.model.SystemAuthAdmin.findByPk(id);
      if (!admin) {
        throw new Error('管理员不存在');
      }

      // 软删除
      await admin.update({
        isDelete: 1,
        deleteTime: Math.floor(Date.now() / 1000),
      });

      return true;
    } catch (err) {
      throw new Error(`删除管理员失败: ${err.message}`);
    }
  }

  /**
   * 物理删除 - destroy
   */
  async hardDeleteAdmin(id) {
    const { ctx } = this;
    
    try {
      const result = await ctx.model.SystemAuthAdmin.destroy({
        where: {
          id: id,
        },
        force: true, // 物理删除，跳过软删除
      });

      return result;
    } catch (err) {
      throw new Error(`物理删除失败: ${err.message}`);
    }
  }

  /**
   * 统计记录 - count
   */
  async getAdminCount(conditions = {}) {
    const { ctx } = this;
    
    const where = {
      isDelete: 0,
      ...conditions,
    };

    const count = await ctx.model.SystemAuthAdmin.count({
      where,
    });

    return count;
  }

  /**
   * 复杂查询 - 包含关联查询
   */
  async getAdminWithDept(adminId) {
    const { ctx } = this;
    
    const admin = await ctx.model.SystemAuthAdmin.findOne({
      where: {
        id: adminId,
        isDelete: 0,
      },
      include: [
        {
          model: ctx.model.SystemAuthDept,
          as: 'dept',
          attributes: [ 'id', 'name' ], // 只返回需要的字段
        },
      ],
      attributes: { 
        exclude: [ 'password', 'salt' ] 
      },
    });

    return admin ? admin.toJSON() : null;
  }
}
```



### 第四步：使用数据库事务

javascript

```js
/**
 * 使用事务的完整示例
 */
async createAdminWithTransaction(adminData, roleIds) {
  const { ctx } = this;
  
  // 创建事务
  const transaction = await ctx.model.transaction();

  try {
    // 1. 创建管理员
    const admin = await ctx.model.SystemAuthAdmin.create(adminData, { 
      transaction 
    });

    // 2. 创建角色关联
    const rolePromises = roleIds.map(roleId => 
      ctx.model.SystemAuthAdminRole.create({
        adminId: admin.id,
        roleId: roleId,
      }, { transaction })
    );

    await Promise.all(rolePromises);

    // 3. 提交事务
    await transaction.commit();

    return admin.toJSON();
  } catch (err) {
    // 回滚事务
    await transaction.rollback();
    throw new Error(`创建管理员事务失败: ${err.message}`);
  }
}
```



### 第五步：使用 Sequelize 操作符

javascript

```js
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

class ExampleService extends Service {
  
  async complexQueryExample() {
    const { ctx } = this;
    
    const results = await ctx.model.SystemAuthAdmin.findAll({
      where: {
        [Op.and]: [
          { isDelete: 0 },
          { 
            [Op.or]: [
              { username: { [Op.like]: '%admin%' } },
              { nickname: { [Op.like]: '%管理员%' } }
            ]
          },
          { createTime: { [Op.gte]: new Date('2023-01-01') } },
          { id: { [Op.in]: [1, 2, 3, 4, 5] } }
        ]
      },
      order: [
        [ 'isDisable', 'ASC' ],
        [ 'createTime', 'DESC' ]
      ],
      limit: 100,
      offset: 0
    });

    return results.map(item => item.toJSON());
  }
}
```



## 🔧 常用 Sequelize 方法总结

### 查询方法

| 方法                | 说明         | 示例                                              |
| :------------------ | :----------- | :------------------------------------------------ |
| `findAll()`         | 查询多条记录 | `Model.findAll({ where: { status: 1 } })`         |
| `findOne()`         | 查询单条记录 | `Model.findOne({ where: { id: 1 } })`             |
| `findByPk()`        | 通过主键查询 | `Model.findByPk(1)`                               |
| `findAndCountAll()` | 分页查询     | `Model.findAndCountAll({ limit: 10, offset: 0 })` |
| `count()`           | 统计数量     | `Model.count({ where: { status: 1 } })`           |

### 增删改方法

| 方法           | 说明     | 示例                                                   |
| :------------- | :------- | :----------------------------------------------------- |
| `create()`     | 创建记录 | `Model.create({ name: 'John' })`                       |
| `update()`     | 更新记录 | `Model.update({ name: 'Jane' }, { where: { id: 1 } })` |
| `destroy()`    | 删除记录 | `Model.destroy({ where: { id: 1 } })`                  |
| `bulkCreate()` | 批量创建 | `Model.bulkCreate([{name:'A'}, {name:'B'}])`           |

### 其他方法

| 方法              | 说明        |
| :---------------- | :---------- |
| `max()` / `min()` | 最大/最小值 |
| `sum()`           | 求和        |
| `increment()`     | 字段自增    |
| `decrement()`     | 字段自减    |

## 📋 最佳实践

### 1. 错误处理

javascript

```js
try {
  const result = await ctx.model.User.findOne({ where: { id: 1 } });
  if (!result) {
    throw new Error('用户不存在');
  }
  return result.toJSON();
} catch (err) {
  ctx.logger.error('数据库查询错误:', err);
  throw err;
}
```



### 2. 字段选择

javascript

```js
// 只选择需要的字段
const users = await ctx.model.User.findAll({
  attributes: ['id', 'name', 'email'], // 只返回这些字段
  where: { status: 1 }
});
```



### 3. 关联查询

javascript

```js
const users = await ctx.model.User.findAll({
  include: [
    {
      model: ctx.model.Role,
      as: 'roles',
      through: { attributes: [] } // 不返回中间表字段
    }
  ]
});
```



### 4. 原始查询（复杂SQL）

javascript

```js
const [results] = await ctx.model.query(
  'SELECT * FROM users WHERE age > ? AND status = ?',
  {
    replacements: [18, 1],
    type: ctx.model.QueryTypes.SELECT
  }
);
```



## 🚀 实际项目中的使用模式

根据您提供的代码，项目中的典型使用模式是：

1. **Service 层处理所有数据库操作**
2. **Controller 层调用 Service 方法**
3. **统一的错误处理机制**
4. **使用事务保证数据一致性**
5. **软删除而不是物理删除**

这样设计使得代码结构清晰，易于维护和测试。