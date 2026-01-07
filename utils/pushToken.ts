import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export async function getExpoPushToken(): Promise<string | null> {
  // Expo push tokens can’t be generated on simulator
  if (!Device.isDevice) return null;

  const perms = await Notifications.getPermissionsAsync();
  let status = perms.status;

  // Ask only once (when never asked before)
  if (status === "undetermined") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  if (status !== "granted") return null;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  try {
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    return tokenRes?.data ?? null;
  } catch {
    return null;
  }
}

export async function registerPushToken(): Promise<string | null> {
  return await getExpoPushToken();
}
