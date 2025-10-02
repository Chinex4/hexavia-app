import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldSetBadge: true,
    shouldPlaySound: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice)
    return { token: null, error: "Must use physical device" };

  const settings = await Notifications.getPermissionsAsync();
  let final = settings;

  if (settings.status !== "granted") {
    final = await Notifications.requestPermissionsAsync();
  }
  if (final.status !== "granted")
    return { token: null, error: "Permission not granted" };

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return { token: token.data, error: null };
}
