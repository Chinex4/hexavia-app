import React, { useEffect, useMemo, useState } from "react";
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
import { ArrowLeft, ChevronDown, Share2, Check } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { selectAllChannels } from "@/redux/channels/channels.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchChannels } from "@/redux/channels/channels.thunks";

type Channel = { _id: string; name: string };

type FormValues = {
  projectName: string;
  channelIds: string[];
  task: string;
  duration: string;
  date: Date | null;
};

const schema: yup.ObjectSchema<FormValues> = yup
  .object({
    projectName: yup.string().trim().required("Project name is required"),
    channelIds: yup
      .array(yup.string().trim().required())
      .min(1, "Please select at least one channel")
      .required("Please select at least one channel"),
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
  const dispatch = useAppDispatch();

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
      channelIds: [],
      task: "",
      duration: "",
      date: null,
    },
    mode: "onBlur",
  });

  const selectedIds = watch("channelIds");
  const dateValue = watch("date");

  const [showDate, setShowDate] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const openDatePicker = (current?: Date | null) => {
    setTempDate(current ?? new Date());
    setShowDate(true);
  };
  const closeDatePicker = () => setShowDate(false);
  const confirmDate = () => {
    if (tempDate) setValue("date", tempDate, { shouldValidate: true });
    setShowDate(false);
  };

  const [channelOpen, setChannelOpen] = useState(false);
  const channels = useAppSelector(selectAllChannels) as Channel[];

  useEffect(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

  const onSubmit = (values: FormValues) => {
    console.log("Report form:", values);
  };

  const formatDate = (d: Date | null) => {
    if (!d) return "DD/MM/YYYY";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const idToName = useMemo(() => {
    const map = new Map<string, string>();
    channels.forEach((c) => map.set(c._id, c.name));
    return map;
  }, [channels]);

  const selectedNames = useMemo(
    () => selectedIds.map((id) => idToName.get(id) ?? id),
    [selectedIds, idToName]
  );

  const toggleId = (id: string) => {
    const next = new Set(watch("channelIds"));
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setValue("channelIds", Array.from(next), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const selectAll = () => {
    setValue(
      "channelIds",
      channels.map((c) => c._id),
      { shouldValidate: true, shouldDirty: true, shouldTouch: true }
    );
  };

  const clearAll = () => {
    setValue("channelIds", [], {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
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
          render={({ field: { onChange, onBlur, value } }) => (
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

        {/* Select Channels (multi) */}
        <Text className="mt-5 text-lg font-kumbh text-black">Channels</Text>
        <Controller
          control={control}
          name="channelIds"
          render={({ field: { value } }) => (
            <Pressable
              onPress={() => setChannelOpen(true)}
              className="mt-2 min-h-14 w-full flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <View className="flex-1">
                {value.length === 0 ? (
                  <Text className="font-kumbh text-[16px] text-gray-400">
                    Select Channels
                  </Text>
                ) : (
                  <View>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedNames.slice(0, 3).map((n) => (
                        <View
                          key={n}
                          className="px-3 py-1 rounded-full bg-white border border-gray-200"
                        >
                          <Text className="font-kumbh text-sm text-gray-700">
                            {n}
                          </Text>
                        </View>
                      ))}
                      {selectedNames.length > 3 && (
                        <View className="px-3 py-1 rounded-full bg-white border border-gray-200">
                          <Text className="font-kumbh text-sm text-gray-700">
                            +{selectedNames.length - 3} more
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
              <ChevronDown size={20} color="#6B7280" />
            </Pressable>
          )}
        />
        {errors.channelIds && (
          <Text className="mt-1 font-kumbh text-sm text-red-500">
            {String(errors.channelIds.message)}
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

      {/* Channel Picker Modal (multi-select) */}
      <Modal visible={channelOpen} transparent animationType="fade">
        <Pressable onPress={() => setChannelOpen(false)} className="flex-1 bg-black/30" />
        <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-kumbh font-semibold text-black">Select Channels</Text>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={clearAll} className="px-2 py-1">
                <Text className="font-kumbh text-primary">Clear</Text>
              </Pressable>
              <Pressable onPress={selectAll} className="px-2 py-1">
                <Text className="font-kumbh text-primary">Select All</Text>
              </Pressable>
            </View>
          </View>

          <FlatList
            data={channels}
            keyExtractor={(i) => i._id}
            ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100" />}
            renderItem={({ item }) => {
              const checked = selectedIds.includes(item._id);
              return (
                <Pressable
                  onPress={() => toggleId(item._id)}
                  className="py-3 flex-row items-center justify-between"
                >
                  <Text className="font-kumbh text-[16px] text-black">{item.name}</Text>
                  <View
                    className={`w-6 h-6 rounded-md border items-center justify-center ${
                      checked ? "bg-primary border-primary" : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked ? <Check size={16} color="#fff" /> : null}
                  </View>
                </Pressable>
              );
            }}
            style={{ maxHeight: 380 }}
          />

          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={() => setChannelOpen(false)}
              className="flex-1 items-center justify-center rounded-2xl border border-gray-200 py-3"
            >
              <Text className="font-kumbh">Done</Text>
            </Pressable>
          </View>

          <View className="h-3" />
        </View>
      </Modal>

      {/* Android: dialog picker */}
      {showDate && Platform.OS === "android" && (
        <DateTimePicker
          mode="date"
          value={dateValue ?? new Date()}
          onChange={(event, picked) => {
            if (event.type === "set" && picked) {
              setValue("date", picked, { shouldValidate: true });
            }
            setShowDate(false);
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
                if (picked) setTempDate(picked);
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
