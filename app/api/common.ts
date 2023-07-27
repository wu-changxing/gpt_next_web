// app/api/common.ts

import { NextRequest, NextResponse } from "next/server";

export const OPENAI_URL = "api.openai.com";
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL;
const BASE_URL = process.env.BASE_URL ?? OPENAI_URL;
const DISABLE_GPT4 = !!process.env.DISABLE_GPT4;

export async function requestOpenai(req: NextRequest) {
  // console.log(req.body)
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
  console.log(req.body);
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Authorization: authValue,
      ...(process.env.OPENAI_ORG_ID && {
        "OpenAI-Organization": process.env.OPENAI_ORG_ID,
      }), // 如果存在 OPENAI_ORG_ID 环境变量，则设置请求头中的 OpenAI-Organization 字段为其值
    },
    method: req.method,
    body: req.body,
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  // #1815 try to refuse gpt4 request
  if (DISABLE_GPT4 && req.body) {
    try {
      const clonedBody = await req.text();
      fetchOptions.body = clonedBody;

      const jsonBody = JSON.parse(clonedBody);

      if ((jsonBody?.model ?? "").includes("gpt-4")) {
        return NextResponse.json(
          {
            error: true,
            message: "you are not allowed to use gpt-4 model",
          },
          {
            status: 403,
          },
        );
      }
    } catch (e) {
      console.error("[OpenAI] gpt4 filter", e);
    }
  }

  try {
    const res = await fetch(fetchUrl, fetchOptions); // 发起请求并等待响应

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    // to disable nginx buffering
    newHeaders.set("X-Accel-Buffering", "no");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId); // 清除超时定时器
  }
}
