import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Dropdown from "@/components/admin/Dropdown";
import Field from "@/components/admin/Field";
import Menu from "@/components/admin/Menu";
import MenuItem from "@/components/admin/MenuItem";

import { showError, showSuccess } from "@/components/ui/toast";
import { selectSanctionById } from "@/redux/sanctions/sanctions.slice";
import { fetchSanctions, updateSanction } from "@/redux/sanctions/sanctions.thunks";
import { getToken } from "@/storage/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type ApiType = "warning" ;

export default function EditSanction() {
  const router = useRouter();
  const { sanctionId } = useLocalSearchParams<{ sanctionId: string }>();
  const dispatch = useAppDispatch();

  const sanction = useAppSelector(useMemo(() => selectSanctionById(sanctionId), [sanctionId]));
  const loadingBootstrap = !sanction;

  const [reason, setReason] = useState(sanction?.reason ?? "");
  const [type, setType] = useState<ApiType>((sanction?.type as ApiType) ?? "warning");
  const [duration, setDuration] = useState(
    typeof sanction?.duration === "number" ? String(sanction.duration) : ""
  );
  const [isActive, setIsActive] = useState(Boolean(sanction?.isActive ?? true));
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sanctionId) return;
    if (!sanction) {
      dispatch(fetchSanctions()); // fetch all; or make a single-by-id endpoint if you have one
    }
  }, [dispatch, sanctionId, sanction]);

  useEffect(() => {
    // sync store → form if fetch completed after mount
    if (sanction) {
      setReason(sanction.reason ?? "");
      setType((sanction.type as ApiType) ?? "warning");
      setIsActive(Boolean(sanction.isActive ?? true));
    }
  }, [sanction?._id]); 

//   console.log(sanction.isActive)

  const handleSave = async () => {
    if (!sanctionId) return;
    if (!reason.trim()) return showError("Enter a reason");

    // construct minimal payload (only send fields that changed)
    const body: any = { sanctionId };
    if (reason.trim() !== (sanction?.reason ?? "")) body.reason = reason.trim();
    if (type !== (sanction?.type as ApiType)) body.type = type;
    const durNum = Number.parseInt(duration, 10);
    if (isActive !== Boolean(sanction?.isActive ?? true)) body.isActive = isActive;

    if (Object.keys(body).length === 1) {
      showError("No changes to save");
      return;
    }

    try {
      setSaving(true);
      await dispatch(updateSanction(body)).unwrap();
      showSuccess("Sanction updated");
      router.back();
    } catch (e: any) {
      showError(String(e ?? "Failed to update"));
    } finally {
      setSaving(false);
    }
  };

  console.log(getToken())

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-6 pb-2 flex-row items-center gap-4">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbh text-text">Edit Sanction</Text>
      </View>

      {loadingBootstrap ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-gray-500 font-kumbh">Loading sanction…</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.select({ ios: "padding", android: "height" })}
        >
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pb-10"
            keyboardShouldPersistTaps="handled"
          >
            {/* Read-only recipient */}
            <Field label="Recipient">
              <Text className="text-base text-text font-kumbh rounded-2xl px-4 py-4 bg-gray-100">
                {sanction?.user?.username ||
                  sanction?.user?.fullname ||
                  sanction?.user?.email ||
                  "—"}
              </Text>
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

            <Field label="Type">
              <View>
                <Dropdown value={type} open={showTypeMenu} onToggle={() => setShowTypeMenu((s) => !s)} />
                {showTypeMenu && (
                  <Menu>
                    {(["warning"] as const).map((opt) => (
                      <MenuItem
                        key={opt}
                        active={opt === type}
                        onPress={() => {
                          setType(opt);
                          setShowTypeMenu(false);
                        }}
                      >
                        {opt}
                      </MenuItem>
                    ))}
                  </Menu>
                )}
              </View>
            </Field>

            <Field label="Active">
              <View className="flex-row items-center justify-between bg-gray-200 rounded-2xl px-4 py-4">
                <Text className="font-kumbh">Is Active</Text>
                <Switch value={isActive} onValueChange={setIsActive} />
              </View>
            </Field>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="mt-6 rounded-2xl bg-primary-500 py-4 items-center active:opacity-90"
            >
              <Text className="text-white font-kumbhBold">
                {saving ? "Saving…" : "Save Changes"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
