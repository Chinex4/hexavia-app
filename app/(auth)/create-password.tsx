import HexButton from "@/components/ui/HexButton";
import { showSuccess } from "@/components/ui/toast";
import { joinChannel } from "@/redux/auth/auth.thunks";
import { useAppDispatch } from "@/store/hooks";
import { yupResolver } from "@hookform/resolvers/yup";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Eye, EyeOff, Hash, Lock } from "lucide-react-native";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useToast } from "react-native-toast-notifications";
import * as yup from "yup";

type FormValues = {
  channelCode: string;
  password: string;
  confirmPassword: string;
};

const schema = yup.object({
  channelCode: yup
    .string()
    .trim()
    .matches(/^[A-Za-z0-9-]{4,}$/, "Use letters/numbers (min 4)")
    .required("Project code is required"),
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
  const dispatch = useAppDispatch();
  const { phoneNumber } = useLocalSearchParams<{
    phoneNumber?: string;
  }>();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: { channelCode: "7190", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await dispatch(
        joinChannel({
          channelCode: `#${values.channelCode}`,
          password: values.password,
          phoneNumber,
        })
      ).unwrap();

      showSuccess("Account ready. Please log in.");
      router.replace("/(auth)/login");
    } catch {
      // Error toast shown in thunk
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

          {/* Project Code */}
          <View className="mt-6">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">
              Project Code
            </Text>
            <Controller
              control={control}
              name="channelCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <Hash size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Enter Project Code"
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

            {/* 👇 Note about default code */}
            <Text className="text-xs text-gray-400 mt-1 font-kumbh">
              Default channel code is{" "}
              <Text className="font-kumbhBold">1234</Text>.
            </Text>

            {errors.channelCode && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">
                {errors.channelCode.message}
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
