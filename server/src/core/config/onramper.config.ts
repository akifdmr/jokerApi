export const onramperConfig = {
  apiKey: process.env.ONRAMPER_API_KEY ?? "",
  environment: process.env.ONRAMPER_ENVIRONMENT ?? "test",
};

export function onramperStatus() {
  const hasKey = Boolean(onramperConfig.apiKey);
  return {
    hasKey,
    environment: onramperConfig.environment,
    keyPrefix: hasKey ? onramperConfig.apiKey.slice(0, 12) : "",
  };
}
