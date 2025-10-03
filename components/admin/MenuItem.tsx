import clsx from "clsx";
import { Pressable, Text, View } from "react-native";

export default function MenuItem({
  children,
  onPress,
  active,
}: {
  children: React.ReactNode;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx("px-4 py-3", active ? "bg-primary-50" : "bg-white")}
    >
      <Text
        className={clsx(
          "font-kumbh",
          active ? "text-primary-700" : "text-text"
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}