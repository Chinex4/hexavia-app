import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export default function SkeletonChannelCard({
  width,
  gap,
}: {
  width: number;
  gap: number;
}) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        width,
        marginRight: gap,
        borderRadius: 24,
        padding: 16,
        backgroundColor: "#F3F4F6",
        opacity: pulse,
        height: 200,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: "#E5E7EB",
          marginBottom: 12,
        }}
      />
      <View
        style={{
          height: 18,
          borderRadius: 8,
          backgroundColor: "#E5E7EB",
          width: "70%",
        }}
      />
      <View
        style={{
          height: 12,
          borderRadius: 8,
          backgroundColor: "#E5E7EB",
          width: "90%",
          marginTop: 10,
        }}
      />
      <View
        style={{
          height: 12,
          borderRadius: 8,
          backgroundColor: "#E5E7EB",
          width: "55%",
          marginTop: 8,
        }}
      />
    </Animated.View>
  );
}
