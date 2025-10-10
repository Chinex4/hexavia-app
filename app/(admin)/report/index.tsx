// app/(app)/reports/CreateReportScreen.tsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, Share2 } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

type FormValues = {
  projectName: string;
  channel: string;
  task: string;
  duration: string;
  date: Date | null;
};

// ✅ Stop epoch casting: keep null as null, then validate manually
const schema: yup.ObjectSchema<FormValues> = yup
  .object({
    projectName: yup.string().trim().required("Project name is required"),
    channel: yup.string().trim().required("Please select a channel"),
    task: yup.string().trim().required("Task is required"),
    duration: yup.string().trim().required("Enter duration (e.g. 4 weeks)"),
    date: yup
      .date()
      .nullable()
      .required("Date is required")
      .test("required", "Date is required", (value) => {
        if (value === null) return false;
        return value instanceof Date && !isNaN(value.getTime());
      }),
  })
  .required();

export default function CreateReportScreen() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      projectName: "",
      channel: "",
      task: "",
      duration: "",
      date: null, // stays null until user selects
    },
    mode: "onBlur",
  });

  // Date picker state
  const [showDate, setShowDate] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null); // iOS live buffer

  const openDatePicker = (current?: Date | null) => {
    setTempDate(current ?? new Date());
    setShowDate(true);
  };
  const closeDatePicker = () => setShowDate(false);
  const confirmDate = () => {
    if (tempDate) setValue("date", tempDate, { shouldValidate: true });
    setShowDate(false);
  };

  const dateValue = watch("date");

  // channel picker modal
  const [channelOpen, setChannelOpen] = useState(false);
  const channels = useMemo(
    () => ["General", "Finance", "Sales", "Marketing", "Engineering", "HR"],
    []
  );

  const onSubmit = (values: FormValues) => {
    console.log("Report form:", values);
  };

  const formatDate = (d: Date | null) => {
    if (!d) return "DD/MM/YYYY";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
    // No parsing back to Date anywhere, so no epoch surprises.
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 mt-6 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 -ml-1 items-center justify-center"
          hitSlop={8}
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbh text-black">Create report</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Title + blurb */}
        <Text className="mt-4 text-2xl font-kumbhBold text-black">Report</Text>
        <Text className="mt-3 text-base font-kumbh leading-6 text-gray-500">
          Generate insightful reports to monitor performance, track finances,
          and evaluate project progress.
        </Text>

        {/* Project Name */}
        <Text className="mt-6 text-lg font-kumbh text-black">Project Name</Text>
        <Controller
          control={control}
          name="projectName"
          render={({ field: { onChange, onBlur, value} }) => (
            <TextInput
              className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 font-kumbh text-[16px] text-black"
              placeholder="Enter Project Name"
              placeholderTextColor="#9CA3AF"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.projectName && (
          <Text className="mt-1 font-kumbh text-sm text-red-500">
            {errors.projectName.message}
          </Text>
        )}

        {/* Select Channel */}
        <Text className="mt-5 text-lg font-kumbh text-black">Select Channel</Text>
        <Controller
          control={control}
          name="channel"
          render={({ field: { value } }) => (
            <Pressable
              onPress={() => setChannelOpen(true)}
              className="mt-2 h-14 w-full flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4"
            >
              <Text
                className={`font-kumbh text-[16px] ${
                  value ? "text-black" : "text-gray-400"
                }`}
              >
                {value || "Select Channel"}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </Pressable>
          )}
        />
        {errors.channel && (
          <Text className="mt-1 font-kumbh text-sm text-red-500">
            {errors.channel.message}
          </Text>
        )}

        {/* Task */}
        <Text className="mt-5 text-lg font-kumbh text-black">Task</Text>
        <Controller
          control={control}
          name="task"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="mt-2 h-40 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-kumbh text-[16px] text-black"
              placeholder="Enter Task"
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.task && (
          <Text className="mt-1 font-kumbh text-sm text-red-500">
            {errors.task.message}
          </Text>
        )}

        {/* Duration + Date */}
        <View className="mt-5 flex-row gap-4">
          <View className="flex-1">
            <Text className="text-lg font-kumbh text-black">Duration</Text>
            <Controller
              control={control}
              name="duration"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 font-kumbh text-[16px] text-black"
                  placeholder="e.g. 4 Weeks"
                  placeholderTextColor="#9CA3AF"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.duration && (
              <Text className="mt-1 font-kumbh text-sm text-red-500">
                {errors.duration.message}
              </Text>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-lg font-kumbh text-black">Date</Text>
            <Controller
              control={control}
              name="date"
              render={() => (
                <Pressable
                  onPress={() => openDatePicker(dateValue)}
                  className="mt-2 h-14 w-full flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4"
                >
                  <Text
                    className={`font-kumbh text-[16px] ${
                      dateValue ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {formatDate(dateValue)}
                  </Text>
                  <ChevronDown size={18} color="#6B7280" />
                </Pressable>
              )}
            />
            {errors.date && (
              <Text className="mt-1 font-kumbh text-sm text-red-500">
                {errors.date.message as string}
              </Text>
            )}
          </View>
        </View>

        {/* Footer buttons */}
        <View className="mt-10 flex-row items-center justify-between">
          <Pressable
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            className="flex-1 rounded-2xl bg-primary py-4 disabled:opacity-60"
          >
            <Text className="text-center font-kumbh text-[16px] font-semibold text-white">
              AI Generate
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {}}
            className="ml-4 h-14 w-14 items-center justify-center rounded-2xl border border-gray-200"
          >
            <Share2 size={22} color="#111827" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Channel Picker Modal */}
      <Modal visible={channelOpen} transparent animationType="fade">
        <Pressable
          onPress={() => setChannelOpen(false)}
          className="flex-1 bg-black/30"
        />
        <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5">
          <Text className="mb-3 text-lg font-kumbh font-semibold text-black">
            Select Channel
          </Text>
          <FlatList
            data={channels}
            keyExtractor={(i) => i}
            ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100" />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setValue("channel", item, { shouldValidate: true });
                  setChannelOpen(false);
                }}
                className="py-3"
              >
                <Text className="font-kumbh text-[16px] text-black">{item}</Text>
              </Pressable>
            )}
          />
          <View className="h-3" />
        </View>
      </Modal>

      {/* Android: dialog picker */}
      {showDate && Platform.OS === "android" && (
        <DateTimePicker
          mode="date"
          value={dateValue ?? new Date()}
          onChange={(event, picked) => {
            // 'set' or 'dismissed'
            if (event.type === "set" && picked) {
              setValue("date", picked, { shouldValidate: true });
            }
            setShowDate(false); // always close after any action
          }}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(2000, 0, 1)}
        />
      )}

      {/* iOS: custom sheet with spinner */}
      {showDate && Platform.OS === "ios" && (
        <Modal transparent animationType="fade">
          <Pressable className="flex-1 bg-black/30" onPress={closeDatePicker} />
          <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5">
            <View className="mb-3 flex-row justify-between">
              <Pressable onPress={closeDatePicker}>
                <Text className="font-kumbh text-primary">Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmDate}>
                <Text className="font-kumbh font-semibold text-primary">Done</Text>
              </Pressable>
            </View>

            <DateTimePicker
              mode="date"
              display="spinner"
              value={tempDate ?? new Date()}
              onChange={(_, picked) => {
                if (picked) setTempDate(picked); // keep sheet open, update buffer
              }}
              maximumDate={new Date(2100, 11, 31)}
              minimumDate={new Date(2000, 0, 1)}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
