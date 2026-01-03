import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X, RefreshCcw } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  generateChannelCode,
  createChannel,
} from "@/redux/channels/channels.thunks";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CreateChannelModal({ visible, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [code, setCode] = useState("#0101");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const doGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const newCode = await dispatch(generateChannelCode()).unwrap();
      setCode(newCode);
    } catch (err) {
      console.log("Generate code failed: ", err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setName("");
      setDesc("");
      setCode("#0101");
      doGenerateCode();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }
    try {
      setIsCreating(true);
      await dispatch(
        createChannel({
          name: name.trim(),
          description: desc.trim() ? desc.trim() : null,
          code: code.trim(),
        })
      ).unwrap();

      setName("");
      setDesc("");
      setCode("#0101");
      onClose();
    } catch (err) {
      console.log("Create channel failed: ", err);
    } finally {
      setIsCreating(false);
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
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[18px] font-kumbhBold text-gray-900">
                  Create Project
                </Text>
                <Pressable
                  onPress={onClose}
                  className="h-9 w-9 rounded-xl bg-gray-100 items-center justify-center"
                  accessibilityLabel="Close modal"
                >
                  <X size={18} color="#111827" />
                </Pressable>
              </View>

              {/* Fields */}
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
                  <Text className="text-[12px] text-gray-500 mb-1">Code</Text>
                  <Pressable
                    onPress={doGenerateCode}
                    disabled={isGenerating}
                    className="flex-row items-center gap-1"
                    accessibilityLabel="Regenerate code"
                  >
                    <RefreshCcw size={16} color="#4C5FAB" />
                    <Text className="text-[#4C5FAB] text-[12px]">
                      {isGenerating ? "Generating…" : "Generate"}
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="#0101"
                  className="h-12 px-4 rounded-2xl bg-gray-100 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                disabled={
                  isCreating || isGenerating || !name.trim() || !code.trim()
                }
                className={`h-12 rounded-2xl items-center justify-center ${
                  isCreating || isGenerating || !name.trim() || !code.trim()
                    ? "bg-[#4C5FAB]/50"
                    : "bg-[#4C5FAB]"
                }`}
              >
                <Text className="text-white font-kumbhBold">
                  {isCreating ? "Creating…" : "Create Channel"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
