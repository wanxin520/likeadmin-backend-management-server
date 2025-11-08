'use strict';

/**
 * context.js 是上下文扩展工具文件，为 Egg.js 的 Context 对象提供自定义方法扩展，包含 Token 加密解密、
 * 随机字符串生成、邮件服务和 RSA 加密等工具函数。
 */

// JWT Token 实现的示例代码（已注释，实际使用 AES 加密）
// const JWT = require('jsonwebtoken');
// const SECRET_KEY = 'I_LOVE_YANGHANG';
// module.exports = {
//     setToken({name, password}) {
//         let payload = {name, password};
//         return JWT.sign(payload, SECRET_KEY, {expiresIn: 60 * 3}) // 还有一种写法 "24h"
//     },
//     getDecodeToken(token) {
//         return JWT.verify(token, secret)
//     }
// };

// 引入加密库
const CryptoJS = require('crypto-js');

/**
 * AES 加密配置
 * 使用 CBC 模式，PKCS7 填充方式
 */
// 十六位十六进制数作为密钥
const key = CryptoJS.enc.Utf8.parse('1234123412QWERTY');
// 十六位十六进制数作为密钥偏移量
const iv = CryptoJS.enc.Utf8.parse('QWERTY1234123412');

// 引入其他工具模块
const email = require('./email');
const nodersa = require('./nodersa');

/**
 * Context 扩展工具模块
 * 为 Egg.js 的 Context 对象提供自定义方法扩展
 * 这些方法可以通过 ctx.helper 调用
 */
module.exports = {

  /**
   * 生成加密 Token
   * 使用 AES-CBC 模式加密用户信息生成 Token
   *
   * @param {Object} userInfo - 用户信息对象
   * @param {string} userInfo.password - 用户密码
   * @param {string} userInfo.username - 用户名
   * @return {string} 大写的十六进制加密字符串
   *
   * @加密流程
   * 1. 将用户信息转为 JSON 字符串
   * 2. 使用 UTF-8 编码
   * 3. AES-CBC 模式加密
   * 4. PKCS7 填充
   * 5. 转为大写十六进制字符串
   *
   * @使用示例
   * const token = ctx.helper.setToken({username: 'admin', password: '123456'});
   */
  setToken({ password, username }) {
    // 1. 将用户信息对象转为 JSON 字符串并进行 UTF-8 编码
    const str = CryptoJS.enc.Utf8.parse(JSON.stringify({ password, username }));

    // 2. 使用 AES-CBC 模式进行加密
    const encrypted = CryptoJS.AES.encrypt(str, key, {
      iv, // 初始化向量
      mode: CryptoJS.mode.CBC, // CBC 加密模式
      padding: CryptoJS.pad.Pkcs7, // PKCS7 填充方式
    });

    // 3. 将加密结果转为大写十六进制字符串返回
    return encrypted.ciphertext.toString().toUpperCase();
  },

  /**
   * 解密 Token
   * 将加密的 Token 字符串解密还原为用户信息
   *
   * @param {string} token - 加密的 Token 字符串
   * @return {string} 解密后的原始用户信息 JSON 字符串
   *
   * @解密流程
   * 1. 将十六进制字符串解析为 Hex 格式
   * 2. 转为 Base64 格式（AES 解密需要的格式）
   * 3. 使用 AES-CBC 模式解密
   * 4. 转为 UTF-8 字符串
   *
   * @使用示例
   * const userInfoStr = ctx.helper.getDecodeToken(token);
   * const userInfo = JSON.parse(userInfoStr);
   */
  getDecodeToken(token) {
    // 1. 将十六进制字符串解析为 Hex 格式
    const encryptedHexStr = CryptoJS.enc.Hex.parse(token);

    // 2. 将 Hex 格式转为 Base64 格式（AES 解密需要的输入格式）
    const str = CryptoJS.enc.Base64.stringify(encryptedHexStr);

    // 3. 使用 AES-CBC 模式进行解密
    const decrypt = CryptoJS.AES.decrypt(str, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // 4. 将解密结果转为 UTF-8 字符串
    const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
  },

  /**
   * 生成随机字符串
   * 生成带有固定前缀的随机字符串，用于盐值、验证码等场景
   *
   * @return {string} 格式为 "yxs_2022_xxxxxxxx" 的随机字符串
   *                   - 固定前缀: "yxs_2022_"
   *                   - 8位随机字符: 包含数字和大小写字母
   *
   * @字符集 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
   *
   * @使用场景
   * - 密码加密的盐值
   * - 文件名的随机部分
   * - 临时令牌
   * - 验证码生成
   */
  randomString() {
    // 可用字符集：数字 + 小写字母 + 大写字母
    const str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // 固定前缀
    let result = 'yxs_2022_';

    // 生成8位随机字符
    for (let i = 8; i > 0; --i) {
      result += str[Math.floor(Math.random() * str.length)];
    }

    return result;
  },

  /**
   * 邮件服务模块
   * 提供发送邮件的相关功能
   */
  email,

  /**
   * RSA 加密模块
   * 提供非对称加密解密功能
   */
  nodersa,
};
