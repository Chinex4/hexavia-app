// app/(admin)/clients/create.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, Bell, Plus } from "lucide-react-native";
import clsx from "clsx";
import Field from "@/components/admin/Field";
import Input from "@/components/admin/Input";

export default function CreateClient() {
  const router = useRouter();

  // form state (dummy)
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [industry, setIndustry] = useState("");
  const [staffSize, setStaffSize] = useState("");
  const [description, setDescription] = useState("");
  const [problems, setProblems] = useState("");
  const [engagement, setEngagement] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleAdd = () => {
    // later: dispatch(createClient(...))
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-3xl font-kumbh text-text">
            Add New Client
          </Text>
        </View>

        {/* Add button (top-right) */}
        <Pressable
          onPress={handleAdd}
          className="flex-row items-center gap-2 bg-primary-500 px-4 py-2 rounded-xl active:opacity-90"
        >
          <Plus size={16} color="#fff" />
          <Text className="text-white font-kumbhBold">Add</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={
          Platform.select({ ios: 8, android: 0 }) as number
        }
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pb-10"
            keyboardShouldPersistTaps="handled"
          >
            {/* Form */}
            <Field label="Name">
              <Input
                placeholder="Enter Name"
                value={name}
                onChangeText={setName}
              />
            </Field>

            <Field label="Business Name">
              <Input
                placeholder="Enter Business Name"
                value={business}
                onChangeText={setBusiness}
              />
            </Field>

            <View className="flex-row gap-3">
              <Field label="Industry" className="flex-1">
                <Input
                  placeholder="Enter Industry"
                  value={industry}
                  onChangeText={setIndustry}
                />
              </Field>
              <Field label="Staff Size" className="flex-1">
                <Input
                  placeholder="Enter Staff size"
                  value={staffSize}
                  onChangeText={setStaffSize}
                  keyboardType="numeric"
                />
              </Field>
            </View>

            <Field label="Description">
              <Input
                multiline
                placeholder="Enter Description"
                value={description}
                onChangeText={setDescription}
              />
            </Field>

            <Field label="Problems Faced">
              <Input
                multiline
                placeholder="Enter Problems"
                value={problems}
                onChangeText={setProblems}
              />
            </Field>

            <Field label="Engagement Offered">
              <Input
                placeholder="Enter Engagement Offered"
                value={engagement}
                onChangeText={setEngagement}
              />
            </Field>

            <Field label="Deliverables">
              <Input
                multiline
                placeholder="Enter Deliverables"
                value={deliverables}
                onChangeText={setDeliverables}
              />
            </Field>

            <View className="flex-row gap-3">
              {/* Payable Amount */}
              <Field label="Payable Amount" className="flex-1">
                <Input
                  placeholder="Enter Amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </Field>

              {/* Status dropdown */}
              <Field label="Status" className="flex-1">
                <View>
                  <Pressable
                    onPress={() => setShowStatusMenu((s) => !s)}
                    className="flex-row items-center justify-between bg-gray-200 rounded-2xl px-4 py-4"
                  >
                    <Text className="text-gray-700 font-kumbh">
                      {status === "active" ? "Active" : "Inactive"}
                    </Text>
                    <ChevronDown size={18} color="#111827" />
                  </Pressable>

                  {showStatusMenu ? (
                    <View className="mt-2 rounded-2xl bg-white border border-gray-200 overflow-hidden">
                      {(["active", "inactive"] as const).map((opt) => (
                        <Pressable
                          key={opt}
                          onPress={() => {
                            setStatus(opt);
                            setShowStatusMenu(false);
                          }}
                          className={clsx(
                            "px-4 py-3",
                            status === opt ? "bg-primary-50" : "bg-white"
                          )}
                        >
                          <Text
                            className={clsx(
                              "font-kumbh",
                              status === opt ? "text-primary-700" : "text-text"
                            )}
                          >
                            {opt === "active" ? "Active" : "Inactive"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              </Field>
            </View>

            {/* Bottom actions */}
            <View className="mt-8">
              {/* Primary */}
              <Pressable className="flex-row items-center justify-center gap-3 bg-primary-500 rounded-2xl py-4 active:opacity-90">
                <View className="w-6 h-6 rounded-md bg-primary-400 items-center justify-center">
                  <Bell size={14} color="white" />
                </View>
                <Text className="text-white font-kumbhBold">Send Invoice</Text>
              </Pressable>

              {/* Secondary */}
              <Pressable className="mt-3 rounded-2xl border border-primary-300 py-4 items-center">
                <Text className="text-primary-700 font-kumbhBold">
                  Generate Invoice
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
