import { logout } from "@/redux/auth/auth.slice";
import { useAppDispatch } from "@/store/hooks";
import { useRouter } from "expo-router";
import { View, Text, Pressable } from "react-native";
export default function Profile() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const logoutHandler = () => {
    dispatch(logout());
    router.replace("/(auth)/login");
  };
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="font-sans text-gray-900">Profile screen</Text>
      <Pressable
        onPress={() => {
          logoutHandler();
        }}
        className="mt-4 rounded px-4 py-2 bg-red-500"
      >
        <Text className="text-white">Logout</Text>
      </Pressable>
    </View>
  );
}
