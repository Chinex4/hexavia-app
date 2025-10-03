import { Text } from "react-native";

export default function AmountText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text className="text-2xl font-kumbhBold text-[#0f172a]">{children}</Text>
  );
}
