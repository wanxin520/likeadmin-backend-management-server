/* eslint-disable jsdoc/require-param */
'use strict';

/**
 * 系统路由配置文件
 * 功能：定义所有后端API接口的路由映射
 * 将HTTP请求映射到对应的控制器方法
 * 使用 router.all 支持所有HTTP方法（GET、POST、PUT、DELETE等）
 */
module.exports = app => {
  // 从 app 中解构 router 和 controller
  const { router, controller } = app;

  // ==================== 系统基础功能路由 ====================

  /** 用户登录 */
  router.all('/api/system/login', controller.system.login);
  /** 用户退出登录 */
  router.all('/api/system/logout', controller.system.logout);
  /** 获取菜单路由信息 */
  router.all('/api/system/menu/route', controller.system.menusRoute);
  /** 控制台首页数据 */
  router.all('/api/common/index/console', controller.system.console);
  /** 获取系统配置信息 */
  router.all('/api/common/index/config', controller.system.configInfo);

  // ==================== 部门管理路由 ====================

  /** 获取部门列表 */
  router.all('/api/system/dept/list', controller.system.dept.deptList);
  /** 添加部门 */
  router.all('/api/system/dept/add', controller.system.dept.deptAdd);
  /** 获取部门详情 */
  router.all('/api/system/dept/detail', controller.system.dept.deptDetail);
  /** 编辑部门信息 */
  router.all('/api/system/dept/edit', controller.system.dept.deptEdit);
  /** 删除部门 */
  router.all('/api/system/dept/del', controller.system.dept.deptDel);
  /** 获取所有部门（树形结构） */
  router.all('/api/system/dept/all', controller.system.dept.deptAll);

  // ==================== 岗位管理路由 ====================

  /** 获取岗位列表 */
  router.all('/api/system/post/list', controller.system.post.postList);
  /** 添加岗位 */
  router.all('/api/system/post/add', controller.system.post.postAdd);
  /** 获取岗位详情 */
  router.all('/api/system/post/detail', controller.system.post.postDetail);
  /** 编辑岗位信息 */
  router.all('/api/system/post/edit', controller.system.post.postEdit);
  /** 删除岗位 */
  router.all('/api/system/post/del', controller.system.post.postDel);
  /** 获取所有岗位 */
  router.all('/api/system/post/all', controller.system.post.postAll);

  // ==================== 管理员管理路由 ====================

  /** 获取管理员列表 */
  router.all('/api/system/admin/list', controller.system.admin.adminList);
  /** 获取当前登录管理员信息 */
  router.all('/api/system/admin/self', controller.system.admin.self);
  /** 添加管理员 */
  router.all('/api/system/admin/add', controller.system.admin.add);
  /** 获取管理员详情 */
  router.all('/api/system/admin/detail', controller.system.admin.detail);
  /** 编辑管理员信息 */
  router.all('/api/system/admin/edit', controller.system.admin.edit);
  /** 更新管理员信息 */
  router.all('/api/system/admin/upInfo', controller.system.admin.update);
  /** 删除管理员 */
  router.all('/api/system/admin/del', controller.system.admin.del);
  /** 禁用/启用管理员 */
  router.all('/api/system/admin/disable', controller.system.admin.disable);

  // ==================== 角色管理路由 ====================

  /** 获取所有角色 */
  router.all('/api/system/role/all', controller.system.role.roleAll);
  /** 获取角色列表 */
  router.all('/api/system/role/list', controller.system.role.roleList);
  /** 获取角色详情 */
  router.all('/api/system/role/detail', controller.system.role.detail);
  /** 添加角色 */
  router.all('/api/system/role/add', controller.system.role.add);
  /** 编辑角色信息 */
  router.all('/api/system/role/edit', controller.system.role.edit);
  /** 删除角色 */
  router.all('/api/system/role/del', controller.system.role.del);

  // ==================== 菜单管理路由 ====================

  /** 获取菜单列表 */
  router.all('/api/system/menu/list', controller.system.menu.menuList);
  /** 获取菜单详情 */
  router.all('/api/system/menu/detail', controller.system.menu.menuDetail);
  /** 添加菜单 */
  router.all('/api/system/menu/add', controller.system.menu.menuAdd);
  /** 编辑菜单信息 */
  router.all('/api/system/menu/edit', controller.system.menu.menuEdit);
  /** 删除菜单 */
  router.all('/api/system/menu/del', controller.system.menu.menuDel);

  // ==================== 素材管理路由 ====================

  /** 获取相册分类列表 */
  router.all('/api/common/album/cateList', controller.common.album.cateList);
  /** 添加相册分类 */
  router.all('/api/common/album/cateAdd', controller.common.album.cateAdd);
  /** 重命名相册分类 */
  router.all('/api/common/album/cateRename', controller.common.album.cateRename);
  /** 删除相册分类 */
  router.all('/api/common/album/cateDel', controller.common.album.cateDel);
  /** 获取相册文件列表 */
  router.all('/api/common/album/albumList', controller.common.album.albumList);
  /** 重命名相册文件 */
  router.all('/api/common/album/albumRename', controller.common.album.albumRename);
  /** 删除相册文件 */
  router.all('/api/common/album/albumDel', controller.common.album.albumDel);
  /** 添加相册文件 */
  router.all('/api/common/album/albumAdd', controller.common.album.albumAdd);
  /** 移动相册文件到其他分类 */
  router.all('/api/common/album/albumMove', controller.common.album.albumMove);

  // ==================== 文件上传路由 ====================

  /** 上传图片文件 */
  router.all('/api/common/upload/image', controller.common.album.uploadImage);
  /** 上传视频文件 */
  router.all('/api/common/upload/video', controller.common.album.uploadVideo);

  // ==================== 网站设置路由 ====================

  /** 获取网站信息详情 */
  router.all('/api/setting/website/detail', controller.setting.website.details);
  /** 保存网站信息 */
  router.all('/api/setting/website/save', controller.setting.website.save);
  /** 获取版权信息详情 */
  router.all('/api/setting/copyright/detail', controller.setting.copyright.details);
  /** 保存版权信息 */
  router.all('/api/setting/copyright/save', controller.setting.copyright.save);
  /** 获取协议信息详情 */
  router.all('/api/setting/protocol/detail', controller.setting.protocol.details);
  /** 保存协议信息 */
  router.all('/api/setting/protocol/save', controller.setting.protocol.save);
  /** 获取存储配置列表 */
  router.all('/api/setting/storage/list', controller.setting.storage.list);
  /** 获取存储配置详情 */
  router.all('/api/setting/storage/detail', controller.setting.storage.detail);
  /** 编辑存储配置 */
  router.all('/api/setting/storage/edit', controller.setting.storage.edit);
  /** 切换存储配置 */
  router.all('/api/setting/storage/change', controller.setting.storage.change);

  // ==================== 系统监控路由 ====================

  /** 获取服务器监控信息 */
  router.all('/api/monitor/server', controller.monitor.monitor.server);
  /** 获取缓存监控信息 */
  router.all('/api/monitor/cache', controller.monitor.monitor.cache);

  // ==================== 日志管理路由 ====================

  /** 获取操作日志列表 */
  router.all('/api/system/log/operate', controller.system.log.operate);

  // ==================== 字典管理路由 ====================

  /** 获取字典类型列表 */
  router.all('/api/setting/dict/type/list', controller.setting.dict.list);
  /** 获取所有字典类型 */
  router.all('/api/setting/dict/type/all', controller.setting.dict.all);
  /** 添加字典类型 */
  router.all('/api/setting/dict/type/add', controller.setting.dict.add);
  /** 获取字典类型详情 */
  router.all('/api/setting/dict/type/detail', controller.setting.dict.detail);
  /** 编辑字典类型 */
  router.all('/api/setting/dict/type/edit', controller.setting.dict.edit);
  /** 删除字典类型 */
  router.all('/api/setting/dict/type/del', controller.setting.dict.del);
  /** 获取字典数据列表 */
  router.all('/api/setting/dict/data/list', controller.setting.dict.dataList);
  /** 获取所有字典数据 */
  router.all('/api/setting/dict/data/all', controller.setting.dict.dataAll);
  /** 获取字典数据详情 */
  router.all('/api/setting/dict/data/detail', controller.setting.dict.dataDetail);
  /** 添加字典数据 */
  router.all('/api/setting/dict/data/add', controller.setting.dict.dataAdd);
  /** 编辑字典数据 */
  router.all('/api/setting/dict/data/edit', controller.setting.dict.dataEdit);
  /** 删除字典数据 */
  router.all('/api/setting/dict/data/del', controller.setting.dict.dataDel);

  // ==================== 代码生成器路由 ====================

  /** 获取已生成代码列表 */
  router.all('/api/gen/list', controller.gen.gen.list);
  /** 获取数据库表列表 */
  router.all('/api/gen/db', controller.gen.gen.dbTables);
  /** 导入数据库表 */
  router.all('/api/gen/importTable', controller.gen.gen.importTable);
  /** 删除已导入的表 */
  router.all('/api/gen/delTable', controller.gen.gen.delTable);
  /** 同步数据库表结构 */
  router.all('/api/gen/syncTable', controller.gen.gen.syncTable);
  /** 预览生成代码 */
  router.all('/api/gen/previewCode', controller.gen.gen.previewCode);
  /** 下载生成代码 */
  router.all('/api/gen/downloadCode', controller.gen.gen.downloadCode);
};