import { Linking } from "react-native";

export async function openEmail(email?: string) {
  if (!email) return;
  const target = `mailto:${email}`;
  try {
    const supported = await Linking.canOpenURL(target);
    if (supported) {
      await Linking.openURL(target);
      return;
    }
  } catch (error) {
    console.warn("Unable to open mail client", error);
  }
  console.warn("Unable to open mail client for", email);
}

export async function dialPhone(phone?: string) {
  if (!phone) return;
  const sanitized = phone.replace(/[^\d+]/g, "");
  if (!sanitized) return;
  const target = `tel:${sanitized}`;
  try {
    const supported = await Linking.canOpenURL(target);
    if (supported) {
      await Linking.openURL(target);
      return;
    }
  } catch (error) {
    console.warn("Unable to launch phone dialer", error);
  }
  console.warn("Unable to call phone number", phone);
}
