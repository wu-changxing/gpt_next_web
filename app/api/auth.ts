// app/api/auth.ts
import { NextRequest } from "next/server"; // 导入 Next.js 的 NextRequest 对象，用于处理请求
import { getServerSideConfig } from "../config/server"; // 导入 getServerSideConfig 函数，用于获取服务器端配置信息
import md5 from "spark-md5"; // 导入 md5 函数，用于生成哈希值
import { ACCESS_CODE_PREFIX } from "../constant"; // 导入 ACCESS_CODE_PREFIX 常量，用于验证 Access Code 前缀
import { OPENAI_URL } from "./common"; // 导入 OPENAI_URL 常量
import { verifyDjangoToken } from "./tokenVerification"; // import verifyDjangoToken function

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
    accessCode: isOpenAiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length), // 如果不是以 sk 开头，则 accessCode 为空字符串；否则截取 ACCESS_CODE_PREFIX 之后的部分作为 accessCode
    apiKey: isOpenAiKey ? token : "", // 如果不是以 ACCESS_CODE_PREFIX 开头，则 apiKey 为整个 token；否则 apiKey 为空字符串
  };
}

export async function auth(req: NextRequest) {
  const authToken = req.headers.get("Authorization") ?? "";

  const { accessCode, apiKey: token } = parseApiKey(authToken);

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const serverConfig = getServerSideConfig();
  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  // User does not provide access code or token
  if (!accessCode && !token) {
    return {
      error: true,
      msg: "Access code and token both are required",
    };
  }

  // User provides token but not access code
  if (token && !accessCode) {
    return {
      error: true,
      msg: "Access code is required when token is provided",
    };
  }

  // User provides access code but not token
  if (accessCode && !token) {
    const isDjangoTokenValid = await verifyDjangoToken(accessCode);
    if (!isDjangoTokenValid) {
      return {
        error: true,
        msg: "Invalid access code pls check you have token in config or login again",
      };
    }
    const apiKey = serverConfig.apiKey;
    if (apiKey) {
      console.log("[Auth] use system api key provided by admin");
      req.headers.set("Authorization", `Bearer ${apiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
      return {
        error: true,
        msg: "Admin did not provide an api key",
      };
    }
  }

  // User provides both access code and token
  if (accessCode && token && token !== "") {
    console.log("[Auth] use user's token");
  }

  // // If the configuration requires an access code and the provided access code is not in the set of allowed codes
  // if (serverConfig.needCode && !serverConfig.codes.has(hashedCode)) {
  //     return {
  //         error: true,
  //         msg: !accessCode ? "empty access code" : "wrong access code",
  //     };
  // }
  //
  return {
    error: false,
  };
}
