/* eslint-disable jsdoc/check-tag-names */
'use strict';

/**
 * index.js - 系统工具函数库
 *
 * 功能：提供项目中使用的各种通用工具函数和数据处理方法
 * 包含数据转换、字符串处理、ID生成、格式化等常用功能
 *
 * 核心特性：
 * - 数据结构的转换和处理
 * - 唯一标识符生成
 * - 字符串和数字的格式化
 * - 异步操作的Promise封装
 */

// 引入 UUID 库，用于生成全局唯一标识符
const { v4: uuidv4 } = require('uuid');

/**
 * 将结构体数组转换为 Map 列表
 * 通过深拷贝确保原始数据不被修改，并返回新的对象数组
 *
 * @param {Array<Object>} objs - 要转换的结构体对象数组
 * @return {Array<Object>} 返回深拷贝后的新对象数组
 *
 * @throws {Error} 当 JSON 序列化或解析失败时抛出错误
 *
 * @使用场景
 * - 从数据库查询结果中提取纯净数据
 * - 避免对象引用导致的意外修改
 * - 准备数据用于树形结构转换
 *
 * @示例
 * const original = [{id: 1, name: 'John'}, {id: 2, name: 'Jane'}];
 * const result = structsToMaps(original);
 * // result 是原始数据的深拷贝副本
 */
function structsToMaps(objs) {
  const objList = [];
  try {
    // 遍历所有对象，进行深拷贝
    for (const obj of objs) {
      // 使用 JSON 序列化和反序列化实现深拷贝
      objList.push(JSON.parse(JSON.stringify(obj)));
    }

    // 映射处理，这里直接返回但保留了扩展的可能性
    const data = objList.map(obj => {
      return obj;
    });
    return data;
  } catch (err) {
    throw new Error(`convertUtil.structsToMaps err: err=[${err}]`);
  }
}

/**
 * 将扁平列表转换为树形结构
 * 根据父子关系构建层次结构，常用于菜单、分类等数据
 *
 * @param {Array<Object>} arr - 扁平的对象数组
 * @param {string} id - 节点ID的字段名
 * @param {string} pid - 父节点ID的字段名
 * @param {string} child - 子节点列表的字段名
 * @return {Array<Object>} 返回树形结构的根节点数组
 *
 * @算法说明
 * 1. 第一次遍历：建立 ID 到对象的映射表
 * 2. 第二次遍历：将子节点挂载到对应的父节点下
 * 3. 没有父节点的对象作为根节点返回
 *
 * @使用场景
 * - 菜单权限的树形展示
 * - 组织架构的层次显示
 * - 分类目录的树状结构
 *
 * @示例
 * const list = [
 *   {id: 1, pid: 0, name: '父节点'},
 *   {id: 2, pid: 1, name: '子节点'}
 * ];
 * const tree = listToTree(list, 'id', 'pid', 'children');
 * // 结果: [{id:1, pid:0, name:'父节点', children:[{id:2, pid:1, name:'子节点'}]}]
 */
function listToTree(arr, id, pid, child) {
  const mapList = []; // 存储根节点列表
  const idValMap = new Map(); // ID 到对象的映射表

  // 第一次遍历：建立 ID 映射表
  for (const m of arr) {
    if (m[id]) {
      idValMap.set(m[id], m);
    }
  }

  // 第二次遍历：构建父子关系
  for (const m of arr) {
    if (m[pid]) {
      // 查找父节点
      const pNode = idValMap.get(m[pid]);
      if (pNode) {
        // 获取或初始化子节点数组
        let cVal = pNode[child];
        if (cVal === null || cVal === undefined) {
          cVal = [ m ]; // 初始化子节点数组
        } else {
          cVal.push(m); // 添加到现有子节点数组
        }
        pNode[child] = cVal;
        continue; // 子节点已处理，跳过根节点添加
      }
    }
    // 没有父节点或父节点不存在的对象作为根节点
    mapList.push(m);
  }

  return mapList;
}

/**
 * 生成指定长度的随机字符串
 * 包含大小写字母和数字，适用于验证码、临时密码等场景
 *
 * @param {number} length - 要生成的字符串长度
 * @return {string} 返回指定长度的随机字符串
 *
 * @字符集
 * - 小写字母: a-z (26个)
 * - 大写字母: A-Z (26个)
 * - 数字: 0-9 (10个)
 * - 总计: 62个字符
 *
 * @使用场景
 * - 生成验证码
 * - 创建临时密码
 * - 文件命名
 * - 盐值生成
 *
 * @示例
 * randomString(8) // 可能返回: "aB3x9KpL"
 */
