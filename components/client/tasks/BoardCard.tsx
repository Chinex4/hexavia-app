import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";

type Props = {
  project: string;
  title: string;
  description?: string | null;
  statusLabel: string;
  assignees?: string[];

  /** Background color for the card (e.g., STATUS_BGS[status].bgColor) */
  cardBg?: string;

  /** Optional overrides for the status pill */
  pillBg?: string;
  pillText?: string;

  /** Optional press handler */
  onPress?: () => void;
};

function luminance(hex: string): number {
  const h = hex?.replace("#", "") || "";
  if (h.length !== 6) return 1; // treat invalid as light
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const toLin = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function isDark(hex?: string) {
  try {
    return luminance(hex || "") < 0.5;
  } catch {
    return false;
  }
}

export default function BoardCard({
  project,
  title,
  description,
  statusLabel,
  assignees,
  cardBg = "#7380BD",
  pillBg,
  pillText,
  onPress,
}: Props) {
  // Validate color; if invalid, make it obvious
  const validHex6 = /^#([A-Fa-f0-9]{6})$/;
  const resolvedBg = validHex6.test(cardBg) ? cardBg : "#FF00FF";

  const dark = useMemo(() => isDark(resolvedBg), [resolvedBg]);

  // Auto text colors for contrast
  const titleColor = dark ? "#FFFFFF" : "#111827";
  const subColor = dark ? "rgba(255,255,255,0.85)" : "#374151";
  const hairline = dark ? "rgba(255,255,255,0.35)" : "rgba(17,24,39,0.12)";

  // Auto pill colors (override-able)
  const autoPillBg = dark ? "rgba(255,255,255,0.18)" : "#E5E7EB";
  const autoPillText = dark ? "#FFFFFF" : "#111827";
  const chipBg = pillBg || autoPillBg;
  const chipText = pillText || autoPillText;

  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      className="mx-4 mt-4 rounded-3xl px-5 pt-5 pb-4"
      style={{ backgroundColor: resolvedBg }}
      {...(onPress ? { onPress } : {})}
    >
      <View className="flex-row items-center justify-between">
        <Text
          className="font-kumbhBold text-[18px]"
          style={{ color: titleColor }}
        >
          {project}
        </Text>
        <Text style={{ color: subColor }}>⋮</Text>
      </View>

      <View className="h-[1px] my-3" style={{ backgroundColor: hairline }} />

      <Text
        className="font-kumbhBold text-[22px]"
        style={{ color: titleColor }}
      >
        {title}
      </Text>

      {!!description && (
        <Text className="font-kumbh mt-1" style={{ color: subColor }}>
          {description}
        </Text>
      )}

      {!!assignees?.length && (
        <View className="mt-2 flex-row flex-wrap" style={{ gap: 6 }}>
          {assignees.map((assignee) => (
            <View
              key={assignee}
              className="px-2.5 py-1 rounded-full border"
              style={{
                borderColor: hairline,
                backgroundColor: dark ? "rgba(255,255,255,0.12)" : "#F3F4F6",
              }}
            >
              <Text className="font-kumbh text-[11px]" style={{ color: subColor }}>
                {assignee}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View
        className="mt-3 self-start px-3 py-1 rounded-full"
        style={{ backgroundColor: chipBg }}
      >
        <Text
          className="text-[12px] font-kumbhBold"
          style={{ color: chipText }}
        >
          {statusLabel}
        </Text>
      </View>
    </Container>
  );
}
