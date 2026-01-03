import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import KeyboardAwareScrollView from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from "react-native-safe-area-context";

import Field from "@/components/admin/Field";
import HexButton from "@/components/ui/HexButton";

import { showError, showSuccess } from "@/components/ui/toast";
import { selectAdminUsers } from "@/redux/admin/admin.slice";
import { useAppSelector } from "@/store/hooks";

export default function EditClient() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const users = useAppSelector(selectAdminUsers);

  const existing = users.find((u: any) => u._id === id);

  const [fullname, setFullname] = useState(existing?.fullname ?? "");
  const [username, setUsername] = useState(existing?.username ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");

  useEffect(() => {
    if (existing) {
      setFullname(existing.fullname ?? "");
      setUsername(existing.username ?? "");
      setEmail(existing.email ?? "");
    }
  }, [existing]);

  const onSave = async () => {
    if (!fullname.trim()) return showError("Full name is required");
    if (!email.trim()) return showError("Email is required");
    // await dispatch(updateUser({ userId: id as string, fullname: fullname.trim(), username: username.trim() || undefined, email: email.trim() }))
    showSuccess("Saved (mock)");
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-2 flex-row items-center gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbh text-text">Edit User</Text>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={8}
      >
          <Field label="Full name">
            <TextInput
              placeholder="Enter full name"
              placeholderTextColor="#9CA3AF"
              value={fullname}
              onChangeText={setFullname}
              className="bg-gray-200 rounded-2xl px-4 py-4 font-kumbh text-text"
              autoCapitalize="words"
            />
          </Field>

          <Field label="Username">
            <TextInput
              placeholder="Enter username"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
              className="bg-gray-200 rounded-2xl px-4 py-4 font-kumbh text-text"
              autoCapitalize="none"
            />
          </Field>

          <Field label="Email">
            <TextInput
              placeholder="Enter email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              className="bg-gray-200 rounded-2xl px-4 py-4 font-kumbh text-text"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          <HexButton title="Save" onPress={onSave} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
