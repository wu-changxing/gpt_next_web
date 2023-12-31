"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ApiPath,
  DEFAULT_API_HOST,
  ServiceProvider,
  StoreKey,
  DEFAULT_MODELS, // assuming this is needed
} from "../constant";
import { getHeaders } from "../client/api";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import { ensure } from "../utils/clone";

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const DEFAULT_OPENAI_URL =
  getClientConfig()?.buildMode === "export" ? DEFAULT_API_HOST : ApiPath.OpenAI;

const DEFAULT_ACCESS_STATE = {
  accessCode: "",
  token: "",
  useCustomConfig: false,
  provider: ServiceProvider.OpenAI,
  openaiUrl: DEFAULT_OPENAI_URL,
  openaiApiKey: "",
  azureUrl: "",
  azureApiKey: "",
  azureApiVersion: "2023-08-01-preview",
  needCode: true,
  hideUserApiKey: false,
  hideBalanceQuery: false,
  disableGPT4: false,
  disableFastLink: false,
  customModels: "",
};

export const useAccessStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },
  (set, get) => ({
    enabledAccessControl() {
      this.fetch();
      return get().needCode;
    },

    updateCode(code: string) {
      console.log("Before update: ", get().accessCode);
      set(() => ({ accessCode: code?.trim() }));
      console.log("After update: ", get().accessCode);
    },

    updateToken(token: string) {
      set(() => ({ token: token?.trim() }));
    },

    updateOpenAiUrl(url: string) {
      set(() => ({ openaiUrl: url?.trim() }));
    },

    isValidOpenAI() {
      return ensure(get(), ["openaiApiKey"]);
    },

    isValidAzure() {
      return ensure(get(), ["azureUrl", "azureApiKey", "azureApiVersion"]);
    },

    isAuthorized() {
      this.fetch();

      // has token or has code or disabled access control
      return (
        this.isValidOpenAI() ||
        this.isValidAzure() ||
        !this.enabledAccessControl() ||
        (this.enabledAccessControl() && ensure(get(), ["accessCode"]))
      );
    },

    fetch() {
      if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
      fetchState = 1;
      fetch("/api/config", {
        method: "post",
        body: null,
        headers: {
          ...getHeaders(),
        },
      })
        .then((res) => res.json())
        .then((res: DangerConfig) => {
          console.log("[Config] got config from server", res);
          set(() => ({ ...res }));
        })
        .catch(() => {
          console.error("[Config] failed to fetch config");
        })
        .finally(() => {
          fetchState = 2;
        });
    },
  }),
  {
    name: StoreKey.Access,
    version: 2,
    migrate(persistedState, version) {
      if (version < 2) {
        const state = persistedState as {
          token: string;
          openaiApiKey: string;
          azureApiVersion: string;
        };
        state.openaiApiKey = state.token;
        state.azureApiVersion = "2023-08-01-preview";
      }

      return persistedState as any;
    },
  },
);
