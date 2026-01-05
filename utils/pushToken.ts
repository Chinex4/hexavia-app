import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export type PushTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: "not_device" | "denied" | "unknown" };

export async function registerPushToken(): Promise<string | null> {
  const res = await getExpoPushToken();
  return res.ok ? res.token : null;
}

export async function getExpoPushToken(): Promise<PushTokenResult> {
  if (!Device.isDevice) return { ok: false, reason: "not_device" };

  const perms = await Notifications.getPermissionsAsync();
  let status = perms.status;

  // Only request if it's never been asked before
  if (status === "undetermined") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  if (status !== "granted") return { ok: false, reason: "denied" };

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const data = token?.data ?? null;
    if (!data) return { ok: false, reason: "unknown" };

    return { ok: true, token: data };
  } catch {
    return { ok: false, reason: "unknown" };
  }
}
