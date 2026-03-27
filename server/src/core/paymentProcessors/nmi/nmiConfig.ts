export const nmiConfig = {
  mode: process.env.NMI_MODE ?? "mock", // mock | live
  securityKey: process.env.NMI_SECURITY_KEY ?? "",
  endpoint: process.env.NMI_ENDPOINT ?? "https://secure.nmi.com/api/transact.php",
  usBank: {
    merchantKey:
      process.env.US_BANK_MERCHANT_KEY ??
      "INTERNATIONAL LIAISON CORPORAT 1RD5OERYOAQJCSJI26WT6X0K8US4COM0LWNHW7WBJ1KJMJEK5LXUCXB9L5A13EZA",
    terminalId: process.env.US_BANK_TERMINAL_ID ?? "0002830008045766832250",
  },
  vakifbank: {
    merchantId: process.env.VAKIFBANK_MERCHANT_ID ?? "000000046247631",
    terminalId: process.env.VAKIFBANK_TERMINAL_ID ?? "V2737098",
  },
};

export function isNmiLiveMode() {
  return nmiConfig.mode.toLowerCase() === "live";
}
