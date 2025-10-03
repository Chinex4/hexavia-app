import React from "react";
import { Pressable, Text, View, ViewProps } from "react-native";
import clsx from "clsx";

export default function SectionCard({
  title,
  children,
  onPress,
  noTitle = false,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  noTitle?: boolean;
  className?: ViewProps["className"];
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      className={clsx("rounded-3xl bg-white p-4", className)}
      onPress={onPress as any}
    >
      {!noTitle && title ? (
        <Text className="text-lg font-kumbhBold text-text mb-3">{title}</Text>
      ) : null}
      {children}
    </Wrapper>
  );
}
