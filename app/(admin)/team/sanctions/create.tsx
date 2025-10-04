// app/(admin)/team/sanctions/create.tsx
import React, { useEffect, useMemo, useState } from "react";
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

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAdminUsers } from "@/redux/admin/admin.thunks";
import { selectAdminUsers } from "@/redux/admin/admin.slice";

import { createSanction } from "@/redux/sanctions/sanctions.thunks";
import { showError, showSuccess } from "@/components/ui/toast";

type StatusOpt = "Active" | "Resolved" | "Pending";

export default function CreateSanction() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // load staff to select recipient
  const allUsers = useAppSelector(selectAdminUsers);
  const staff = useMemo(
    () => allUsers.filter((u) => u.role === "staff"),
    [allUsers]
  );

  useEffect(() => {
    if (staff.length === 0) dispatch(fetchAdminUsers({ role: "staff" }));
  }, [dispatch, staff.length]);

  const [recipientId, setRecipientId] = useState<string>("");
  const [recipientLabel, setRecipientLabel] = useState<string>("Select staff");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<StatusOpt>("Active");
  const [show, setShow] = useState(false);

  const handleSave = async () => {
    if (!recipientId) return showError("Select a staff to sanction");
    if (!reason.trim()) return showError("Enter a reason");

    // map UI status to API type/isActive — using minimal mapping:
    // You can change this mapping when you finalize server semantics.
    const type = "query" as const; // or "warning" | "penalty" etc.
    const duration = 1; // placeholder (required by API type)

    const res = await dispatch(
      createSanction({
        userId: recipientId,
        reason: reason.trim(),
        type,
        duration,
      })
    );

    if ((res as any)?.meta?.requestStatus === "fulfilled") {
      showSuccess("Sanction created");
      router.back();
    }
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
            <View>
              <Dropdown
                value={recipientLabel}
                open={show}
                onToggle={() => setShow((s) => !s)}
              />
              {show && (
                <Menu>
                  {staff.map((u) => {
                    const label = u.fullname || u.username || u.email || u._id;
                    return (
                      <MenuItem
                        key={u._id}
                        active={u._id === recipientId}
                        onPress={() => {
                          setRecipientId(u._id);
                          setRecipientLabel(label);
                          setShow(false);
                        }}
                      >
                        {label}
                      </MenuItem>
                    );
                  })}
                </Menu>
              )}
            </View>
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

          {/* Optional UI-only status (not required by your API create) */}
          <Field label="Status (UI)">
            <View className="flex-row gap-2">
              {(["Active", "Resolved", "Pending"] as const).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setStatus(opt)}
                  className={`px-4 py-2 rounded-full border ${
                    status === opt
                      ? "bg-primary-500 border-primary-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-kumbhBold ${status === opt ? "text-white" : "text-text"}`}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
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
