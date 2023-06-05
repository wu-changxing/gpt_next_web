// app/api/auth.ts
import { NextRequest } from "next/server"; // 导入 Next.js 的 NextRequest 对象，用于处理请求
import { getServerSideConfig } from "../config/server"; // 导入 getServerSideConfig 函数，用于获取服务器端配置信息
import md5 from "spark-md5"; // 导入 md5 函数，用于生成哈希值
import { ACCESS_CODE_PREFIX } from "../constant"; // 导入 ACCESS_CODE_PREFIX 常量，用于验证 Access Code 前缀
import { OPENAI_URL } from "./common"; // 导入 OPENAI_URL 常量

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip"); // 获取请求的 IP 地址，优先从 req.ip 获取，否则从请求头中的 x-real-ip 获取
  const forwardedFor = req.headers.get("x-forwarded-for"); // 获取请求头中的 x-forwarded-for 字段

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? ""; // 如果 IP 为空且 x-forwarded-for 存在，则使用逗号分隔的第一个 IP 地址
  }

  return ip; // 返回 IP 地址
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim(); // 去除空格并去除开头的 "Bearer " 字符串
  const isOpenAiKey = !token.startsWith(ACCESS_CODE_PREFIX); // 检查 token 是否以 ACCESS_CODE_PREFIX 开头

  return {
    accessCode: isOpenAiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length), // 如果不是以 ACCESS_CODE_PREFIX 开头，则 accessCode 为空字符串；否则截取 ACCESS_CODE_PREFIX 之后的部分作为 accessCode
    apiKey: isOpenAiKey ? token : "", // 如果不是以 ACCESS_CODE_PREFIX 开头，则 apiKey 为整个 token；否则 apiKey 为空字符串
  };
}

export function auth(req: NextRequest) {
  const authToken = req.headers.get("Authorization") ?? ""; // 获取请求头中的 Authorization 字段，如果不存在则默认为空字符串

  // 检查是否是 OpenAI API 密钥还是用户令牌
  const { accessCode, apiKey: token } = parseApiKey(authToken);

  const hashedCode = md5.hash(accessCode ?? "").trim(); // 对 accessCode 进行哈希处理

  const serverConfig = getServerSideConfig(); // 获取服务器端配置信息
  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]); // 打印允许的哈希码集合
  console.log("[Auth] got access code:", accessCode); // 打印获取到的 accessCode
  console.log("[Auth] hashed access code:", hashedCode); // 打印哈希后的 accessCode
  console.log("[User IP] ", getIP(req)); // 打印用户的 IP 地址
  console.log("[Time] ", new Date().toLocaleString()); // 打印当前时间

  if (serverConfig.needCode && !serverConfig.codes.has(hashedCode) && !token) {
    return {
      error: true,
      msg: !accessCode ? "empty access code" : "wrong access code",
    }; // 如果配置要求 accessCode，并且传入的 hashedCode 不在允许的哈希码集合中，且没有提供 apiKey，则返回错误对象
  }

  // 如果用户未提供 apiKey，则注入系统的 apiKey
  if (!token) {
    const apiKey = serverConfig.apiKey;
    if (apiKey) {
      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${apiKey}`); // 在请求头中设置 Authorization 字段为系统 apiKey
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  }; // 返回验证结果对象，表示验证通过
}
