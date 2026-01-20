import { showError, showSuccess } from "@/components/ui/toast";
import { toApiStatus } from "@/features/client/statusMap";
import { StatusKey, TAB_ORDER } from "@/features/staff/types";
import { api } from "@/api/axios";
import {
  normalizeCode,
  selectAllChannels,
  selectCodeIndex,
  selectMyChannelsByUserId,
} from "@/redux/channels/channels.selectors";
import {
  createChannelTask,
  fetchChannelById,
  fetchChannels,
} from "@/redux/channels/channels.thunks";
import {
  assignPersonalTask,
  createPersonalTask,
  fetchPersonalTasks,
} from "@/redux/personalTasks/personalTasks.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import OptionSheet from "@/components/common/OptionSheet";
import React, { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type Mode = "channel" | "personal";
type ChannelMember = {
  id: string;
  name?: string | null;
  email?: string | null;
  type?: string | null;
};

export default function CreateTaskModal({
  visible,
  onClose,
  forcePersonalForUserId,
  hideModeToggle = false,
}: {
  visible: boolean;
  onClose: () => void;
  forcePersonalForUserId?: string | null;
  hideModeToggle?: boolean;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loggedInUserId = user?._id ?? null;

  const role = (user?.role || "").toLowerCase();
  const allowPersonalByRole = [
    "staff",
    "admin",
    "super-admin",
    "client",
  ].includes(role);

  const allowPersonal = forcePersonalForUserId ? true : allowPersonalByRole;

  const channels = useAppSelector((s) =>
    selectMyChannelsByUserId(s, loggedInUserId),
  );
  const codeIndex = useAppSelector(selectCodeIndex);
  const allChannels = useAppSelector(selectAllChannels);

  const [mode, setMode] = useState<Mode>("channel");
  const isAdminish = ["admin", "super-admin"].includes(
    (user?.role || "").toLowerCase(),
  );

  useEffect(() => {
    if (visible) {
      dispatch(fetchChannels());
      setShowChannelPicker(false);
      setSelectedChannelId(null);

      // Lock to personal if forced
      if (forcePersonalForUserId) {
        setMode("personal");
      } else {
        setMode("channel");
      }
    }
  }, [visible, dispatch, forcePersonalForUserId]);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [status, setStatus] = useState<StatusKey>("in-progress");
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [assignToMember, setAssignToMember] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  // if user isn't allowed personal, force channel mode on open/role change
  useEffect(() => {
    if (!allowPersonal && mode === "personal") {
      setMode("channel");
    }
  }, [allowPersonal, mode, visible]);

  const reset = () => {
    setTitle("");
    setDesc("");
    setChannelCode("");
    setStatus("in-progress");
    setShowChannelPicker(false);
    setSelectedChannelId(null);
    setAssignToMember(false);
    setShowMemberPicker(false);
    setSelectedMemberId(null);
    setChannelMembers([]);
    setMode("channel");
  };

  const resolveChannelId = React.useCallback(
    (codeRaw: string): string | null => {
      const norm = normalizeCode(codeRaw);
      if (!norm) return null;
      const viaMap = codeIndex.get(norm);
      if (viaMap) return viaMap;
      const found = (channels as any[]).find(
        (c) => normalizeCode(c?.code) === norm,
      );
      return found?._id ?? found?.id ?? null;
    },
    [channels, codeIndex],
  );

  const channelOptions = useMemo(
    () =>
      allChannels
        .filter((c) => (c as any)?.code)
        .map((c) => ({
          label: `${c.name ?? "Untitled"} · ${c.code ?? "#—"}`,
          value: c.code ?? "",
        })),
    [allChannels],
  );

  const selectedChannel = useMemo(
    () => allChannels.find((c) => c._id === selectedChannelId),
    [allChannels, selectedChannelId],
  );

  const handleChannelSelect = (value: string | number) => {
    const codeValue = String(value);
    const found = allChannels.find(
      (c) => normalizeCode(c?.code) === normalizeCode(codeValue),
    );
    setChannelCode(found?.code ?? codeValue);
    setSelectedChannelId(found?._id ?? null);
    setSelectedMemberId(null);
    setChannelMembers([]);
    setShowChannelPicker(false);
  };

  const memberOptions = useMemo(
    () =>
      channelMembers.map((m) => {
        const labelBase = m.name || m.email || "Member";
        const suffix = m.type ? ` · ${m.type}` : "";
        return { label: `${labelBase}${suffix}`, value: m.id };
      }),
    [channelMembers],
  );

  const selectedMember = useMemo(
    () => channelMembers.find((m) => m.id === selectedMemberId),
    [channelMembers, selectedMemberId],
  );

  const fetchChannelMembers = React.useCallback(async (channelId: string) => {
    setIsMembersLoading(true);
    try {
      console.log("[members] fetching for:", channelId);

      const res = await api.get(`/channel/${channelId}/members`);

      console.log("[members] raw response:", res.data);

      const members = Array.isArray(res.data?.members) ? res.data.members : [];

      const mapped = members.map((m: any) => ({
        id: String(
          m?.id ?? m?._id ?? m?.userId ?? m?.user?._id ?? m?.user?.id ?? "",
        ),
        name: m?.name ?? m?.fullname ?? m?.username ?? m?.user?.name ?? null,
        email: m?.email ?? m?.user?.email ?? null,
        type: m?.type ?? m?.role ?? null,
      }));

      console.log("[members] mapped:", mapped);

      const filtered = mapped.filter((m: any) => m.id && m.id !== ""); // keep only valid ids
      console.log("[members] filtered count:", filtered.length);

      setChannelMembers(filtered);
    } catch (err: any) {
      console.log(
        "[members] error:",
        err?.response?.status,
        err?.response?.data ?? err?.message,
      );
      showError("Failed to load channel members.");
    } finally {
      setIsMembersLoading(false);
    }
  }, []);

  const handleToggleAssignToMember = async (nextValue: boolean) => {
    console.log("[assign toggle]", {
      nextValue,
      selectedChannelId,
      channelCode,
    });

    if (!nextValue) {
      setAssignToMember(false);
      setSelectedMemberId(null);
      return;
    }

    const channelId = selectedChannelId ?? resolveChannelId(channelCode.trim());
    console.log("[assign toggle] resolved channelId:", channelId);

    if (!channelId) {
      showError("Select a project first.");
      return;
    }

    setAssignToMember(true);
  };

  const create = async () => {
    const name = title.trim();
    const description = desc.trim() || null;
    if (!name) return;

    try {
      if (forcePersonalForUserId || mode === "personal") {
        // Personal task flow
        if (isAdminish && forcePersonalForUserId) {
          // Admin/Super-admin assigning to a staff
          await dispatch(
            assignPersonalTask({
              assignedTo: forcePersonalForUserId, // ← staff user id
              name,
              description,
              status: toApiStatus(status) as any,
            }),
          ).unwrap();

          await dispatch(fetchPersonalTasks());
          showSuccess("Personal task assigned to staff.");
        } else {
          // Normal personal task for self
          const targetUserId = loggedInUserId;
          if (!targetUserId) {
            showError("User not loaded yet.");
            return;
          }

          await dispatch(
            createPersonalTask({
              name,
              description,
              status: toApiStatus(status) as any,
            }),
          ).unwrap();

          await dispatch(fetchPersonalTasks());
          showSuccess("Personal task created.");
        }
      } else {
        // Channel task flow
        const code = channelCode.trim();
        const channelId = selectedChannelId ?? resolveChannelId(code);
        if (!channelId) {
          showError("Project Code not found.");
          return;
        }
        if (assignToMember && !selectedMemberId) {
          showError("Select a channel member to assign.");
          return;
        }

        await dispatch(
          createChannelTask({
            channelId,
            name,
            description,
            status: toApiStatus(status),
          }),
        ).unwrap();

        if (assignToMember && selectedMemberId) {
          await dispatch(
            assignPersonalTask({
              assignedTo: selectedMemberId,
              name,
              description,
              status: toApiStatus(status) as any,
            }),
          ).unwrap();
          await dispatch(fetchPersonalTasks());
          showSuccess("Personal task assigned to member.");
        }

        await dispatch(fetchChannelById(channelId));
        showSuccess("Channel task created.");
      }

      reset();
      onClose();
    } catch {
      // errors are already surfaced by thunks/toasts in your app
    }
  };

  useEffect(() => {
    if (!visible) {
      setShowChannelPicker(false);
      setShowMemberPicker(false);
    }
  }, [visible]);

  useEffect(() => {
    if (mode !== "channel") {
      setAssignToMember(false);
      setSelectedMemberId(null);
      setChannelMembers([]);
    }
  }, [mode]);

  useEffect(() => {
    console.log("[members effect]", {
      assignToMember,
      selectedChannelId,
      channelCode,
    });

    if (!assignToMember) return;

    const channelId = selectedChannelId ?? resolveChannelId(channelCode.trim());
    console.log("[members effect] resolved channelId:", channelId);

    if (!channelId) return;

    fetchChannelMembers(channelId);
  }, [
    assignToMember,
    channelCode,
    selectedChannelId,
    fetchChannelMembers,
    resolveChannelId,
  ]);

  const modes: Mode[] = forcePersonalForUserId
    ? ["personal"]
    : allowPersonal
      ? ["channel", "personal"]
      : ["channel"];

  if (isAdminish && mode === "personal" && !forcePersonalForUserId) {
    showError("Pick a staff member to assign this personal task to.");
    return;
  }

  const closeAll = () => {
    setShowChannelPicker(false);
    setShowMemberPicker(false);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={closeAll}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/40 justify-end">
              <View className="bg-white rounded-t-3xl py-8 px-5 max-h-[85%]">
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 12 }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text className="font-kumbhBold text-[20px] text-[#111827]">
                    Create Task
                  </Text>

                  {!hideModeToggle && (
                    <View className="mt-4 flex-row" style={{ gap: 8 }}>
                      {modes.map((m) => {
                        const selected = m === mode;
                        return (
                          <Pressable
                            key={m}
                            onPress={() => setMode(m)}
                            className="rounded-full px-4 py-2"
                            style={{
                              backgroundColor: selected ? "#111827" : "#E5E7EB",
                            }}
                          >
                            <Text
                              className="font-kumbh text-[12px]"
                              style={{ color: selected ? "#FFFFFF" : "#111827" }}
                            >
                              {m === "channel"
                                ? "Assign to Channel"
                                : "My Personal Task"}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {!allowPersonal && (
                    <Text className="font-kumbh text-[12px] text-[#9CA3AF] mt-2">
                      Personal tasks are reserved for staff and client roles.
                    </Text>
                  )}

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

                  {mode === "channel" && !forcePersonalForUserId && (
                    <View className="mt-3">
                      <Text className="font-kumbh text-[#6B7280] mb-1">
                        Project Code
                      </Text>
                      <Pressable
                        onPress={() => setShowChannelPicker(true)}
                        className="rounded-xl border border-gray-200 bg-[#F3F4F6] px-4 py-3"
                      >
                        <Text
                          className="font-kumbh text-[#111827]"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {selectedChannel?.name ?? "Select project"}
                        </Text>
                        <Text className="font-kumbh text-[12px] text-[#6B7280]">
                          {selectedChannel?.code ?? channelCode ?? "#—"}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Status */}
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

                  {mode === "channel" && !forcePersonalForUserId && (
                    <View className="mt-4">
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="font-kumbh text-[#6B7280] mb-1">
                            Assign to channel member
                          </Text>
                          <Text className="font-kumbh text-[11px] text-[#9CA3AF]">
                            Create a personal task for a member.
                          </Text>
                        </View>
                        <Switch
                          value={assignToMember}
                          onValueChange={handleToggleAssignToMember}
                          trackColor={{ false: "#d1d5db", true: "#4C5FAB" }}
                          ios_backgroundColor="#d1d5db"
                        />
                      </View>

                      {assignToMember && (
                        <View className="mt-3">
                          <Text className="font-kumbh text-[#6B7280] mb-1">
                            Channel member
                          </Text>
                          <Pressable
                            onPress={() => {
                              if (isMembersLoading) return;
                              if (!memberOptions.length) {
                                showError("No members found for this channel.");
                                return;
                              }
                              setShowMemberPicker(true);
                            }}
                            className="rounded-xl border border-gray-200 bg-[#F3F4F6] px-4 py-3"
                          >
                            <Text
                              className="font-kumbh text-[#111827]"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {selectedMember?.name ||
                                selectedMember?.email ||
                                (isMembersLoading
                                  ? "Loading members..."
                                  : "Select member")}
                            </Text>
                            {!!selectedMember?.email && (
                              <Text className="font-kumbh text-[12px] text-[#6B7280]">
                                {selectedMember.email}
                              </Text>
                            )}
                          </Pressable>
                        </View>
                      )}
                    </View>
                  )}

                  <View
                    className="flex-row justify-end items-center mt-6"
                    style={{ gap: 12 }}
                  >
                    <Pressable onPress={closeAll}>
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
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
        <OptionSheet
          visible={showChannelPicker}
          onClose={() => setShowChannelPicker(false)}
          onSelect={handleChannelSelect}
          title="Select project"
          options={channelOptions}
          selectedValue={channelCode || undefined}
        />
        <OptionSheet
          visible={showMemberPicker}
          onClose={() => setShowMemberPicker(false)}
          onSelect={(value) => {
            setSelectedMemberId(String(value));
            setShowMemberPicker(false);
          }}
          title="Select channel member"
          options={memberOptions}
          selectedValue={selectedMemberId || undefined}
        />
      </Modal>
    </>
  );
}
