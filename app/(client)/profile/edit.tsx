// app/(staff)/profile/edit.tsx
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
import { uploadSingle } from "@/redux/upload/upload.thunks";
import { selectUpload } from "@/redux/upload/upload.slice";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

export default function EditProfile() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const current = useSelector(selectUser);
  const upload = useSelector(selectUpload);

  const [fullname, setFullname] = useState(current?.fullname || "");
  const [username, setUsername] = useState(current?.username || "");
  // const [phone, setPhone] = useState((current as any)?.phoneNumber || (current as any)?.phone || "");
  const [photo, setPhoto] = useState<string | undefined>(
    current?.profilePicture || undefined
  );
  const [photoFile, setPhotoFile] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
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
      base64: false,
    });

    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setPhoto(a.uri);
      setPhotoFile({
        uri: a.uri,
        name: a.fileName || `avatar_${Date.now()}.jpg`,
        type: a.mimeType || "image/jpeg",
      });
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
      let profilePictureUrl: string | undefined;
      if (photoFile?.uri) {
        const up = await dispatch(
          uploadSingle({
            uri: photoFile.uri,
            name: photoFile.name,
            type: photoFile.type,
          })
        ).unwrap();
        profilePictureUrl = up.url;
      }
      const payload: any = {
        fullname: fullname.trim(),
        username: username.trim().toLowerCase(),
      };
      if (profilePictureUrl) payload.profilePicture = profilePictureUrl;
      await dispatch(updateProfile(payload)).unwrap();
    } catch (e) {
      // toasts already shown in thunks
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
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ChevronLeft color={"white"} size={25} />
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
                <Image
                  source={{
                    uri: "https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png",
                  }}
                  className="h-24 w-24"
                  resizeMode="cover"
                />
              )}
            </View>
            <Pressable
              onPress={pickPhoto}
              className="mt-3 rounded-xl bg-primary px-3 py-2"
            >
              <Text className="text-white font-kumbhBold">Change photo</Text>
            </Pressable>

            {/* Optional tiny progress label under avatar while uploading */}
            {saving && upload?.phase === "uploading" && (
              <Text className="mt-2 text-xs font-kumbh text-gray-500">
                Uploading… {upload.progress}%
              </Text>
            )}
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

            {/* If/when phone is supported */}
            {/* 
            <Text className="mt-4 mb-2 font-kumbh text-gray-600">Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+234…"
              keyboardType="phone-pad"
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-kumbh text-gray-900"
            />
            */}
          </View>

          <View className="mt-6 flex-row">
            <Pressable
              disabled={saving}
              onPress={() => router.push('/(client)/(tabs)/profile')}
              className="flex-1 mr-2 items-center justify-center rounded-2xl bg-gray-100 px-4 py-3"
            >
              <Text className="font-kumbhBold text-gray-700">Cancel</Text>
            </Pressable>

            <Pressable
              disabled={!canSave || saving}
              onPress={onSave}
              className={`flex-1 ml-2 items-center justify-center rounded-2xl px-4 py-3 ${
                canSave ? "bg-primary" : "bg-primary/50"
              }`}
            >
              {saving ? (
                upload?.phase === "uploading" ? (
                  <Text className="font-kumbhBold text-white">
                    Uploading {upload.progress}%
                  </Text>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#fff" />
                    <Text className="font-kumbhBold text-white">Saving…</Text>
                  </View>
                )
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
