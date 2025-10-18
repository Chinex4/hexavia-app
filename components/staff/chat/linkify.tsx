import React from "react";
import { Text, Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";

const URL_RX = /((?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/[\w\-./?%&=+#]*)?)/i;
const MENTION_RX = /@\w+/;

export function renderWithMentionsAndLinks(text: string) {
  const parts = text.split(/(\@\w+|(?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/[\w\-./?%&=+#]*)?)/gi);

  return (
    <Text className="text-[15px] font-kumbh text-gray-800" style={{ flexShrink: 1, flexWrap: "wrap" }}>
      {parts.map((p, i) => {
        if (!p) return null;

        if (URL_RX.test(p)) {
          const href = /^https?:\/\//i.test(p) ? p : `https://${p}`;
          return (
            <Pressable key={i} onPress={() => WebBrowser.openBrowserAsync(href)}>
              <Text className="text-blue-600 underline">{p}</Text>
            </Pressable>
          );
        }

        if (MENTION_RX.test(p)) {
          return (
            <Text key={i} className="text-primary font-kumbhBold">
              {p}
            </Text>
          );
        }

        return <Text key={i} className="font-kumbh">{p}</Text>;
      })}
    </Text>
  );
}
