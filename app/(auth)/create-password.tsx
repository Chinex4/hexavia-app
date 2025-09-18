import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useToast } from "react-native-toast-notifications";
import { BlurView } from "expo-blur";
import HexButton from "@/components/ui/HexButton";
import { Eye, EyeOff, Lock, Hash } from "lucide-react-native";

type FormValues = {
  clientCode: string;
  password: string;
  confirmPassword: string;
};

const schema = yup.object({
  clientCode: yup
    .string()
    .trim()
    .matches(/^[A-Za-z0-9-]{4,}$/, "Use letters/numbers (min 4)")
    .required("Client/Department code is required"),
  password: yup
    .string()
    .min(8, "At least 8 characters")
    .matches(/[A-Za-z]/, "Include at least 1 letter")
    .matches(/\d/, "Include at least 1 number")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

export default function SignupFinalScreen() {
  const router = useRouter();
  const toast = useToast();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: { clientCode: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const existing = await AsyncStorage.getItem("signup_user");
      const base = existing ? JSON.parse(existing) : {};
      const payload = {
        ...base,
        clientCode: values.clientCode.trim(),
        password: values.password,
        completedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("signup_user", JSON.stringify(payload));

      toast.show("Account created. You can now log in.", {
        type: "success",
        placement: "top",
      });

      // Go to login
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("final signup error:", err);
      toast.show("Could not finish signup. Try again.", {
        type: "danger",
        placement: "top",
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        <BlurView
          intensity={100}
          tint="systemChromeMaterial"
          className="absolute top-0 left-0 right-0 h-12"
        />

        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        >
          {/* Progress (step 3 active) */}
          <View className="mt-[70px] flex flex-row justify-between gap-2">
            <View className="flex-1 h-1 rounded-xl bg-gray-200" />
            <View className="flex-1 h-1 rounded-xl bg-gray-200" />
            <View className="flex-1 h-1 rounded-xl bg-primary" />
          </View>

          {/* Header */}
          <View className="mt-8">
            <Text className="text-3xl text-black font-kumbhBold">
              Create an Account
            </Text>
            <Text className="text-base text-gray-500 mt-2 font-kumbhLight">
              Manage projects, oversee finances, and stay connected with your
              team all within Hexavian ERP.
            </Text>
          </View>

          {/* Client/Department Code */}
          <View className="mt-6">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">
              Client/Department Code
            </Text>
            <Controller
              control={control}
              name="clientCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <Hash size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Enter Client/Department Code"
                    placeholderTextColor="#9CA3AF"
                    onBlur={onBlur}
                    onChangeText={(t) => onChange(t.toUpperCase())}
                    value={value}
                    autoCapitalize="characters"
                    textAlignVertical="center"
                    className="flex-1 h-full ml-2 text-black font-kumbh py-0 text-[16px] leading-[20px]"
                    style={{ paddingVertical: 0 }}
                  />
                </View>
              )}
            />
            {errors.clientCode && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">
                {errors.clientCode.message}
              </Text>
            )}
          </View>

          {/* Password */}
          <View className="mt-4">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">
              Password
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <Lock size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Enter Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPass}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    textAlignVertical="center"
                    className="flex-1 h-full ml-2 text-black font-kumbh py-0 text-[16px] leading-[20px]"
                    style={{ paddingVertical: 0 }}
                  />
                  <Pressable onPress={() => setShowPass((s) => !s)}>
                    {showPass ? (
                      <EyeOff size={20} color="#111827" />
                    ) : (
                      <Eye size={20} color="#111827" />
                    )}
                  </Pressable>
                </View>
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Confirm Password */}
          <View className="mt-4">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">
              Password Confirm
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <Lock size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Re-enter Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirm}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    textAlignVertical="center"
                    className="flex-1 h-full ml-2 text-black font-kumbh py-0 text-[16px] leading-[20px]"
                    style={{ paddingVertical: 0 }}
                  />
                  <Pressable onPress={() => setShowConfirm((s) => !s)}>
                    {showConfirm ? (
                      <EyeOff size={20} color="#111827" />
                    ) : (
                      <Eye size={20} color="#111827" />
                    )}
                  </Pressable>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          {/* Continue */}
          <View className="mt-72">
            <HexButton
              title={isSubmitting ? "Please wait..." : "Continue"}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
            />
          </View>
          
        </KeyboardAwareScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
