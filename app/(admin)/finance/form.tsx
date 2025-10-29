import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Calendar } from "lucide-react-native";
import clsx from "clsx";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createFinanceRecord } from "@/redux/finance/finance.thunks";
import { selectFinanceCreating } from "@/redux/finance/finance.selectors";
import { showSuccess, showError } from "@/components/ui/toast";

type FinanceType = "receivable" | "expense";

function toISO(dmy: string) {
  const m = dmy.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return dmy;
  const [_, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}
function fmtDMY(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function FinanceForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const creating = useAppSelector(selectFinanceCreating);

  const [type, setType] = useState<FinanceType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");

  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const openPicker = () => {
    const m = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      setPickerDate(new Date(+m[3], +m[2] - 1, +m[1]));
    } else {
      setPickerDate(new Date());
    }
    setShowPicker(true);
  };

  const onChangePicker = (_: any, selected?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (!selected) return; // dismissed
    setPickerDate(selected);
    setDate(fmtDMY(selected));
  };

  const onSave = async () => {
    const amt = Number(String(amount).replace(/[^\d.]/g, ""));
    if (!type) return showError("Select a type.");
    if (!Number.isFinite(amt) || amt <= 0)
      return showError("Enter a valid amount.");
    if (!date) return showError("Pick a date.");
    if (desc === "") return showError("Description field cannot be empty!");

    try {
      await dispatch(
        createFinanceRecord({
          type,
          amount: amt,
          description: desc.trim() || undefined,
          date: toISO(date),
        })
      ).unwrap();

      showSuccess("Finance record added.");
      router.back();
    } catch (e: any) {
      showError(e?.message || "Failed to save record");
    }
  };

  const TypePill = ({ v, label }: { v: FinanceType; label: string }) => {
    const active = type === v;
    return (
      <Pressable
        onPress={() => setType(v)}
        className={clsx(
          "flex-1 h-11 rounded-2xl items-center justify-center",
          active ? "bg-[#4C5FAB]" : "bg-gray-100"
        )}
      >
        <Text
          className={clsx(
            "font-kumbhBold",
            active ? "text-white" : "text-[#111827]"
          )}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-16 pb-3 flex-row items-center gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-2xl font-kumbhBold text-[#111827]">
          Finance Form
        </Text>
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
          <Text className="text-[14px] font-kumbhBold text-[#111827]">
            Record
          </Text>
          <Text className="text-[14px] text-gray-500 font-kumbh mb-6">
            Add a receivable or expense
          </Text>

          {/* Type selector */}
          <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">
            Type
          </Text>
          <View className="flex-row mb-5" style={{ gap: 10 }}>
            <TypePill v="expense" label="Expense" />
            <TypePill v="receivable" label="Receivable" />
          </View>

          {/* Amount + Date */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">
                Amount
              </Text>
              <View className="rounded-2xl bg-gray-100 px-4 py-3">
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter Amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="font-kumbh text-[16px] text-[#111827]"
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">
                Date
              </Text>
              <Pressable
                onPress={openPicker}
                className="rounded-2xl bg-gray-100 px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="font-kumbh text-[16px] text-[#111827]">
                  {date || "DD/MM/YYYY"}
                </Text>
                <Calendar size={18} color="#111827" />
              </Pressable>
            </View>
          </View>

          {/* Description */}
          <View className="mt-5">
            <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">
              Description
            </Text>
            <View className="rounded-2xl bg-gray-100 px-4 py-3">
              <TextInput
                value={desc}
                onChangeText={setDesc}
                placeholder="Enter Description"
                placeholderTextColor="#9CA3AF"
                multiline
                className="font-kumbh text-[16px] text-[#111827] min-h-[92px]"
              />
            </View>
          </View>

          <Pressable
            onPress={onSave}
            disabled={creating}
            className={clsx(
              "mt-10 h-12 rounded-2xl items-center justify-center active:opacity-90",
              creating ? "bg-gray-400" : "bg-[#4C5FAB]"
            )}
          >
            <Text className="text-white font-kumbhBold">
              {creating
                ? "Saving…"
                : type === "expense"
                  ? "Save Expense"
                  : "Save Receivable"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Native Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onChangePicker}
        />
      )}
    </SafeAreaView>
  );
}
