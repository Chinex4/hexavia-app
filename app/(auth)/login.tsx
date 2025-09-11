import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useToast } from "react-native-toast-notifications";
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";
import HexButton from "@/components/ui/HexButton";
import { BlurView } from "expo-blur";
import GoogleButton from "@/components/auth/GoogleButton";

type FormValues = { identifier: string; password: string };

const schema = yup.object({
  identifier: yup
    .string()
    .trim()
    .required("Email or username is required")
    .test("email-or-username", "Enter a valid email or username", (val) => {
      if (!val) return false;
      const looksLikeEmail = /\S+@\S+\.\S+/.test(val);
      const looksLikeUsername = /^[a-zA-Z0-9_.-]{3,}$/.test(val);
      return looksLikeEmail || looksLikeUsername;
    }),
  password: yup.string().min(6, "Minimum 6 characters").required("Password is required"),
});

const maskEmail = (v: string) => {
  if (!v.includes("@")) return v;
  const [user, domain] = v.split("@");
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}${"*".repeat(Math.max(3, user.length - 2))}${user.slice(-1)}@${domain}`;
};

export default function LoginScreen() {
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const userPayload = {
        id: Date.now(),
        identifier: values.identifier,
        loginAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("auth_user", JSON.stringify(userPayload));
      toast.show("Logged in", { type: "success", placement: "top" });

      const masked = maskEmail(values.identifier);
      // NOTE: this should go to OTP screen
      router.push({ pathname: "/(auth)/otp-verification", params: { email: masked, type: "login" } });
    } catch {
      toast.show("Something went wrong. Please try again.", { type: "danger", placement: "top" });
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
            <Text className="text-3xl text-black font-kumbhBold">
              Good to see you again!
            </Text>
            <Text className="text-base text-gray-500 mt-2 font-kumbhLight">
              Access your Hexavian account and stay on top of your projects, finances, and updates
            </Text>
          </View>

          {/* Email / Username */}
          <View className="mt-6">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">Email Address or Username</Text>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <View className="mr-2">
                    <Mail size={18} color="#6B7280" />
                  </View>
                  <TextInput
                    placeholder="Enter Username or Email Address"
                    placeholderTextColor="#9CA3AF"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="flex-1 text-black font-kumbh"
                  />
                </View>
              )}
            />
            {errors.identifier && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">{errors.identifier.message}</Text>
            )}
          </View>

          {/* Password */}
          <View className="mt-4">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <View className="mr-2">
                    <Lock size={18} color="#6B7280" />
                  </View>
                  <TextInput
                    placeholder="Enter Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className="flex-1 text-black font-kumbh"
                  />
                  <Pressable onPress={() => setShowPassword((s) => !s)}>
                    {showPassword ? <EyeOff size={20} color="#111827" /> : <Eye size={20} color="#111827" />}
                  </Pressable>
                </View>
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">{errors.password.message}</Text>
            )}
          </View>

          {/* Forgot password */}
          <View className="mt-3">
            <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
              <Text className="text-[14px] font-kumbh">
                <Text className="text-gray-600">Forgot Password? </Text>
                <Text className="text-primary font-kumbhBold">Reset It</Text>
              </Text>
            </Pressable>
          </View>

          {/* Continue button */}
          <View className="mt-10">
            <HexButton
              title={isSubmitting ? "Please wait..." : "Continue"}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
            />
          </View>

          {/* Sign up */}
          <View className="mt-4 items-center">
            <Text className="text-gray-600 font-kumbh">
              Don’t have an account?{" "}
              <Text className="text-primary font-kumbhBold" onPress={() => router.push("/(auth)/signup")}>
                Sign Up
              </Text>
            </Text>
          </View>

          {/* Social login */}
          <GoogleButton onToken={(t) => {
            // POST { id_token: t } to Laravel
            toast.show(`Google id_token: ${t.slice(0, 10)}...`, { placement: "top" });
            console.log(t);
          }} />

          <Text className="text-center text-gray-500 text-sm mt-4 font-kumbh">or</Text>

          <View className="mt-4">
            <Pressable
              className="w-full py-4 rounded-xl bg-gray-50 flex-row items-center justify-center px-4"
              onPress={() => toast.show("LinkedIn sign-in coming soon", { placement: "top" })}
            >
              <Image
                  source={require("../../assets/images/linkedin.png")}
                  className="w-5 h-5 mr-2"
                />
              <Text className="text-base text-gray-800 font-kumbh">Continue With LinkedIn</Text>
            </Pressable>
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
