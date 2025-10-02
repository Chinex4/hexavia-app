import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export default function SkeletonCard({ width }: { width: number }) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
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
        height: 180,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        opacity: pulse,
        padding: 14,
        marginBottom: 14,
        marginRight: 14,
      }}
    >
      <View
        style={{ height: 100, borderRadius: 16, backgroundColor: "#E5E7EB" }}
      />
      <View
        style={{
          height: 12,
          width: "70%",
          marginTop: 14,
          borderRadius: 8,
          backgroundColor: "#E5E7EB",
        }}
      />
    </Animated.View>
  );
}
