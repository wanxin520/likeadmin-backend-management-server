'use strict';

/**
 * emailTmp.js 是邮件模板生成器，专门用于生成格式化的 HTML 邮件内容模板，支持动态数据插入，为系统邮件通知提供统一、美观的邮件样式。
 */

/**
 * 邮件模板生成函数
 * 根据传入的动态数据生成格式化的 HTML 邮件内容
 * 采用响应式设计，兼容各种邮件客户端
 *
 * @param {Object} params - 模板参数对象
 * @param {string} params.userEmail - 收件人邮箱地址，用于个性化问候
 * @param {number} params.downloads - 下载次数，用于展示统计数据
 * @returns {string} 完整的 HTML 邮件内容字符串
 *
 * @模板特性
 * - 响应式设计，适配不同屏幕尺寸
 * - 内联样式，确保邮件客户端兼容性
 * - 品牌统一的视觉设计
 * - 清晰的信息层次结构
 * - 包含行动召唤按钮
 */
const emailTmp = ({ userEmail, downloads }) => {
  // 返回完整的 HTML 邮件模板
  return `<div>
        <includetail>
            <div align="center">
                <div class="open_email" style="margin-left: 8px; margin-top: 8px; margin-bottom: 8px; margin-right: 8px;">
                    <div>
                        <br>
                        <span class="genEmailContent">
                            <!-- 邮件外层容器 -->
                            <div id="cTMail-Wrap"
                                 style="word-break: break-all;box-sizing:border-box;text-align:center;min-width:320px; max-width:660px; border:1px solid #f6f6f6; background-color:#f7f8fa; margin:auto; padding:20px 0 30px; font-family:'helvetica neue',PingFangSC-Light,arial,'hiragino sans gb','microsoft yahei ui','microsoft yahei',simsun,sans-serif">
                                
                                <!-- 邮件主要内容区域 -->
                                <div class="main-content" style="">
                                    <table style="width:100%;font-weight:300;margin-bottom:10px;border-collapse:collapse">
                                        <tbody>
                                        <tr style="font-weight:300">
                                            <td style="width:3%;max-width:30px;"></td>
                                            <td style="max-width:600px;">
                                                
                                                <!-- Logo 区域 -->
                                                <div id="cTMail-logo" style="width:92px; height:25px;">
                                                    <a href="">
                                                        <!-- 品牌 Logo 图片 -->
                                                        <img src="https://s1.ax1x.com/2022/05/16/OhlBlt.png"
                                                             style="width:92px;display:block" alt="Bag系统Logo">
                                                    </a>
                                                </div>
                                                
                                                <!-- 装饰性分隔线 -->
                                                <p style="height:2px;background-color: #00e6ff;border: 0;font-size:0;padding:0;width:100%;margin-top:20px;"></p>

                                                <!-- 邮件内容内层容器 -->
                                                <div id="cTMail-inner" style="background-color:#fff; padding:23px 0 20px;box-shadow: 0px 1px 1px 0px rgba(122, 55, 55, 0.2);text-align:left;">
                                                    <table style="width:100%;font-weight:300;margin-bottom:10px;border-collapse:collapse;text-align:left;">
                                                        <tbody>
                                                        <tr style="font-weight:300">
                                                            <td style="width:3.2%;max-width:30px;"></td>
                                                            <td style="max-width:480px;text-align:left;">
                                                                
                                                                <!-- 邮件标题 -->
                                                                <h1 id="cTMail-title" style="font-size: 20px; line-height: 36px; margin: 0px 0px 22px;">
                                                                    【Bag】博客开源门户系统
                                                                </h1>

                                                                <!-- 个性化问候语 -->
                                                                <p id="cTMail-userName" style="font-size:14px;color:#333; line-height:24px; margin:0;">
                                                                    尊敬的${userEmail}用户，您好！
                                                                </p>
                                                                
                                                                <!-- 品牌宣传语 -->
                                                                <p style="font-size:14px;color:#333; line-height:24px; margin:0; margin-top: 6px;">
                                                                    优秀的你，才能遇到优秀的世界，Bag管理系统框架
                                                                </p>
                                                                
                                                                <!-- 统计数据展示 -->
                                                                <p class="cTMail-content" style="line-height: 24px; margin: 6px 0px 0px; overflow-wrap: break-word; word-break: break-all;">
                                                                    <span style="color: rgb(51, 51, 51); font-size: 14px;">
                                                                        欢迎下载Bag，下载次数超过 <strong>${downloads}</strong>
                                                                    </span>
                                                                </p>

                                                                <!-- 操作指引 -->
                                                                <p class="cTMail-content" style="line-height: 24px; margin: 6px 0px 0px; overflow-wrap: break-word; word-break: break-all;">
                                                                    <span style="color: rgb(51, 51, 51); font-size: 14px;">
                                                                        完成下载，请点击下面按钮进行下载。
                                                                        <span style="font-weight: bold;">非本人操作可忽略。</span>
                                                                    </span>
                                                                </p>
                                                                
                                                                <!-- 主要行动召唤按钮 -->
                                                                <p class="cTMail-content" style="font-size: 14px; color: rgb(51, 51, 51); line-height: 24px; margin: 6px 0px 0px; word-wrap: break-word; word-break: break-all;">
                                                                    <a id="cTMail-btn" href="" title="" style="font-size: 16px; line-height: 45px; display: block; background-color: #00e6ff; color: rgb(255, 255, 255); text-align: center; text-decoration: none; margin-top: 20px; border-radius: 3px;">
                                                                        点击此处下载
                                                                    </a>
                                                                </p>

                                                                <!-- 备用链接（防止按钮无法点击） -->
                                                                <p class="cTMail-content" style="line-height: 24px; margin: 6px 0px 0px; overflow-wrap: break-word; word-break: break-all;">
                                                                    <span style="color: rgb(51, 51, 51); font-size: 14px;">
                                                                        <br>
                                                                        无法正常下载？请复制以下链接至浏览器打开：
                                                                        <br>
                                                                        <a href="" title=""
                                                                           style="color: rgb(0, 164, 255); text-decoration: none; word-break: break-all; overflow-wrap: normal; font-size: 14px;">
                                                                            联系管理员
                                                                        </a>
                                                                    </span>
                                                                </p>

                                                                <!-- 发件人信息 -->
                                                                <dl style="font-size: 14px; color: rgb(51, 51, 51); line-height: 18px;">
                                                                    <dd style="margin: 0px 0px 6px; padding: 0px; font-size: 12px; line-height: 22px;">
                                                                        <p id="cTMail-sender" style="font-size: 14px; line-height: 26px; word-wrap: break-word; word-break: break-all; margin-top: 32px;">
                                                                            此致作者
                                                                            <br>
                                                                            <strong>羊先生</strong>
                                                                        </p>
                                                                    </dd>
                                                                </dl>
                                                            </td>
                                                            <td style="width:3.2%;max-width:30px;"></td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <!-- 邮件页脚信息 -->
                                                <div id="cTMail-copy" style="text-align:center; font-size:12px; line-height:18px; color:#999">
                                                    <table style="width:100%;font-weight:300;margin-bottom:10px;border-collapse:collapse">
                                                        <tbody>
                                                            <tr style="font-weight:300">
                                                                <td style="width:3.2%;max-width:30px;"></td>
                                                                <td style="max-width:540px;">
                                                                    <!-- 系统邮件提示和取消订阅 -->
                                                                    <p style="text-align:center; margin:20px auto 14px auto;font-size:12px;color:#999;">
                                                                        此为系统邮件，请勿回复。
                                                                        <a href="" style="text-decoration:none;word-break:break-all;word-wrap:normal; color: #333;" target="_blank">
                                                                            取消订阅
                                                                        </a>
                                                                    </p>

                                                                    <!-- 版权信息和二维码 -->
                                                                    <p id="cTMail-rights" style="max-width: 100%; margin:auto;font-size:12px;color:#999;text-align:center;line-height:22px;">
                                                                        <img border="0" src="https://s1.ax1x.com/2022/05/16/Oh3AVU.png" style="width:100px; height:100px; margin:0 auto;" alt="微信公众号二维码">
                                                                        <br> 关注服务号，全栈导航
                                                                        <br>
                                                                        <p style="line-height: 16px;margin: 0;margin-top: 5px;">Copyrights © 2019-2025</p>
                                                                        <p style="line-height: 16px;margin: 0;">All rights reserved 鄂ICP备17016349号-3</p>
                                                                    </p>
                                                                </td>
                                                                <td style="width:3.2%;max-width:30px;"></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                            <td style="width:3%;max-width:30px;"></td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </span>
                    </div>
                </div>
            </div>
        </includetail>
    </div>`;
};

// 导出邮件模板函数
module.exports = emailTmp;
