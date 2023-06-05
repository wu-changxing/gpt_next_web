// app/api/openai/[...path]/route.ts
import { prettyObject } from "@/app/utils/format"; // 导入名为 prettyObject 的函数，它位于 "@/app/utils/format" 模块中

import { NextRequest, NextResponse } from "next/server"; // 导入 Next.js 的 NextRequest 和 NextResponse 对象，用于处理请求和响应

import { auth } from "../../auth"; // 导入 auth 函数，位于相对路径 "../../auth" 中

import { requestOpenai } from "../../common"; // 导入 requestOpenai 函数，位于相对路径 "../../common" 中

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[OpenAI Route] params ", params); // 打印日志，输出 params 参数的值

  const authResult = await auth(req); // 调用 auth 函数，传入 req 对象进行身份验证
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    }); // 如果验证失败，则以 JSON 格式返回 authResult 对象，并设置响应状态为 401（未授权）
  }

  try {
    return await requestOpenai(req); // 调用 requestOpenai 函数，传入 req 对象，并等待其返回结果
  } catch (e) {
    console.error("[OpenAI] ", e); // 捕获异常，并打印错误日志
    return NextResponse.json(prettyObject(e)); // 以 JSON 格式返回错误对象 e 的详细信息
  }
}

export const GET = handle; // 导出 handle 函数作为 GET 常量，供路由使用
export const POST = handle; // 导出 handle 函数作为 POST 常量，供路由使用

export const runtime = "edge"; // 导出 runtime 常量，其值为字符串 "edge"
