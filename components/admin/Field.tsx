import clsx from "clsx";
import { Text, View } from "react-native";

 export default function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={clsx("mb-4", className)}>
      <Text className="mb-2 text-base text-gray-700 font-kumbh">{label}</Text>
      {children}
    </View>
  );
}