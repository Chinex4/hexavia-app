import clsx from "clsx";
import { TextInput } from "react-native";

export default function Input({
  multiline,
  placeholder,
  keyboardType,
  value,
  onChangeText,
}: {
  multiline?: boolean;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  value?: string;
  onChangeText?: (t: string) => void;
}) {
  return (
    <TextInput
      placeholder={placeholder}
      multiline={multiline}
      keyboardType={keyboardType}
      value={value}
      onChangeText={onChangeText}
      className={clsx(
        "bg-gray-200 rounded-2xl px-4 py-4 font-kumbh text-text",
        multiline && "min-h-[88px]"
      )}
      placeholderTextColor="#9CA3AF"
      returnKeyType="done"
      blurOnSubmit
    />
  );
}
