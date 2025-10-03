import clsx from "clsx";
import { ChevronDown } from "lucide-react-native";
import { Pressable, Text } from "react-native";

export default function Dropdown({
  value,
  open,
  onToggle,
}: {
  value: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      className={clsx(
        "flex-row items-center justify-between rounded-2xl px-4 py-4 bg-gray-200"
      )}
    >
      <Text className="text-gray-700 font-kumbh">{value}</Text>
      <ChevronDown size={18} color="#111827" />
    </Pressable>
  );
}
