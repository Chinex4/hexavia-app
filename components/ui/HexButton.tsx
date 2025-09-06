import React from "react";
import { Pressable, Text } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function HexButton({ title, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`py-4 rounded-xl items-center justify-center 
        ${disabled ? "bg-gray-300" : "bg-primary"}
      `}
    >
      <Text className="text-white font-semibold text-base font-kumbhBold">{title}</Text>
    </Pressable>
  );
}
