export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  nvidiaApiKey: process.env.NVIDIA_API_KEY ?? "",
  nvidiaApiUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
  nvidiaModel: "openai/gpt-oss-120b",
  // Use the smaller model only for latency-sensitive ordinary assistant streams.
  nvidiaFastModel: "openai/gpt-oss-20b",
  runwayApiSecret: process.env.RUNWAYML_API_SECRET ?? "",
};
