import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function FinanceForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(""); // DD/MM/YYYY
  const [desc, setDesc] = useState("");

  const onSave = () => {
    // TODO: dispatch(createExpense({ amount: parseFloat(amount), date, description: desc }))
    // For now, just navigate back
    router.back();
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
        <Text className="text-3xl font-kumbhBold text-[#111827]">
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
          <Text className="text-[24px] font-kumbhBold text-[#111827]">Expenses</Text>
          <Text className="text-[14px] text-gray-500 font-kumbh mb-6">
            Record all transaction history
          </Text>

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
              <View className="rounded-2xl bg-gray-100 px-4 py-3">
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9CA3AF"
                  className="font-kumbh text-[16px] text-[#111827]"
                />
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mt-5">
            <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">
              Descriptions
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
            className="mt-10 h-12 rounded-2xl bg-[#4C5FAB] items-center justify-center active:opacity-90"
          >
            <Text className="text-white font-kumbhBold">Save Expenses</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
