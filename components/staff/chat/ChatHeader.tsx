import React from "react";
import { View, Text, Image, Pressable, Platform } from "react-native";
import { ChevronLeft, File } from "lucide-react-native";
import { useRouter } from "expo-router";

type Props = {
  title: string;
  subtitle: string;
  avatar: string;
};

export default function ChatHeader({ title, subtitle, avatar }: Props) {
  const router = useRouter();
  return (
    <View style={{marginTop: Platform.select({android: 45, ios: 0})}} className="px-5 pt-2 pb-3 bg-white">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 mr-2 rounded-2xl items-center justify-center"
          >
            <ChevronLeft size={24} color="#111827" />
          </Pressable>
          <Image
            source={{ uri: avatar }}
            className="h-9 w-9 rounded-full mr-3"
          />
          <View>
            <Text className="font-kumbhBold text-[20px] text-gray-900">
              {title}
            </Text>
            <Text className="text-[12px] text-gray-500 font-kumbh">{subtitle}</Text>
          </View>
        </View>

        <View className="flex-row items-center space-x-3">
          <Pressable className="h-10 w-10 rounded-2xl bg-gray-100 items-center justify-center">
            <File size={20} color="#111827" />
          </Pressable>
          
        </View>
      </View>

      <View className="mt-3 h-[1px] bg-gray-200/70" />
    </View>
  );
}
