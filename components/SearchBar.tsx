import React from "react";
import { View, TextInput, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const INACTIVE = "#9CA3AF";

export default function SearchBar({
  value,
  onChange,
  onOpenFilter,
}: {
  value: string;
  onChange: (t: string) => void;
  onOpenFilter: () => void;
}) {
  return (
    <View className="flex-row items-center px-4 pt-3 pb-4">
      <View className="flex-1 flex-row items-center bg-gray-100 rounded-2xl h-12 px-3">
        <Ionicons name="search" size={18} color={INACTIVE} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Search by name or enter channel code"
          placeholderTextColor="#9CA3AF"
          className="flex-1 ml-2 text-gray-800 font-kumbh"
          returnKeyType="search"
        />
      </View>
      {/* <Pressable
        onPress={onOpenFilter}
        className="ml-3 h-12 w-12 rounded-2xl bg-gray-100 items-center justify-center"
        android_ripple={{ color: "#e5e7eb", radius: 24 }}
      >
        <Ionicons name="filter" size={20} color="#111827" />
      </Pressable> */}
    </View>
  );
}
