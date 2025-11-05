import { truncateWords } from "@/utils/truncate";
import { Pressable, Text, View } from "react-native";

export default function ChannelCard({
  title,
  code,
  description,
  tint,
  onPress,
}: {
  title: string;
  code: string;
  description?: string;
  tint?: string;
  onPress?: () => void;
}) {
  const short = description
    ? `${description.slice(0, 14)}${description.length > 14 ? "…" : ""}`
    : "";

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 h-40 rounded-xl"
      style={{
        backgroundColor: tint ?? "#60A5FA", // blue-400 default
        overflow: "hidden",
      }}
    >
      <View className="flex-1 p-4 justify-between">
        <Text className="text-white text-xl font-kumbhBold">
          {truncateWords(title, 10, "...")}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-white/90 font-kumbh text-xs">{short}</Text>
          <Text className="text-white/90 font-kumbh">{code}</Text>
        </View>
      </View>
    </Pressable>
  );
}
