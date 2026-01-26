import Constants from "expo-constants";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

type UpdateInfo = {
  latestVersion: string;
  storeUrl: string;
};

const getCurrentVersion = () =>
  Constants?.expoConfig?.version ??
  (Constants as any)?.manifest?.version ??
  "0.0.0";

const compareVersions = (a: string, b: string) => {
  const toParts = (v: string) =>
    v
      .split(".")
      .map((part) => Number(part.replace(/[^0-9]/g, "")) || 0);

  const aParts = toParts(a);
  const bParts = toParts(b);
  const max = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < max; i += 1) {
    const aVal = aParts[i] ?? 0;
    const bVal = bParts[i] ?? 0;
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  return 0;
};

const extractAndroidVersion = (html: string) => {
  const matches = [
    html.match(/itemprop="softwareVersion">([^<]+)</i),
    html.match(/"softwareVersion"\s*:\s*"([^"]+)"/i),
    html.match(
      /Current Version[^>]*?<\/div>\s*<span[^>]*><div[^>]*><span[^>]*>([^<]+)</i
    ),
  ];

  for (const match of matches) {
    if (match?.[1]) return match[1].trim();
  }
  return null;
};

const fetchLatestVersion = async (): Promise<UpdateInfo | null> => {
  const currentVersion = getCurrentVersion();

  if (Platform.OS === "ios") {
    const bundleId = Constants?.expoConfig?.ios?.bundleIdentifier;
    if (!bundleId) return null;

    const res = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${bundleId}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json?.results?.[0];
    const latestVersion = entry?.version as string | undefined;
    const storeUrl = entry?.trackViewUrl as string | undefined;

    if (!latestVersion || !storeUrl) return null;
    if (compareVersions(currentVersion, latestVersion) >= 0) return null;

    return { latestVersion, storeUrl };
  }

  if (Platform.OS === "android") {
    const packageName = Constants?.expoConfig?.android?.package;
    if (!packageName) return null;

    const storeUrl = `https://play.google.com/store/apps/details?id=${packageName}&hl=en&gl=US`;
    const res = await fetch(storeUrl);
    if (!res.ok) return null;
    const html = await res.text();
    const latestVersion = extractAndroidVersion(html);
    if (!latestVersion) return null;
    if (compareVersions(currentVersion, latestVersion) >= 0) return null;

    return { latestVersion, storeUrl };
  }

  return null;
};

export default function AppUpdatePrompt() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [visible, setVisible] = useState(false);

  const currentVersion = useMemo(() => getCurrentVersion(), []);

  useEffect(() => {
    let active = true;

    fetchLatestVersion()
      .then((info) => {
        if (!active || !info) return;
        setUpdateInfo(info);
        setVisible(true);
      })
      .catch(() => {
        // Optional: ignore network errors silently
      });

    return () => {
      active = false;
    };
  }, []);

  const handleUpdate = useCallback(async () => {
    const url = updateInfo?.storeUrl;
    if (!url) return;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return;
    await Linking.openURL(url);
  }, [updateInfo]);

  if (!updateInfo || Platform.OS === "web") return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-3xl bg-white p-6">
          <Text className="text-lg font-kumbhBold text-gray-900">
            Update Available
          </Text>
          <Text className="mt-2 text-sm text-gray-600">
            A newer version ({updateInfo.latestVersion}) is available on the{" "}
            {Platform.OS === "ios" ? "App Store" : "Play Store"}. You are on{" "}
            {currentVersion}.
          </Text>
          <View className="mt-5 flex-row justify-end gap-3">
            <Pressable
              onPress={() => setVisible(false)}
              className="rounded-xl border border-gray-200 px-4 py-2"
            >
              <Text className="font-kumbh text-sm text-gray-600">Later</Text>
            </Pressable>
            <Pressable
              onPress={handleUpdate}
              className="rounded-xl bg-primary-500 px-4 py-2"
            >
              <Text className="font-kumbhBold text-sm text-white">
                Update now
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
