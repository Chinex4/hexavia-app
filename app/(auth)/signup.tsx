import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useToast } from "react-native-toast-notifications";
import { BlurView } from "expo-blur";
import HexButton from "@/components/ui/HexButton";
import {
  Mail,
  User,
  AtSign,
  Phone,
  ChevronDown,
  Search,
  X,
} from "lucide-react-native";
import { useAppDispatch } from "@/store/hooks";
import { register as registerThunk } from "@/redux/auth/auth.thunks";

type Country = {
  name: string;
  code: string;
  dialCode: string;
  flagPng: string;
};

type FormValues = {
  fullname: string;
  username: string;
  email: string;
  phoneNumber: string;
};

const schema = yup.object({
  fullname: yup
    .string()
    .trim()
    .min(2, "Full name is too short")
    .required("Full name is required"),
  username: yup
    .string()
    .trim()
    .matches(/^[a-zA-Z0-9_.-]{3,}$/, "Min 3 chars; letters, numbers, _ . -")
    .required("Username is required"),
  email: yup
    .string()
    .trim()
    .email("Enter a valid email")
    .required("Email is required"),
  phoneNumber: yup
    .string()
    .trim()
    .matches(/^[0-9]{6,}$/, "Enter a valid phone number")
    .required("Phone number is required"),
});

