import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  Text,
  View,
} from "react-native";
import type { ChannelLink } from "@/redux/channelLinks/channelLinks.types";
import { Edit3, X } from "lucide-react-native";

type Props = {
  links: ChannelLink[];
  isLoading?: boolean;
  onOpenLink: (link: ChannelLink) => void;
  onEditLink: (link: ChannelLink) => void;
  onDeleteLink: (link: ChannelLink) => void;
};

export default function LinkList({
  links,
  isLoading,
  onOpenLink,
  onEditLink,
  onDeleteLink,
}: Props) {
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator />
      </View>
    );
  }

  const renderItem: ListRenderItem<ChannelLink> = ({ item }) => {
    const title = item.title?.trim() || item.url;
    const hasDescription = Boolean(item.description?.trim());

    return (
      <View className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
        <Pressable onPress={() => onOpenLink(item)}>
          <Text className="font-kumbhBold text-base text-gray-900">{title}</Text>
          <Text
            numberOfLines={1}
            className="text-sm text-gray-500"
            ellipsizeMode="tail"
          >
            {item.url}
          </Text>
          {hasDescription ? (
            <Text className="text-xs text-gray-500 mt-2" numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </Pressable>
        <View className="flex-row justify-end gap-3 pt-3">
          <Pressable onPress={() => onEditLink(item)} className="rounded-full" >
            <Edit3 size={18} color="#4C5FAB" />
          </Pressable>
          <Pressable onPress={() => onDeleteLink(item)} className="rounded-full">
            <X size={18} color="#DC2626" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      style={{ flex: 1 }}
      data={links}
      keyExtractor={(link) => link._id}
      contentContainerStyle={{
        paddingBottom: 140,
        paddingHorizontal: 16,
        flexGrow: 1,
      }}
      renderItem={renderItem}
      ListEmptyComponent={() => (
        <View className="flex-1 items-center justify-center pt-10">
          <Text className="font-kumbh text-gray-500">No links yet.</Text>
          <Text className="text-xs text-gray-400 mt-1">
            Add a link to get started.
          </Text>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
