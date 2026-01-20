import React, { useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const botpressHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --ink: #0f172a;
        --muted: #64748b;
        --accent: #4c5fab;
        --bg: #f8fafc;
        --card: #ffffff;
        --ring: rgba(76, 95, 171, 0.18);
      }
      * { box-sizing: border-box; }
      html, body {
        height: 100%;
        margin: 0;
        background: var(--bg);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #root { min-height: 100%; display: flex; flex-direction: column; }
      header {
        padding: 22px 18px 14px;
        background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 60%);
        border-bottom: 1px solid #e2e8f0;
      }
      header h1 {
        margin: 0;
        font-size: 20px;
        color: var(--ink);
        letter-spacing: 0.2px;
      }
      header p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 13px;
      }
      .card {
        margin: 16px;
        padding: 16px;
        background: var(--card);
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        border: 1px solid #e2e8f0;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .orb {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: linear-gradient(135deg, #4c5fab 0%, #6e7fdc 100%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .status {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--ink);
        font-size: 14px;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--accent);
        box-shadow: 0 0 0 6px var(--ring);
        animation: pulse 1.8s infinite ease-in-out;
      }
      .tips {
        margin-top: 10px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.5;
      }
      .footer {
        margin: 0 16px 18px;
        padding: 12px 14px;
        background: #eef2ff;
        border-radius: 14px;
        color: #3730a3;
        font-size: 12px;
        line-height: 1.4;
        border: 1px solid #e0e7ff;
      }
      .pin {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
      }
      .fab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: var(--accent);
        color: #fff;
        font-size: 12px;
        line-height: 1;
      }
      @keyframes pulse {
        0% { transform: scale(0.9); opacity: 0.75; }
        50% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0.75; }
      }
    </style>
  </head>
  <body>
    <div id="root">
      <header>
        <h1>Welcome to Hexavia AI</h1>
        <p>Tap the small Hexavia icon at the bottom right to start a chat.</p>
      </header>
      <div class="card">
        <div class="row">
          <div>
            <div class="status">
              <span class="dot"></span>
              <span>Assistant ready in a moment</span>
            </div>
            <div class="tips">
              When the widget opens, ask about tasks, projects, or updates.
            </div>
          </div>
        </div>
      </div>
      <div class="footer">
        <span class="pin">Open chat <span class="fab">•</span></span>
        <span> from the bottom-right corner to begin.</span>
      </div>
    </div>
    <script src="https://cdn.botpress.cloud/webchat/v3.3/inject.js" defer></script>
    <script src="https://files.bpcontent.cloud/2025/10/27/11/20251027114219-1CQ5NIYZ.js" defer></script>
  </body>
</html>`;

type Props = {
  title?: string;
  baseUrl?: string;
};

const injectedOpenChat = `
  (function () {
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (window.botpressWebChat && window.botpressWebChat.sendEvent) {
        window.botpressWebChat.sendEvent({ type: "show" });
        clearInterval(timer);
      }
      if (tries > 60) clearInterval(timer);
    }, 200);
  })();
  true;
`;

export default function BotpressFab({
  title = "AI Assistant",
  baseUrl = "https://hexavia.cloud",
}: Props) {
  const [open, setOpen] = useState(false);
  const htmlSource = useMemo(() => ({ html: botpressHtml }), []);
  const insets = useSafeAreaInsets();

  return (
    <>
      <View className="absolute right-5 bottom-8">
        <Pressable
          onPress={() => setOpen(true)}
          className="h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "#4C5FAB" }}
          accessibilityRole="button"
          accessibilityLabel="Open AI assistant"
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setOpen(false)}
      >
        <View
          className="flex-1 bg-[#f8fafc]"
          style={{ paddingTop: Platform.OS === "ios" ? insets.top + 10 : 10 }}
        >
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <Text className="font-kumbh text-[18px] text-[#111827]">
              {title}
            </Text>
            <Pressable
              onPress={() => setOpen(false)}
              className="h-9 w-9 items-center justify-center rounded-full"
              accessibilityRole="button"
              accessibilityLabel="Close AI assistant"
            >
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>
          </View>
          <View className="flex-1">
            <WebView
              originWhitelist={["https://*", "http://*"]}
              source={{ ...htmlSource, baseUrl }}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              injectedJavaScript={injectedOpenChat}
              startInLoadingState
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
