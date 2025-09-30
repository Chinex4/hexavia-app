import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/store/hooks";
import { selectUser } from "@/redux/user/user.slice";
import { updateProfile } from "@/redux/user/user.thunks";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

export default function EditProfile() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const current = useSelector(selectUser);

  const [fullname, setFullname] = useState(current?.fullname || "");
  const [username, setUsername] = useState(current?.username || "");
  const [phone, setPhone] = useState(
    (current as any)?.phoneNumber || (current as any)?.phone || ""
  );
  const [photo, setPhoto] = useState<string | undefined>(
    current?.profilePicture || undefined
  );
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow photo library access to change your picture."
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      const dataUrl = a.base64
        ? `data:${a.mimeType || "image/jpeg"};base64,${a.base64}`
        : a.uri;
      setPhoto(dataUrl);
    }
  }

  const canSave = useMemo(() => {
    if (saving) return false;
    return fullname.trim().length >= 2 && username.trim().length >= 2;
  }, [fullname, username, saving]);

  async function onSave() {
    try {
      if (!canSave) return;
      setSaving(true);
      // Your API accepts: { username?, fullname?, profilePicture? }
      // If your backend also accepts phone, add it to thunk + payload.
      const payload: any = {
        fullname: fullname.trim(),
        username: username.trim().toLowerCase(),
      };
      if (photo !== undefined) payload.profilePicture = photo;
      // OPTIONAL: when backend supports phoneNumber
      // payload.phoneNumber = phone.trim();

      await dispatch(updateProfile(payload)).unwrap();
      router.back();
    } catch (e: any) {
      // toast already shown by thunk; keep UX quiet here
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* Header */}
        <View className="h-48 w-full bg-primary rounded-b-[28px] px-5 pt-10 flex-row items-center gap-2">
          <Pressable onPress={() => router.back()}>
            <ChevronLeft color={'white'} size={25}/>
          </Pressable>
          <View>
            <Text className="text-white font-kumbhBold text-2xl">
              Edit Profile
            </Text>
            <Text className="text-white/80 font-kumbh mt-1">
              Update your personal info
            </Text>
          </View>
        </View>

        {/* Card */}
        <View className="mx-4 -mt-8 rounded-3xl bg-white p-5 shadow-lg">
          {/* Avatar */}
          <View className="items-center">
            <View className="h-24 w-24 rounded-3xl bg-gray-100 overflow-hidden items-center justify-center">
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  className="h-24 w-24"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={36} color="#9CA3AF" />
              )}
            </View>
            <Pressable
              onPress={pickPhoto}
              className="mt-3 rounded-xl bg-primary px-3 py-2"
            >
              <Text className="text-white font-kumbhBold">Change photo</Text>
            </Pressable>
          </View>

          {/* Inputs */}
          <View className="mt-6">
            <Text className="mb-2 font-kumbh text-gray-600">Full name</Text>
            <TextInput
              value={fullname}
              onChangeText={setFullname}
              placeholder="Your full name"
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-kumbh text-gray-900"
              autoCapitalize="words"
            />

            <Text className="mt-4 mb-2 font-kumbh text-gray-600">Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-kumbh text-gray-900"
              autoCapitalize="none"
            />

            <Text className="mt-4 mb-2 font-kumbh text-gray-600">Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+234…"
              keyboardType="phone-pad"
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-kumbh text-gray-900"
            />
            {/* <Text className="mt-2 text-xs text-gray-400 font-kumbh">
              (If your API supports updating phone, include it in the thunk
              payload.)
            </Text> */}
          </View>

          <View className="mt-6 flex-row">
            <Pressable
              disabled={saving}
              onPress={() => router.back()}
              className="flex-1 mr-2 items-center justify-center rounded-2xl bg-gray-100 px-4 py-3"
            >
              <Text className="font-kumbhBold text-gray-700">Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!canSave}
              onPress={onSave}
              className={`flex-1 ml-2 items-center justify-center rounded-2xl px-4 py-3 ${canSave ? "bg-primary" : "bg-primary/50"}`}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-kumbhBold text-white">Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
