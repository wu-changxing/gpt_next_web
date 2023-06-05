// app/api/common.ts
import { NextRequest } from "next/server"; // 导入 Next.js 的 NextRequest 对象，用于处理请求
export const OPENAI_URL = "api.openai.com"; // 定义 OPENAI_URL 常量，表示 OpenAI API 的 URL
const DEFAULT_PROTOCOL = "https"; // 定义 DEFAULT_PROTOCOL 常量，默认为 "https"
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL; // 从环境变量中获取 PROTOCOL，如果不存在则使用 DEFAULT_PROTOCOL
const BASE_URL = process.env.BASE_URL ?? OPENAI_URL; // 从环境变量中获取 BASE_URL，如果不存在则使用 OPENAI_URL

export async function requestOpenai(req: NextRequest) {
  const controller = new AbortController(); // 创建一个 AbortController 对象，用于在需要时中止请求
  const authValue = req.headers.get("Authorization") ?? ""; // 获取请求头中的 Authorization 字段，如果不存在则默认为空字符串
  const openaiPath = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/openai/",
    "",
  ); // 从请求的路径中提取出 OpenAI API 的路径

  let baseUrl = BASE_URL; // 设置 baseUrl 初始值为 BASE_URL

  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`; // 如果 baseUrl 不以 "http" 开头，则添加协议和 baseUrl 组成完整的 URL
  }

  console.log("[Proxy] ", openaiPath); // 打印 OpenAI API 的路径
  console.log("[Base Url]", baseUrl); // 打印请求的基础 URL

  if (process.env.OPENAI_ORG_ID) {
    console.log("[Org ID]", process.env.OPENAI_ORG_ID); // 如果存在 OPENAI_ORG_ID 环境变量，则打印其值
  }

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10 * 60 * 1000); // 设置超时时间为 10 分钟，并在超时时中止请求

  const fetchUrl = `${baseUrl}/${openaiPath}`; // 构建完整的请求 URL
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Authorization: authValue, // 设置请求头中的 Authorization 字段为 authValue
      ...(process.env.OPENAI_ORG_ID && {
        "OpenAI-Organization": process.env.OPENAI_ORG_ID,
      }), // 如果存在 OPENAI_ORG_ID 环境变量，则设置请求头中的 OpenAI-Organization 字段为其值
    },
    cache: "no-store",
    method: req.method, // 设置请求方法为 req.method
    body: req.body, // 设置请求体为 req.body
    signal: controller.signal, // 设置信号为 AbortController 的信号，用于中止请求
  };

  try {
    const res = await fetch(fetchUrl, fetchOptions); // 发起请求并等待响应

    if (res.status === 401) {
      // to prevent browser prompt for credentials
      res.headers.delete("www-authenticate"); // 如果响应状态为 401，删除响应头中的 "www-authenticate" 字段，以防止浏览器弹出凭据提示框
    }

    return res; // 返回响应对象
  } finally {
    clearTimeout(timeoutId); // 清除超时定时器
  }
}
