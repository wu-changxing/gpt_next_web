import { NextRequest } from "next/server";
export async function verifyDjangoToken(token: string) {
  const DJ_URL = process.env.DJ_URL ?? "http://aaron404.com";

  console.log("DJ_URL: ", DJ_URL, token);
  try {
    const res = await fetch(`${DJ_URL}/eac/api/token/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ token }),
    });

    console.log("response: ", res);
    console.log("body: ", JSON.stringify({ token }));

    if (res.ok) {
      const data = await res.json(); // Extract JSON from the response
      console.log("data: ", data);
      // Check if 'valid' is true in the response data
      return data.valid === true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    return false; // Return false in case of error
  }
}
