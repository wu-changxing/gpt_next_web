// app/api/openai/[...path]/route.ts
import { prettyObject } from "@/app/utils/format"; // 导入名为 prettyObject 的函数，它位于 "@/app/utils/format" 模块中

import { NextRequest, NextResponse } from "next/server"; // 导入 Next.js 的 NextRequest 和 NextResponse 对象，用于处理请求和响应

import { auth } from "../../auth"; // 导入 auth 函数，位于相对路径 "../../auth" 中
import { requestOpenai } from "../../common"; // 导入 requestOpenai 函数，位于相对路径 "../../common" 中
import { type OpenAIListModelResponse } from "@/app/client/platforms/openai";
import { getServerSideConfig } from "@/app/config/server";
import { OpenaiPath } from "@/app/constant";

const ALLOWD_PATH = new Set(Object.values(OpenaiPath));

function getModels(remoteModelRes: OpenAIListModelResponse) {
  const config = getServerSideConfig();

  if (config.disableGPT4) {
    remoteModelRes.data = remoteModelRes.data.filter(
      (m) => !m.id.startsWith("gpt-4"),
    );
  }

  return remoteModelRes;
}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[OpenAI Route] params ", params); // 打印日志，输出 params 参数的值

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  const subpath = params.path.join("/");

  if (!ALLOWD_PATH.has(subpath)) {
    console.log("[OpenAI Route] forbidden path ", subpath);
    return NextResponse.json(
      {
        error: true,
        msg: "you are not allowed to request " + subpath,
      },
      {
        status: 403,
      },
    );
  }

  const authResult = await auth(req);

  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    }); // 如果验证失败，则以 JSON 格式返回 authResult 对象，并设置响应状态为 401（未授权）
  }

  try {
    const response = await requestOpenai(req);

    // list models
    if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
      const resJson = (await response.json()) as OpenAIListModelResponse;
      const availableModels = getModels(resJson);
      return NextResponse.json(availableModels, {
        status: response.status,
      });
    }

    return response;
  } catch (e) {
    console.error("[OpenAI] ", e); // 捕获异常，并打印错误日志
    return NextResponse.json(prettyObject(e)); // 以 JSON 格式返回错误对象 e 的详细信息
  }
}

export const GET = handle; // 导出 handle 函数作为 GET 常量，供路由使用
export const POST = handle; // 导出 handle 函数作为 POST 常量，供路由使用

export const runtime = "edge"; // 导出 runtime 常量，其值为字符串 "edge"
