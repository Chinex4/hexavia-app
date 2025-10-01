import { useTasks } from "@/features/staff/tasksStore";
import { StatusKey, TAB_ORDER } from "@/features/staff/types";
import React, { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

export default function CreateTaskModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [status, setStatus] = useState<StatusKey>("in_progress");

  const reset = () => {
    setTitle(""); setDesc(""); setChannelCode(""); setStatus("in_progress");
  };

  const create = () => {
    if (!title.trim() || !channelCode.trim()) return;
    addTask({ title: title.trim(), description: desc.trim(), channelCode: channelCode.trim(), status });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl py-8 px-5">
          <Text className="font-kumbhBold text-[20px] text-[#111827]">Create Task</Text>

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
            placeholder="Description (optional)"
            placeholderTextColor="#9CA3AF"
            className="font-kumbh mt-3 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
            multiline
          />

          <TextInput
            value={channelCode}
            onChangeText={setChannelCode}
            placeholder="Channel code (e.g. HEX-PRJ-001)"
            placeholderTextColor="#9CA3AF"
            className="font-kumbh mt-3 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
          />

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
                      {s.replace("_", " ")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="flex-row justify-end items-center mt-6" style={{ gap: 12 }}>
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

// import React, { useEffect, useMemo, useState } from "react";
// import { Modal, Pressable, Text, TextInput, View, ScrollView } from "react-native";
// import { StatusKey, TAB_ORDER } from "@/features/staff/types";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import { createChannelTask, fetchChannels } from "@/redux/channels/channels.thunks";
// import {
//   selectAllChannels,
//   selectCodeIndex,
//   normalizeCode,
// } from "@/redux/channels/channels.selectors";
// import { showError } from "@/components/ui/toast";

// export default function CreateTaskModal({
//   visible,
//   onClose,
// }: {
//   visible: boolean;
//   onClose: () => void;
// }) {
//   const dispatch = useAppDispatch();

//   // Channels + fast code->id index from Redux
//   const channels = useAppSelector(selectAllChannels);
//   const codeIndex = useAppSelector(selectCodeIndex);

//   // Local state
//   const [title, setTitle] = useState("");
//   const [desc, setDesc] = useState("");
//   const [channelCode, setChannelCode] = useState("");
//   const [status, setStatus] = useState<StatusKey>("in_progress");
//   const [picking, setPicking] = useState(false);

//   // Cache the resolved id when user chooses from suggestions
//   const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

//   useEffect(() => {
//     if (visible) {
//       dispatch(fetchChannels());
//       setPicking(false);
//       setSelectedChannelId(null);
//     }
//   }, [visible, dispatch]);

//   // Normalize what the user typed
//   const normInput = normalizeCode(channelCode);

//   // Suggestions (prefix match on normalized code)
//   const suggestions = useMemo(() => {
//     if (!normInput) return [];
//     return channels
//       .filter((c: any) => normalizeCode(c?.code).startsWith(normInput))
//       .slice(0, 6);
//   }, [channels, normInput]);

//   const reset = () => {
//     setTitle("");
//     setDesc("");
//     setChannelCode("");
//     setStatus("in_progress");
//     setPicking(false);
//     setSelectedChannelId(null);
//   };

//   // Fallback resolver if user typed manually (not picked from suggestions)
//   const resolveChannelId = (codeRaw: string): string | null => {
//     const norm = normalizeCode(codeRaw);
//     if (!norm) return null;

//     // 1) Try memoized Map
//     const viaMap = codeIndex.get(norm);
//     if (viaMap) return viaMap;

//     // 2) Fallback linear search (robust to stale map)
//     const found = (channels as any[]).find((c) => normalizeCode(c?.code) === norm);
//     return found?.id ?? null;
//   };

//   const create = async () => {
//     const name = title.trim();
//     const code = channelCode.trim();
//     if (!name || !code) return;

//     // Prefer the id captured from suggestion; else resolve from code
//     const channelId = selectedChannelId ?? resolveChannelId(code);
//     if (!channelId) {
//       showError("Channel code not found.");
//       return;
//     }

//     try {
//       await dispatch(
//         createChannelTask({
//           channelId,
//           name,
//           description: desc.trim() || null,
//           // if your API later supports status, add it to the body and types
//         })
//       ).unwrap();

//       reset();
//       onClose();
//     } catch {
//       // toast already shown in thunk
//     }
//   };

//   const chooseSuggestion = (c: any) => {
//     setChannelCode(c.code ?? "");
//     setSelectedChannelId(c.id ?? null);
//     setPicking(false);
//   };

//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//       <View className="flex-1 bg-black/40 justify-end">
//         <View className="bg-white rounded-t-3xl py-8 px-5">
//           <Text className="font-kumbhBold text-[20px] text-[#111827]">Create Task</Text>

//           <TextInput
//             value={title}
//             onChangeText={setTitle}
//             placeholder="Task title"
//             placeholderTextColor="#9CA3AF"
//             className="font-kumbh mt-4 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
//           />

//           <TextInput
//             value={desc}
//             onChangeText={setDesc}
//             placeholder="Description (optional)"
//             placeholderTextColor="#9CA3AF"
//             className="font-kumbh mt-3 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
//             multiline
//           />

//           {/* Channel code input + suggestions */}
//           <View className="mt-3">
//             <TextInput
//               value={channelCode}
//               onChangeText={(t) => {
//                 setChannelCode(t);
//                 setSelectedChannelId(null); // typing invalidates previous selection
//                 setPicking(true);           // open suggestions while typing
//               }}
//               placeholder="Channel code (e.g. #7190)"
//               placeholderTextColor="#9CA3AF"
//               className="font-kumbh rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
//               autoCapitalize="none"
//               autoCorrect={false}
//             />

//             {/* Tiny picker */}
//             {picking && suggestions.length > 0 && (
//               <View className="mt-2 rounded-xl border border-gray-200 bg-white max-h-44 overflow-hidden">
//                 <ScrollView keyboardShouldPersistTaps="handled">
//                   {suggestions.map((c: any) => (
//                     <Pressable
//                       key={`${c._id ?? "noid"}:${(c.code ?? "").toLowerCase()}`} // ✅ unique + stable
//                       onPress={() => chooseSuggestion(c)}
//                       className="px-4 py-3 border-b border-gray-100"
//                     >
//                       <Text className="font-kumbh text-[#111827]">
//                         {(c.code as string) ?? "#—"}
//                       </Text>
//                       <Text className="font-kumbh text-[12px] text-[#6B7280]">
//                         {c.name}
//                       </Text>
//                     </Pressable>
//                   ))}
//                 </ScrollView>
//               </View>
//             )}
//           </View>

//           {/* Status chips kept for future */}
//           <View className="mt-4">
//             <Text className="font-kumbh text-[#6B7280] mb-2">Status</Text>
//             <View className="flex-row flex-wrap" style={{ gap: 8 }}>
//               {TAB_ORDER.map((s) => {
//                 const selected = s === status;
//                 return (
//                   <Pressable
//                     key={s}
//                     onPress={() => setStatus(s)}
//                     className="rounded-full px-4 py-2"
//                     style={{ backgroundColor: selected ? "#111827" : "#E5E7EB" }}
//                   >
//                     <Text
//                       className="font-kumbh text-[12px]"
//                       style={{ color: selected ? "#FFFFFF" : "#111827" }}
//                     >
//                       {s.replace("_", " ")}
//                     </Text>
//                   </Pressable>
//                 );
//               })}
//             </View>
//           </View>

//           <View className="flex-row justify-end items-center mt-6" style={{ gap: 12 }}>
//             <Pressable onPress={onClose}>
//               <Text className="font-kumbh text-[#6B7280]">Cancel</Text>
//             </Pressable>
//             <Pressable onPress={create} className="rounded-xl px-5 py-3" style={{ backgroundColor: "#4C5FAB" }}>
//               <Text className="font-kumbh text-white">Create</Text>
//             </Pressable>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// }