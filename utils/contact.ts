import { Linking, Platform } from "react-native";

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
  const targets =
    Platform.OS === "ios"
      ? [`telprompt:${sanitized}`, `tel:${sanitized}`]
      : [`tel:${sanitized}`];

  for (const target of targets) {
    try {
      const supported = await Linking.canOpenURL(target);
      if (supported) {
        await Linking.openURL(target);
        return;
      }
    } catch (error) {
      console.warn("Unable to launch phone dialer", error);
    }
  }
  console.warn("Unable to call phone number", phone);
}

export async function openWhatsApp(phone?: string, message?: string) {
  if (!phone) return;
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return;
  const text = message ? `&text=${encodeURIComponent(message)}` : "";
  const appUrl = `whatsapp://send?phone=+234${digitsOnly}${text}`;
  const webUrl = `https://wa.me/+234${digitsOnly}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  try {
    const supported = await Linking.canOpenURL(appUrl);
    if (supported) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch (error) {
    console.warn("Unable to open WhatsApp app", error);
  }
  try {
    const supportedWeb = await Linking.canOpenURL(webUrl);
    if (supportedWeb) {
      await Linking.openURL(webUrl);
      return;
    }
  } catch (error) {
    console.warn("Unable to open WhatsApp web", error);
  }
  console.warn("Unable to open WhatsApp for number", phone);
}
