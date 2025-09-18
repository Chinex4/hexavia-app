import React from "react";
import { View, Image } from "react-native";

export default function MemberStack({ avatars }: { avatars: string[] }) {
  return (
    <View className="flex-row">
      {avatars.slice(0, 5).map((uri, idx) => (
        <View
          key={uri}
          style={{
            marginLeft: idx === 0 ? 0 : -10,
            borderWidth: 2,
            borderColor: "white",
            borderRadius: 999,
          }}
        >
          <Image
            source={{ uri }}
            style={{ width: 28, height: 28, borderRadius: 999 }}
          />
        </View>
      ))}
    </View>
  );
}
