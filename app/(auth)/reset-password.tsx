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
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useToast } from "react-native-toast-notifications";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react-native";
import HexButton from "@/components/ui/HexButton";
import { BlurView } from "expo-blur";
import { useAppDispatch } from "@/store/hooks";
import { resetPassword } from "@/redux/auth/auth.thunks";

type FormValues = { password: string; confirmPassword: string };

const schema = yup.object({
  password: yup
    .string()
    .min(6, "Minimum 6 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

export default function ResetPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { code: otp, email } = useLocalSearchParams<{
    code?: string;
    email?: string;
  }>();
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const userPayload = {
        email: String(email),
        newPassword: values.password,
        otp: String(otp),
      };
      await dispatch(resetPassword(userPayload)).unwrap();

      router.push({ pathname: "/(auth)/login" });
    } catch (err) {
      console.log("Reset password failed:", err);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />

        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        >
          <View className="mt-24">
            <View
              onTouchEnd={() => router.back()}
              className="mb-6 flex-row items-center gap-4"
            >
              <ArrowLeft size={24} color="#000" />
              <Text className="text-3xl text-black font-kumbhBold">
                Reset Password
              </Text>
            </View>
            <Text className="text-base text-gray-500 mt-2 font-kumbhLight">
              Set your new password to continue
            </Text>
          </View>

          {/* Password */}
          <View className="mt-4">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">
              New Password
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <View className="mr-2">
                    <Lock size={18} color="#6B7280" />
                  </View>
                  <TextInput
                    placeholder="Enter New Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className="flex-1 text-black font-kumbh"
                  />
                  <Pressable onPress={() => setShowPassword((s) => !s)}>
                    {showPassword ? (
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
              Confirm New Password
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <View className="mr-2">
                    <Lock size={18} color="#6B7280" />
                  </View>
                  <TextInput
                    placeholder="Confirm New Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className="flex-1 text-black font-kumbh"
                  />
                  <Pressable onPress={() => setShowConfirmPassword((s) => !s)}>
                    {showPassword ? (
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

          {/* Continue button */}
          <View className="mt-10">
            <HexButton
              title={isSubmitting ? "Please wait..." : "Continue"}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
            />
          </View>
        </KeyboardAwareScrollView>

        <BlurView
          intensity={100}
          tint="systemChromeMaterial"
          className="absolute top-0 left-0 right-0 h-12"
        />
      </View>
    </TouchableWithoutFeedback>
  );
}
