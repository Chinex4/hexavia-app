import React from "react";
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface Option {
  label: string;
  value: string | number;
}

interface OptionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string | number) => void;
  title: string;
  options: Option[];
  selectedValue?: string | number;
}

export default function OptionSheet({
  visible,
  onClose,
  onSelect,
  title,
  options,
  selectedValue,
}: OptionSheetProps) {
  const handleSelect = (value: string | number) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl max-h-96">
          <View className="px-6 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-center">{title}</Text>
          </View>
          <ScrollView className="px-6 py-2">
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelect(option.value)}
                className={`py-4 border-b border-gray-100 ${
                  selectedValue === option.value ? "bg-blue-50" : ""
                }`}
              >
                <Text
                  className={`text-base ${
                    selectedValue === option.value
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View className="px-6 py-4">
            <TouchableOpacity
              onPress={onClose}
              className="py-3 bg-gray-100 rounded-lg"
            >
              <Text className="text-center text-gray-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}