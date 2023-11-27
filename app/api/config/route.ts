// app/api/config/route.ts
import { NextResponse } from "next/server"; // 导入 Next.js 的 NextResponse 对象，用于处理服务器端响应

import { getServerSideConfig } from "../../config/server"; // 导入 getServerSideConfig 函数，用于获取服务器端配置信息

const serverConfig = getServerSideConfig(); // 调用 getServerSideConfig 函数，将返回的服务器配置信息存储在 serverConfig 变量中

// Danger! Do not hard code any secret value here!
// 警告！不要在这里写入任何敏感信息！
const DANGER_CONFIG = {
  needCode: serverConfig.needCode,
  hideUserApiKey: serverConfig.hideUserApiKey,
  disableGPT4: serverConfig.disableGPT4,
  hideBalanceQuery: serverConfig.hideBalanceQuery,
  disableFastLink: serverConfig.disableFastLink,
  customModels: serverConfig.customModels,
};

declare global {
  type DangerConfig = typeof DANGER_CONFIG; // 声明全局类型 DangerConfig，其类型与 DANGER_CONFIG 相同
}

async function handle() {
  // 定义异步函数 handle，用于处理请求并返回响应
  NextResponse.json(DANGER_CONFIG); // 将 DANGER_CONFIG 以 JSON 格式作为响应返回
}

export const GET = handle; // 导出 handle 函数作为 GET 常量，供路由使用
export const POST = handle; // 导出 handle 函数作为 POST 常量，供路由使用

export const runtime = "edge"; // 导出 runtime 常量，其值为字符串 "edge"
