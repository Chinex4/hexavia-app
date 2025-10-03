import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import Field from "@/components/admin/Field";
import Dropdown from "@/components/admin/Dropdown";
import Menu from "@/components/admin/Menu";
import MenuItem from "@/components/admin/MenuItem";

export default function CreateSanction() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("2025-11-12"); // dummy string
  const [status, setStatus] = useState<"Active" | "Resolved" | "Pending">(
    "Active"
  );
  const [show, setShow] = useState(false);

  const handleSave = () => {
    // TODO: dispatch(createSanction(...))
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-6 pb-2 flex-row items-center gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbhBold text-text">Add Sanction</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.select({ ios: "padding", android: "height" })}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Recipient">
            <TextInput
              placeholder="Enter staff name"
              placeholderTextColor="#9CA3AF"
              value={recipient}
              onChangeText={setRecipient}
              className="bg-gray-200 rounded-2xl px-4 py-4 font-kumbh text-text"
            />
          </Field>

          <Field label="Reason">
            <TextInput
              placeholder="Enter reason"
              placeholderTextColor="#9CA3AF"
              value={reason}
              onChangeText={setReason}
              multiline
              className="bg-gray-200 rounded-2xl px-4 py-4 min-h-[88px] font-kumbh text-text"
            />
          </Field>

          <Field label="Date">
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={date}
              onChangeText={setDate}
              className="bg-gray-200 rounded-2xl px-4 py-4 font-kumbh text-text"
            />
          </Field>

          <Field label="Status">
            <View>
              <Dropdown
                value={status}
                open={show}
                onToggle={() => setShow((s) => !s)}
              />
              {show && (
                <Menu>
                  {(["Active", "Resolved", "Pending"] as const).map((opt) => (
                    <MenuItem
                      key={opt}
                      active={opt === status}
                      onPress={() => {
                        setStatus(opt);
                        setShow(false);
                      }}
                    >
                      {opt}
                    </MenuItem>
                  ))}
                </Menu>
              )}
            </View>
          </Field>

          <Pressable
            onPress={handleSave}
            className="mt-6 rounded-2xl bg-primary-500 py-4 items-center active:opacity-90"
          >
            <Text className="text-white font-kumbhBold">Save Sanction</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