function randomString(length) {
  // 可用字符集：大小写字母 + 数字
  const allRandomStr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let byteList = '';

  // 循环生成指定长度的随机字符串
  for (let i = 0; i < length; i++) {
    // 从字符集中随机选取一个字符
    byteList += allRandomStr.charAt(Math.floor(Math.random() * allRandomStr.length));
  }

  return byteList;
}

/**
 * 生成标准的 UUID（去除连字符）
 * 生成全局唯一标识符，适用于分布式系统中的ID生成
 *
 * @return {string} 返回32位的UUID字符串（无连字符）
 *
 * @UUID格式
 * - 标准格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * - 返回格式: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 * @使用场景
 * - 数据库主键生成
 * - 分布式系统ID
 * - 文件唯一标识
 * - 会话ID
 *
 * @示例
 * makeUuid() // 返回: "550e8400e29b41d4a716446655440000"
 */
function makeUuid() {
  // 生成 UUID 并移除连字符
  return uuidv4().replace(/-/g, '');
}

/**
 * 格式化文件大小显示
 * 将字节数转换为易读的大小格式（B, KB, MB, GB, TB, PB）
 *
 * @param {number} data - 文件大小的字节数
 * @return {string} 返回格式化后的大小字符串
 *
 * @换算规则
 * - 1024B = 1KB
 * - 1024KB = 1MB
 * - 1024MB = 1GB
 * - 1024GB = 1TB
 * - 1024TB = 1PB
 *
 * @显示格式
 * - 保留2位小数
 * - 自动选择合适的单位
 *
 * @示例
 * getFmtSize(1024)     // "1.00KB"
 * getFmtSize(1536)     // "1.50KB"
 * getFmtSize(1048576)  // "1.00MB"
 */
function getFmtSize(data) {
  const factor = 1024; // 换算因子
  let res = data; // 当前计算值

  // 单位数组，从字节到PB
  const units = [ '', 'K', 'M', 'G', 'T', 'P' ];

  // 遍历单位，找到合适的级别
  for (let i = 0; i < units.length; i++) {
    if (res < factor) {
      // 找到合适单位，返回格式化字符串
      return `${res.toFixed(2)}${units[i]}B`;
    }
    // 换算到下一级单位
    res /= factor;
  }

  // 如果超过PB级别，直接返回PB
  return `${res.toFixed(2)}P`;
}

/**
 * 浮点数四舍五入
 * 解决 JavaScript 原生 toFixed 方法的精度问题
 *
 * @param {number} val - 要四舍五入的数值
 * @param {number} n - 要保留的小数位数
 * @return {number} 返回四舍五入后的数值
 *
 * @算法原理
 * - 将数值乘以 10^n 放大
 * - 使用 Math.round 进行四舍五入
 * - 再除以 10^n 还原
 *
 * @优势
 * - 避免 toFixed 的银行家舍入问题
 * - 结果始终为数值类型（非字符串）
 *
 * @示例
 * round(1.235, 2)  // 1.24
 * round(1.234, 2)  // 1.23
 */
function round(val, n) {
  const base = Math.pow(10, n); // 计算基数
  return Math.round(base * val) / base; // 放大→舍入→还原
}

/**
 * 下划线命名转换为驼峰命名
 * 将下划线分隔的字符串转换为小驼峰格式
 *
 * @param {string} s - 下划线命名的字符串
 * @return {string} 返回驼峰命名的字符串
 *
 * @转换规则
 * - 第一个单词首字母小写
 * - 后续单词首字母大写
 * - 移除所有下划线
 *
 * @示例
 * toCamelCase("user_name")     // "userName"
 * toCamelCase("first_name")    // "firstName"
 * toCamelCase("get_user_info") // "getUserInfo"
 */
function toCamelCase(s) {
  const words = s.split('_'); // 按下划线分割单词

  // 从第二个单词开始，首字母大写
  for (let i = 1; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }

  return words.join(''); // 拼接所有单词
}

