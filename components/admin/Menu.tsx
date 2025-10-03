import { View } from "react-native";

export default function Menu({ children }: { children: React.ReactNode }) {
  return (
    <View className="mt-2 rounded-2xl bg-white border border-gray-200 overflow-hidden">
      {children}
    </View>
  );
}