const maskEmail = (v: string) => {
  if (!v.includes("@")) return v;
  const [user, domain] = v.split("@");
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}${"*".repeat(Math.max(3, user.length - 2))}${user.slice(-1)}@${domain}`;
};

const FALLBACK_COUNTRIES: Country[] = [
  {
    name: "Nigeria",
    code: "NG",
    dialCode: "+234",
    flagPng: "https://flagcdn.com/w40/ng.png",
  },
  {
    name: "United States",
    code: "US",
    dialCode: "+1",
    flagPng: "https://flagcdn.com/w40/us.png",
  },
  {
    name: "United Kingdom",
    code: "GB",
    dialCode: "+44",
    flagPng: "https://flagcdn.com/w40/gb.png",
  },
];

export default function SignupScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: { fullname: "", username: "", email: "", phoneNumber: "" },
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await axios.get(
          "https://restcountries.com/v3.1/all?fields=name,idd,cca2,flags"
        );
        if (!isMounted) return;

        const parsed: Country[] = res.data
          .map((c: any) => {
            const root = c?.idd?.root ?? "";
            const suffix =
              Array.isArray(c?.idd?.suffixes) && c.idd.suffixes.length > 0
                ? c.idd.suffixes[0]
                : "";
            const dial = `${root}${suffix}`.trim();
            if (!dial) return null;
            return {
              name: c?.name?.common ?? "",
              code: c?.cca2 ?? "",
              dialCode: dial.startsWith("+") ? dial : `+${dial}`,
              flagPng: c?.flags?.png ?? "",
            } as Country;
          })
          .filter(Boolean)
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

        const finalList = parsed.length ? parsed : FALLBACK_COUNTRIES;
        setCountries(finalList);

        const defaultC =
          finalList.find((c) => c.code === "NG") ??
          finalList[0] ??
          FALLBACK_COUNTRIES[0];
        setSelectedCountry(defaultC);
      } catch (e) {
        setCountries(FALLBACK_COUNTRIES);
        setSelectedCountry(FALLBACK_COUNTRIES[0]);
        console.log("Using fallback country list (network error).");
      } finally {
        if (isMounted) setLoadingCountries(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q)
    );
  }, [countries, search]);

  const onSubmit = async (values: FormValues) => {
    try {
      await dispatch(
        registerThunk({
          fullname: values.fullname,
          username: values.username,
          email: values.email,
          role: "client",
          // phoneNumber: `${selectedCountry?.dialCode ?? ""}${values.phoneNumber}`,
        })
      ).unwrap();

      router.push({
        pathname: "/otp-verification",
        params: {
          email: maskEmail(values.email),
          type: "signup",
          phoneNumber: `${selectedCountry?.dialCode ?? ""}${values.phoneNumber}`,
        },
      });
    } catch (err) {
      console.log("Register failed:", err);
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
          <View className="mt-[70px] flex flex-row justify-between gap-2">
            <View className="flex-1 h-1 bg-primary rounded-xl" />
            <View className="flex-1 h-1 rounded-xl bg-gray-200" />
            <View className="flex-1 h-1 rounded-xl bg-gray-200" />
          </View>
          {/* Title + subtitle */}
          <View className="mt-8">
            <Text className="text-3xl text-black font-kumbhBold">
              Create an Account
            </Text>
            <Text className="text-base text-gray-500 mt-2 font-kumbhLight">
              Manage projects, oversee finances, and stay connected with your
              team all within Hexavian ERP.
            </Text>
          </View>

          {/* Full Name */}
          <View className="mt-6">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">
              Full Name
            </Text>
            <Controller
              control={control}
              name="fullname"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <User size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Enter Full Name"
                    placeholderTextColor="#9CA3AF"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className="flex-1 text-black font-kumbh ml-2"
                  />
                </View>
              )}
            />
            {errors.fullname && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">
                {errors.fullname.message}
              </Text>
            )}
          </View>

          {/* Username */}
          <View className="mt-4">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">
              Username
            </Text>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <AtSign size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Enter Username"
                    placeholderTextColor="#9CA3AF"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    className="flex-1 text-black font-kumbh ml-2"
                  />
                </View>
              )}
            />
            {errors.username && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">
                {errors.username.message}
              </Text>
            )}
          </View>

          {/* Email */}
          <View className="mt-4">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">
              Email Address
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-4 rounded-xl bg-gray-100 flex-row items-center">
                  <Mail size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Enter Email Address"
                    placeholderTextColor="#9CA3AF"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="flex-1 text-black font-kumbh ml-2"
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">
                {errors.email.message}
              </Text>
            )}
          </View>

          {/* Phone Number */}
          <View className="mt-4">
            <Text className="text-sm text-gray-700 mb-2 font-kumbh">
              Phone Number
            </Text>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="w-full h-14 px-3 rounded-xl bg-gray-100 flex-row items-center">
                  {/* Code/flag trigger */}
                  <Pressable
                    onPress={() => setPickerOpen(true)}
                    className="flex-row items-center px-1 py-1 rounded-lg"
                  >
                    {selectedCountry ? (
                      <Image
                        source={{ uri: selectedCountry.flagPng }}
                        className="w-6 h-6 rounded-sm mr-2"
                      />
                    ) : (
                      <Phone size={18} color="#6B7280" />
                    )}
                    <Text className="text-black font-kumbh mr-1">
                      {selectedCountry?.dialCode ?? ""}
                    </Text>
                    <ChevronDown size={16} color="#6B7280" />
                  </Pressable>

                  <View className="w-px h-7 bg-gray-300 mx-3" />

                  {/* Local phone input */}
                  <TextInput
                    placeholder="Enter Phone Number"
                    placeholderTextColor="#9CA3AF"
                    onBlur={onBlur}
                    onChangeText={(t) => onChange(t.replace(/[^\d]/g, ""))}
                    value={value}
                    keyboardType="phone-pad"
                    className="flex-1 text-black font-kumbh"
                  />
                </View>
              )}
            />
            {errors.phoneNumber && (
              <Text className="text-red-500 text-xs mt-1 font-kumbh">
                {errors.phoneNumber.message}
              </Text>
            )}
          </View>

          {/* Submit */}
          <View className="mt-8">
            <HexButton
              title={isSubmitting ? "Please wait..." : "Continue"}
              onPress={handleSubmit(onSubmit)}
              disabled={
                !isValid || isSubmitting || loadingCountries || !selectedCountry
              }
            />
          </View>

          <View className="mt-4 items-center">
            <Text className="text-gray-600 font-kumbh">
              Already have an account?{" "}
              <Text
                className="text-primary font-kumbhBold"
                onPress={() => router.push("/(auth)/login")}
              >
                Log in
              </Text>
            </Text>
          </View>
        </KeyboardAwareScrollView>
        <BlurView
          intensity={100}
          tint="systemChromeMaterial"
          className="absolute top-0 left-0 right-0 h-12"
        />

        {/* Country Picker Modal */}
        <Modal
          visible={pickerOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setPickerOpen(false)}
        >
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-2xl p-4 max-h-[70%]">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-kumbhBold">
                  Select your country
                </Text>
                <Pressable onPress={() => setPickerOpen(false)} className="p-2">
                  <X size={20} color="#111827" />
                </Pressable>
              </View>

              {/* Search */}
              <View className="h-12 px-3 rounded-xl bg-gray-100 flex-row items-center mb-3">
                <Search size={18} color="#6B7280" />
                <TextInput
                  placeholder="Search country or code"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-black font-kumbh ml-2"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {loadingCountries ? (
                <View className="py-6 items-center">
                  <ActivityIndicator />
                  <Text className="mt-2 text-gray-500 font-kumbh">
                    Loading countries…
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item.code}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setSelectedCountry(item);
                        setPickerOpen(false);
                      }}
                      className="flex-row items-center py-2 px-1"
                    >
                      <Image
                        source={{ uri: item.flagPng }}
                        className="w-6 h-6 rounded-sm mr-3"
                      />
                      <Text className="flex-1 text-black font-kumbh">
                        {item.name}
                      </Text>
                      <Text className="text-gray-700 font-kumbh">
                        {item.dialCode}
                      </Text>
                    </Pressable>
                  )}
                  ItemSeparatorComponent={() => (
                    <View className="h-px bg-gray-100" />
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}
