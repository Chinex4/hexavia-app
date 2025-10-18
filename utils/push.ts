import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "@/api/axios";

export async function registerPushToken() {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const { data } = await Notifications.getExpoPushTokenAsync();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  return data;
}

export async function sendPushTokenToBackend(userId: string | number | undefined, token: string) {
  // adjust to your API
  await api.post("/push/register", { userId, expoPushToken: token });
}
