import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { X } from "lucide-react-native";

import { showError } from "@/components/ui/toast";
import { updateChannel } from "@/redux/channels/channels.thunks";
import type { Channel } from "@/redux/channels/channels.types";
import { useAppDispatch } from "@/store/hooks";

type Props = {
  visible: boolean;
  channel?: Channel | null;
  onClose: () => void;
};

export default function EditChannelModal({ visible, channel, onClose }: Props) {
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(
    () => !!channel?._id && !!name.trim(),
    [channel?._id, name]
  );

  useEffect(() => {
    if (visible) {
      setName(channel?.name ?? "");
      setDesc(channel?.description ?? "");
      setCode(channel?.code ?? "");
      setIsActive(Boolean(channel?.isActive ?? true));
    }
  }, [visible, channel]);

  const handleSubmit = async () => {
    if (!channel?._id) return;
    if (!name.trim()) {
      showError("Project name is required");
      return;
    }

    try {
      setIsSaving(true);
      await dispatch(
        updateChannel({
          channelId: channel._id,
          name: name.trim(),
          description: desc.trim() ? desc.trim() : null,
          isActive,
        })
      ).unwrap();
      onClose();
    } catch (err) {
      // errors already toasted in thunk
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/40"
        style={{ justifyContent: "center", paddingHorizontal: 20 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="w-full"
        >
          <Pressable onPress={() => {}} className="">
            <View className="bg-white rounded-3xl p-5">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[18px] font-kumbhBold text-gray-900">
                  Edit Project
                </Text>
                <Pressable
                  onPress={onClose}
                  className="h-9 w-9 rounded-xl bg-gray-100 items-center justify-center"
                  accessibilityLabel="Close modal"
                >
                  <X size={18} color="#111827" />
                </Pressable>
              </View>

              <View className="mb-3">
                <Text className="text-[12px] text-gray-500 mb-1">
                  Name of Project
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter Name of Project"
                  className="h-12 px-4 rounded-2xl bg-gray-100 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>

              <View className="mb-3">
                <Text className="text-[12px] text-gray-500 mb-1">
                  Descriptions
                </Text>
                <TextInput
                  value={desc}
                  onChangeText={setDesc}
                  placeholder="Add a short description"
                  className="px-4 pt-3 pb-3 rounded-2xl bg-gray-100 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View className="mb-5">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[12px] text-gray-500 mb-1">
                      Active project
                    </Text>
                    <Text className="text-[10px] text-gray-400">
                      Toggle off to deactivate this project.
                    </Text>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: "#d1d5db", true: "#4C5FAB" }}
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              <View className="mb-5">
                <Text className="text-[12px] text-gray-500 mb-1">Code</Text>
                <TextInput
                  value={code}
                  editable={false}
                  placeholder="#0101"
                  className="h-12 px-4 rounded-2xl bg-gray-100 text-gray-400"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={isSaving || !canSave}
                className={`h-12 rounded-2xl items-center justify-center ${
                  isSaving || !canSave ? "bg-[#4C5FAB]/50" : "bg-[#4C5FAB]"
                }`}
              >
                <Text className="text-white font-kumbhBold">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
