import React, { useState } from "react";
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
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import Field from "@/components/admin/Field";
import Dropdown from "@/components/admin/Dropdown";
import Menu from "@/components/admin/Menu";
import MenuItem from "@/components/admin/MenuItem";
import HexButton from "@/components/ui/HexButton";

export default function CreateChannel() {
  const router = useRouter();

  // form state (dummy)
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [code, setCode] = useState("");
  const [position, setPosition] = useState<
    "Lead" | "Member" | "Guest" | "Owner"
  >("Member");
  const [showPos, setShowPos] = useState(false);

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
        <Text className="text-3xl font-kumbhBold text-text">Channels</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={
          Platform.select({ ios: 8, android: 0 }) as number
        }
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Name of Channel">
            <TextInput
              placeholder="Enter Quantity"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              className="bg-gray-200 rounded-2xl px-4 py-4 font-kumbh text-text"
            />
          </Field>

          <Field label="Descriptions">
            <TextInput
              placeholder="Enter Description"
              placeholderTextColor="#9CA3AF"
              value={desc}
              onChangeText={setDesc}
              multiline
              className="bg-gray-200 rounded-2xl px-4 py-4 min-h-[88px] font-kumbh text-text"
            />
          </Field>

          <View className="flex-row gap-3">
            <Field label="Create Code" className="flex-1">
              <TextInput
                placeholder="Enter Code"
                placeholderTextColor="#9CA3AF"
                value={code}
                onChangeText={setCode}
                className="bg-gray-200 rounded-2xl px-4 py-4 font-kumbh text-text"
                autoCapitalize="characters"
              />
            </Field>

            {/* <Field label="Position" className="flex-1">
              <View>
                <Dropdown
                  value={position}
                  open={showPos}
                  onToggle={() => setShowPos((s) => !s)}
                />
                {showPos && (
                  <Menu>
                    {(["Owner", "Lead", "Member", "Guest"] as const).map(
                      (opt) => (
                        <MenuItem
                          key={opt}
                          active={opt === position}
                          onPress={() => {
                            setPosition(opt);
                            setShowPos(false);
                          }}
                        >
                          {opt}
                        </MenuItem>
                      )
                    )}
                  </Menu>
                )}
              </View>
            </Field> */}
          </View>
          <HexButton title="Create Channel" onPress={() => {}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
