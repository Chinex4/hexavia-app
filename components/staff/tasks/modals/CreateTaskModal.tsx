// components/staff/tasks/modals/CreateTaskModal.tsx
import { showError } from "@/components/ui/toast";
import { toApiStatus } from "@/features/client/statusMap";
import { StatusKey, TAB_ORDER } from "@/features/staff/types";
import {
  normalizeCode,
  selectCodeIndex,
  selectMyChannelsByUserId,
} from "@/redux/channels/channels.selectors";
import {
  createChannelTask,
  fetchChannelById,
  fetchChannels,
} from "@/redux/channels/channels.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CreateTaskModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userId = user?._id ?? null;

  const channels = useAppSelector((s) => selectMyChannelsByUserId(s, userId));
  const codeIndex = useAppSelector(selectCodeIndex);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [status, setStatus] = useState<StatusKey>("in-progress");
  const [picking, setPicking] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (visible) {
      dispatch(fetchChannels());
      setPicking(false);
      setSelectedChannelId(null);
    }
  }, [visible, dispatch]);

  const normInput = normalizeCode(channelCode);
  const suggestions = useMemo(() => {
    if (!normInput) return [];
    return channels
      .filter((c: any) => normalizeCode(c?.code).startsWith(normInput))
      .slice(0, 6);
  }, [channels, normInput]);

  const reset = () => {
    setTitle("");
    setDesc("");
    setChannelCode("");
    setStatus("in-progress");
    setPicking(false);
    setSelectedChannelId(null);
  };

  const resolveChannelId = (codeRaw: string): string | null => {
    const norm = normalizeCode(codeRaw);
    if (!norm) return null;
    const viaMap = codeIndex.get(norm);
    if (viaMap) return viaMap;
    const found = (channels as any[]).find(
      (c) => normalizeCode(c?.code) === norm
    );
    return found?._id ?? found?.id ?? null;
  };

  const create = async () => {
    const name = title.trim();
    const code = channelCode.trim();
    if (!name || !code) return;

    const channelId = selectedChannelId ?? resolveChannelId(code);
    if (!channelId) {
      showError("Channel code not found.");
      return;
    }

    try {
      await dispatch(
        createChannelTask({
          channelId,
          name,
          description: desc.trim() || null,
          status: toApiStatus(status),
        })
      ).unwrap();

      // refresh that channel to pull latest tasks
      await dispatch(fetchChannelById(channelId));

      reset();
      onClose();
    } catch {
      /* toast handled in thunk */
    }
  };

  const chooseSuggestion = (c: any) => {
    setChannelCode(c.code ?? "");
    setSelectedChannelId(c._id ?? c.id ?? null);
    setPicking(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl py-8 px-5">
          <Text className="font-kumbhBold text-[20px] text-[#111827]">
            Create Task
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor="#9CA3AF"
            className="font-kumbh mt-4 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
          />

          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Task Description"
            placeholderTextColor="#9CA3AF"
            className="font-kumbh mt-3 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
            multiline
          />

          <View className="mt-3">
            <TextInput
              value={channelCode}
              onChangeText={(t) => {
                setChannelCode(t);
                setSelectedChannelId(null);
                setPicking(true);
              }}
              placeholder="Channel code (e.g. #7190)"
              placeholderTextColor="#9CA3AF"
              className="font-kumbh rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {picking && suggestions.length > 0 && (
              <View className="mt-2 rounded-xl border border-gray-200 bg-white max-h-44 overflow-hidden">
                <ScrollView keyboardShouldPersistTaps="handled">
                  {suggestions.map((c: any) => (
                    <Pressable
                      key={`${c._id ?? c.id}:${(c.code ?? "").toLowerCase()}`}
                      onPress={() => chooseSuggestion(c)}
                      className="px-4 py-3 border-b border-gray-100"
                    >
                      <Text className="font-kumbh text-[#111827]">
                        {c.code ?? "#—"}
                      </Text>
                      <Text className="font-kumbh text-[12px] text-[#6B7280]">
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View className="mt-4">
            <Text className="font-kumbh text-[#6B7280] mb-2">Status</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {TAB_ORDER.map((s) => {
                const selected = s === status;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    className="rounded-full px-4 py-2"
                    style={{
                      backgroundColor: selected ? "#111827" : "#E5E7EB",
                    }}
                  >
                    <Text
                      className="font-kumbh text-[12px]"
                      style={{ color: selected ? "#FFFFFF" : "#111827" }}
                    >
                      {s.replace("-", " ")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            className="flex-row justify-end items-center mt-6"
            style={{ gap: 12 }}
          >
            <Pressable onPress={onClose}>
              <Text className="font-kumbh text-[#6B7280]">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={create}
              className="rounded-xl px-5 py-3"
              style={{ backgroundColor: "#4C5FAB" }}
            >
              <Text className="font-kumbh text-white">Create</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
