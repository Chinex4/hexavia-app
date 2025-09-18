import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useToast } from "react-native-toast-notifications";
import { BlurView } from "expo-blur";
import HexButton from "@/components/ui/HexButton";
import { ArrowLeft } from "lucide-react-native";

const DIGITS = 5;
const RESEND_SECS = 30;

export default function OtpVerification() {
  const { email = "", type = "signup" } = useLocalSearchParams<{
    email?: string;
    type?: string;
  }>();
  const router = useRouter();
  const toast = useToast();

  const [otp, setOtp] = useState<string[]>(Array(DIGITS).fill(""));
  const [focusIdx, setFocusIdx] = useState<number>(0);
  const inputs = useRef<TextInput[]>([]);
  const [seconds, setSeconds] = useState<number>(RESEND_SECS);
  const code = otp.join("");
  const canVerify = code.length === DIGITS;

  // Countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  useEffect(() => {
    setTimeout(() => inputs.current[0]?.focus(), 100);
  }, []);

  const handleChange = (text: string, index: number) => {
    const val = text.replace(/[^\d]/g, "").slice(-1);
    const next = [...otp];
    next[index] = val;
    setOtp(next);

    if (val && index < DIGITS - 1) {
      inputs.current[index + 1]?.focus();
      setFocusIdx(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
        return;
      }
      if (index > 0) {
        inputs.current[index - 1]?.focus();
        setFocusIdx(index - 1);
        const next = [...otp];
        next[index - 1] = "";
        setOtp(next);
      }
    }
  };

  const resend = async () => {
    if (seconds > 0) return;
    // Mock resend (hook up to API later)
    toast.show("OTP resent to your email.", {
      type: "success",
      placement: "top",
    });
    setSeconds(RESEND_SECS);
  };

  const onVerify = async () => {
    if (!canVerify) return;
    try {
      const key = type === "login" ? "auth_user" : "signup_user";
      const raw = await AsyncStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : {};
      const merged = {
        ...data,
        email,
        otpVerifiedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(merged));
      const toastMsg =
        type === "login"
          ? "Login Success"
          : type === "forgotPassword"
            ? "Proceed to login"
            : "Email Verified. Proceed to Login!";
      toast.show(toastMsg, { type: "success", placement: "top" });

      // Adjust this to your next route
      const nextRoute =
        type === "login"
          ? "/(staff)/(tabs)/"
          : type === "forgotPassword"
            ? "/(auth)/reset-password"
            : "/(auth)/create-password";

      router.replace(nextRoute as any);
    } catch {
      toast.show("Verification failed. Please try again.", {
        type: "danger",
        placement: "top",
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />

        {/* Top blur */}
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
          {/* Progress (step 2 active) */}
          {type === "signup" && (
            <View className="mt-[70px] flex flex-row justify-between gap-2">
              <View className="flex-1 h-1 bg-gray-200 rounded-xl" />
              <View className="flex-1 h-1 bg-primary rounded-xl" />
              <View className="flex-1 h-1 bg-gray-200 rounded-xl" />
            </View>
          )}

          {/* Title + subtitle */}
          <View
            className={`${type === "login" || type === "forgotPassword" ? "mt-24" : "mt-6"}`}
          >
            {type === "signup" ? null : (
              <View
                className="mb-4 rounded-full w-10 h-10 items-center justify-center"
                onTouchEnd={() => router.back()}
              >
                <ArrowLeft />
              </View>
            )}
            <Text className="text-3xl text-black font-kumbhBold">
              Verify Email
            </Text>
            <Text className="text-base text-gray-500 mt-2 font-kumbhLight">
              We’ve sent you an OTP Code via Email. Please enter {DIGITS}-digit
              code sent to{" "}
              <Text className="text-primary font-kumbh">{String(email)}</Text>
            </Text>
          </View>

          {/* OTP Boxes */}
          <View className="mt-8 flex-row justify-between px-2">
            {Array.from({ length: DIGITS }).map((_, i) => {
              const isActive = focusIdx === i;
              const hasValue = otp[i]?.length > 0;
              return (
                <View
                  key={i}
                  className={`w-14 h-16 rounded-2xl items-center justify-center border
                  ${isActive ? "border-primary" : hasValue ? "border-gray-400" : "border-gray-300"}
                  bg-white`}
                >
                  <TextInput
                    ref={(ref) => {
                      if (ref) inputs.current[i] = ref;
                    }}
                    keyboardType={
                      Platform.OS === "ios" ? "number-pad" : "numeric"
                    }
                    maxLength={1}
                    value={otp[i]}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    onFocus={() => setFocusIdx(i)}
                    className="text-3xl text-black font-kumbh text-center w-full"
                    selectionColor="#7C3AED"
                  />
                </View>
              );
            })}
          </View>

          {/* Resend */}
          <View className="mt-8 items-center">
            <Text className="text-gray-700 font-kumbh">
              Didn’t Receive it?{" "}
              <Text
                className={`font-kumbhBold ${seconds > 0 ? "text-gray-400" : "text-primary"}`}
                onPress={resend}
              >
                Resend{" "}
                {seconds > 0 ? `0:${String(seconds).padStart(2, "0")}` : ""}
              </Text>
            </Text>
          </View>

          {/* Verify button */}
          <View className="mt-12">
            <HexButton
              title="Verify"
              onPress={onVerify}
              disabled={!canVerify}
            />
          </View>
        </KeyboardAwareScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
