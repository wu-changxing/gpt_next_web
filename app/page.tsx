"use client";
import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";

import { getServerSideConfig } from "./config/server";
import { useRouter } from "next/navigation";

const serverConfig = getServerSideConfig();

export default async function App() {
  return (
    <>
      <Home />
      {serverConfig?.isVercel && <Analytics />}
    </>
  );
}
