import { Pressable, Text, View } from "react-native";
import { truncateWords } from "@/utils/truncate";

type Props = {
  title: string;
  code: string;
  description?: string;
  tint?: string;
  onPress?: () => void;
  onDelete?: () => void;
  onLongPress?: () => void;
};

export default function ChannelCard({
  title,
  code,
  description,
  tint,
  onPress,
  onDelete,
  onLongPress,
}: Props) {
  const short =
    description && description.length
      ? `${description.slice(0, 14)}${description.length > 14 ? "..." : ""}`
      : "";

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-1 h-40 rounded-xl"
      style={{
        backgroundColor: tint ?? "#60A5FA", // blue-400 default
        overflow: "hidden",
      }}
    >
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
          hitSlop={8}
        >
          <Text className="text-white font-kumbh text-xs">Delete</Text>
        </Pressable>
      ) : null}

      <View className="flex-1 p-4 justify-between">
        <Text className="text-white text-lg font-kumbhBold">
          {truncateWords(title, 5, "...")}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-white/90 font-kumbh text-xs">{short}</Text>
          <Text className="text-white/90 font-kumbh">{code}</Text>
        </View>
      </View>
    </Pressable>
  );
}
