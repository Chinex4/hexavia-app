import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import type { ChannelNote } from "@/redux/channelNotes/channelNotes.types";
import { Edit3, X } from "lucide-react-native";

type Props = {
  notes: ChannelNote[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEditNote: (note: ChannelNote) => void;
  onDeleteNote: (note: ChannelNote) => void;
  onPreviewNote: (note: ChannelNote) => void;
};

export default function NoteList({
  notes,
  isLoading,
  isRefreshing,
  onRefresh,
  onEditNote,
  onDeleteNote,
  onPreviewNote,
}: Props) {
  if (isLoading && notes.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator />
      </View>
    );
  }

  const renderItem: ListRenderItem<ChannelNote> = ({ item }) => (
    <Pressable
      onPress={() => onPreviewNote(item)}
      className="my-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
    >
      <View className="flex-row items-start">
        <Text
          className="font-kumbhBold text-base text-gray-900 flex-1 pr-3"
          numberOfLines={2}
        >
          {item.title || "Untitled"}
        </Text>
        <View className="flex-row gap-2 shrink-0">
          <Pressable onPress={() => onEditNote(item)} className="rounded-full">
            <Edit3 size={18} color="#4C5FAB" />
          </Pressable>
          <Pressable onPress={() => onDeleteNote(item)} className="rounded-full">
            <X size={18} color="#DC2626" />
          </Pressable>
        </View>
      </View>
      <Text className="text-sm text-gray-600 mt-2" numberOfLines={4}>
        {item.description || "No description added."}
      </Text>
    </Pressable>
  );

  return (
    <FlatList
      style={{ flex: 1 }}
      data={notes}
      keyExtractor={(note, index) =>
        String(note._id || note.createdAt || note.title || index)
      }
      contentContainerStyle={{
        paddingBottom: 140,
        paddingHorizontal: 16,
        flexGrow: 1,
      }}
      renderItem={renderItem}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(isRefreshing)} onRefresh={onRefresh} />
        ) : undefined
      }
      ListEmptyComponent={() => (
        <View className="flex-1 items-center justify-center pt-10">
          <Text className="font-kumbh text-gray-500">No notes yet.</Text>
          <Text className="text-xs text-gray-400 mt-1">
            Capture the important details in a note.
          </Text>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