/**
 * 下划线命名转换为帕斯卡命名（大驼峰）
 * 将下划线分隔的字符串转换为大驼峰格式
 *
 * @param {string} str - 下划线命名的字符串
 * @return {string} 返回帕斯卡命名的字符串
 *
 * @转换规则
 * - 所有单词首字母大写
 * - 移除所有下划线
 *
 * @与驼峰命名的区别
 * - 驼峰: firstName
 * - 帕斯卡: FirstName
 *
 * @示例
 * toPascalCase("user_name")     // "UserName"
 * toPascalCase("first_name")    // "FirstName"
 * toPascalCase("get_user_info") // "GetUserInfo"
 */
function toPascalCase(str) {
  const words = str.split('_'); // 按下划线分割单词

  // 所有单词首字母大写
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].slice(1);
  }

  return words.join(''); // 拼接所有单词
}

/**
 * 检查数组是否包含指定元素
 * 提供类型安全的数组包含检查
 *
 * @param {*} src - 要检查的源数据（通常是数组）
 * @param {*} elem - 要查找的元素
 * @return {boolean} 如果源数据是数组且包含元素则返回 true，否则返回 false
 *
 * @优势
 * - 类型安全：非数组直接返回 false
 * - 使用 includes 方法，支持各种数据类型
 *
 * @示例
 * contains([1, 2, 3], 2)        // true
 * contains(["a", "b"], "c")     // false
 * contains("not array", "a")    // false
 */
function contains(src, elem) {
  // 确保源数据是数组类型
  if (Array.isArray(src)) {
    return src.includes(elem); // 使用数组的 includes 方法
  }
  return false; // 非数组类型直接返回 false
}

// 引入 Node.js 流和行读取模块
const { Readable } = require('stream');
const readline = require('readline');

/**
 * 将字符串按行分割为数组
 * 使用流式处理，支持各种换行符，避免内存问题
 *
 * @param {string} s - 要分割的字符串
 * @return {Array<string>} 返回行数组
 *
 * @技术特点
 * - 使用 Readable 流处理大字符串
 * - 自动处理不同平台的换行符
 * - 避免一次性加载大字符串的内存问题
 *
 * @使用场景
 * - 处理日志文件内容
 * - 解析文本配置
 * - 处理用户输入的多行文本
 *
 * @示例
 * const text = "第一行\n第二行\n第三行";
 * stringToLines(text) // ["第一行", "第二行", "第三行"]
 */
function stringToLines(s) {
  const lines = [];

  // 创建可读流
  const stream = new Readable();
  stream.push(s); // 推送字符串数据
  stream.push(null); // 表示流结束

  // 创建行读取接口
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity, // 处理所有换行符
  });

  // 逐行读取
  for (const line of rl) {
    lines.push(line);
  }

  return lines;
}

/**
 * 将回调风格的函数转换为 Promise 风格
 * 适用于将传统的 Node.js 回调函数现代化
 *
 * @param {Function} func - 要转换的回调风格函数
 * @return {Function} 返回新的 Promise 风格函数
 *
 * @转换规则
 * - 原函数: func(arg1, arg2, ..., callback)
 * - 新函数: func(arg1, arg2, ...).then().catch()
 *
 * @使用场景
 * - 现代化旧的回调风格API
 * - 在 async/await 中使用回调函数
 * - 统一异步处理风格
 *
 * @示例
 * const fs = require('fs');
 * const readFilePromise = promisify(fs.readFile);
 *
 * // 使用方式
 * readFilePromise('file.txt', 'utf8')
 *   .then(data => console.log(data))
 *   .catch(err => console.error(err));
 */
const promisify = func => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      // 调用原函数，添加回调参数
      func(...args, (err, result) => {
        if (err) {
          reject(err); // 错误时拒绝 Promise
        } else {
          resolve(result); // 成功时解析 Promise
        }
      });
    });
  };
};

// 导出所有工具函数
module.exports = {
  structsToMaps, // 结构体转Map列表
  listToTree, // 列表转树形结构
  randomString, // 生成随机字符串
  makeUuid, // 生成UUID
  getFmtSize, // 格式化文件大小
  round, // 浮点数四舍五入
  stringToLines, // 字符串分行
  toCamelCase, // 转驼峰命名
  contains, // 数组包含检查
  toPascalCase, // 转帕斯卡命名
  promisify, // 回调函数Promise化
};
