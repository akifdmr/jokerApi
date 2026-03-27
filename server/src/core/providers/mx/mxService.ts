import { mxRequest } from "./mxClient.js";

export async function mxCreateUser(input: { identifier: string; isTestUser?: boolean; metadata?: Record<string, string> }) {
  return mxRequest("POST", "/users", { user: input });
}

export async function mxCreateWidgetUrl(input: {
  userIdentifier: string;
  widgetUrl: {
    widget_type: "connect_widget";
    mode?: "verification" | "aggregation";
    ui_message_version?: number;
    is_mobile_webview?: boolean;
    current_member_guid?: string;
    current_member_id?: string;
  };
}) {
  const { userIdentifier, widgetUrl } = input;
  return mxRequest("POST", `/users/${encodeURIComponent(userIdentifier)}/widget_urls`, { widget_url: widgetUrl });
}

export async function mxListAccounts(userIdentifier: string) {
  return mxRequest("GET", `/users/${encodeURIComponent(userIdentifier)}/accounts`);
}

export async function mxListAccountNumbersByAccount(userIdentifier: string, accountId: string) {
  return mxRequest(
    "GET",
    `/users/${encodeURIComponent(userIdentifier)}/accounts/${encodeURIComponent(accountId)}/account_numbers`
  );
}

export async function mxListAccountNumbersByMember(userIdentifier: string, memberId: string) {
  return mxRequest(
    "GET",
    `/users/${encodeURIComponent(userIdentifier)}/members/${encodeURIComponent(memberId)}/account_numbers`
  );
}

