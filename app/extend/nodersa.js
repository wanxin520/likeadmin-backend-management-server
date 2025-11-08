'use strict';

/**
 * nodersa.js 是 RSA 非对称加密工具模块，基于 node-rsa 库实现数据的
 * 加密解密和数字签名功能，为系统提供安全的非对称加密解决方案。
 */

// 引入 node-rsa 非对称加密库
const nodeRSA = require('node-rsa');
// 引入配置文件，获取预生成的 RSA 密钥对
const rsa = require('./config');

/**
 * RSA 密钥配置
 * 从配置文件中获取预生成的公钥和私钥
 * 这些密钥是在系统初始化时生成的固定密钥对
 */
const publicKey = rsa.publicKey; // 公钥 - 用于加密和验证签名
const privateKey = rsa.privateKey; // 私钥 - 用于解密和生成签名

// 测试代码示例（已注释）
// const txt = JSON.stringify({ name: 'bag' });
// console.log(publicKey)
// console.log(privateKey)

/**
 * RSA 加密函数
 * 使用公钥对数据进行加密
 *
 * @param {string|Buffer} data - 要加密的数据，可以是字符串或 Buffer
 * @return {Promise<string>} Base64 编码的加密字符串
 *
 * @加密流程
 * 1. 创建公钥实例（指定格式为 pkcs8-public）
 * 2. 将数据转换为 Buffer
 * 3. 使用公钥加密数据
 * 4. 返回 Base64 格式的加密字符串
 *
 * @使用场景
 * - 敏感数据加密传输
 * - 客户端到服务端的安全通信
 * - 密码等敏感信息的加密存储
 */
async function rsaEncrypt(data) {
  // 创建公钥实例，指定密钥格式为 PKCS8 公钥格式
  const pubKey = new nodeRSA(publicKey, 'pkcs8-public');
  // 使用公钥加密数据，返回 Base64 格式的加密字符串
  return pubKey.encrypt(Buffer.from(data), 'base64');
}

/**
 * RSA 解密函数
 * 使用私钥对加密数据进行解密
 *
 * @param {string} data - Base64 编码的加密数据
 * @return {Promise<string>} 解密后的原始数据字符串
 *
 * @解密流程
 * 1. 创建私钥实例
 * 2. 设置加密方案为 pkcs1（与前端 jsencrypt 库兼容）
 * 3. 使用私钥解密数据
 * 4. 返回 UTF-8 格式的解密字符串
 *
 * @兼容性说明
 * 由于前端常用的 jsencrypt 库使用 pkcs1 加密方案，
 * 而 node-rsa 默认使用 pkcs1_oaep，所以需要显式设置为 pkcs1
 */
async function rsaDecrypt(data) {
  // 创建私钥实例
  const priKey = new nodeRSA(privateKey);
  // 设置加密方案为 pkcs1，确保与前端 jsencrypt 库兼容
  priKey.setOptions({ encryptionScheme: 'pkcs1' });
  // 使用私钥解密数据，返回 UTF-8 格式的字符串
  return priKey.decrypt(data, 'utf8');
}

// 测试代码示例（已注释）
// const sign = rsaEncrypt(txt)
// const _src = rsaDecrypt(sign)
// console.log('加密：', sign)
// console.log('解密：', _src)
/*
加密： fBaBFVPv+96I/r6a2tfPbYWa0yjgJKQ+K2/E9obGNo0dYBOSBzW2PgnPOHX+/pq0wUZPxJzcwt5YcMtOsUNuZAYpaPZJ9o6IOEKj823HBNbyerDMUfU3rINCk2FilRuxFpQPmBZTbSvSumKligdtsh1Vz02DwdRgbJHp5bm4Hjk=
解密： 123
*/

/**
 * RSA 数字签名函数
 * 使用私钥对数据进行签名，用于验证数据完整性和来源
 *
 * @param {string|Buffer} data - 要签名的数据
 * @return {string} 十六进制格式的数字签名
 *
 * @签名流程
 * 1. 创建私钥实例（指定格式为 pkcs8-private）
 * 2. 将数据转换为 Buffer
 * 3. 使用私钥生成数字签名
 * 4. 返回十六进制格式的签名字符串
 *
 * @使用场景
 * - API 请求签名验证
 * - 数据完整性校验
 * - 身份认证
 */
function signRSA(data) {
  // 创建私钥实例，指定密钥格式为 PKCS8 私钥格式
  const priKey = new nodeRSA(privateKey, 'pkcs8-private');
  // 使用私钥对数据生成数字签名，返回十六进制格式
  return priKey.sign(Buffer.from(data), 'hex');
}

/**
 * RSA 签名验证函数
 * 使用公钥验证数字签名的有效性
 *
 * @param {string|Buffer} decrypt - 原始数据（解密后的数据）
 * @param {string} signs - 十六进制格式的数字签名
 * @return {boolean} 签名验证结果（true-有效，false-无效）
 *
 * @验证流程
 * 1. 创建公钥实例（指定格式为 pkcs8-public）
 * 2. 将原始数据转换为 Buffer
 * 3. 使用公钥验证签名
 * 4. 返回验证结果
 *
 * @安全意义
 * - 验证数据在传输过程中未被篡改
 * - 确认数据确实来自持有私钥的发送方
 */
function verifyRSA(decrypt, signs) {
  // 创建公钥实例，指定密钥格式为 PKCS8 公钥格式
  const pubKey = new nodeRSA(publicKey, 'pkcs8-public');
  // 使用公钥验证签名，返回验证结果
  return pubKey.verify(Buffer.from(decrypt), signs, 'utf8', 'hex');
}

// 测试代码示例（已注释）
// const signature = signRSA(sign)
// console.log('私钥签名：' + signature)
// console.log('公钥验证：' + verifyRSA(sign, signature))
/*
私钥签名：873ae60fa3a5a89850185632b53e54b7c9919d146f2464a857f83679d9862e0612973c891994f6f576d4c04913a8b0a17b9b3adaa3577fcb81d637b2ede0c4a1cffadcaa99b81d09a7edfa69a813cd9f87fe52d96c371f6af533dd5577fdc0f6f7dc6857e1a78d425c0be71f7c440e44e8f932c4ed8890dba007721d10832e92
公钥验证：true
*/

/**
 * 模块导出
 * 提供完整的 RSA 非对称加密解密和数字签名功能
 */
module.exports = {
  rsaEncrypt, // RSA 加密函数
  rsaDecrypt, // RSA 解密函数
  signRSA, // RSA 数字签名函数
  verifyRSA, // RSA 签名验证函数
};
