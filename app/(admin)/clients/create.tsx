import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, ChevronDown, Plus } from "lucide-react-native";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";

import Field from "@/components/admin/Field";
import Input from "@/components/admin/Input";

import { selectClientMutationLoading } from "@/redux/client/client.selectors";
import { createClient } from "@/redux/client/client.thunks";
import type { ClientCreateInput } from "@/redux/client/client.types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type FormValues = {
  name: string;
  projectName: string;
  industry?: string;
  staffSize?: string;
  description?: string;
  problems?: string;
  strength?: string;
  weakness?: string;
  opportunities?: string;
  threats?: string;
  engagement?: string;
  deliverables?: string;
  payableAmount?: string;
  status: "pending" | "current" | "completed";
};

const schema: yup.ObjectSchema<FormValues> = yup.object({
  name: yup.string().trim().required("Client name is required"),
  projectName: yup.string().trim().required("Project name is required"),
  industry: yup.string().trim().optional(),
  staffSize: yup
    .string()
    .matches(/^\d*$/, "Staff size must be a number")
    .optional(),
  description: yup.string().trim().optional(),
  problems: yup.string().trim().optional(),
  strength: yup.string().trim().optional(),
  weakness: yup.string().trim().optional(),
  opportunities: yup.string().trim().optional(),
  threats: yup.string().trim().optional(),
  engagement: yup.string().trim().optional(),
  deliverables: yup.string().trim().optional(),
  payableAmount: yup
    .string()
    .matches(/^\d*$/, "Amount must be a number")
    .optional(),
  status: yup
    .mixed<"pending" | "current" | "completed">()
    .oneOf(["pending", "current", "completed"])
    .required(),
});

const STATUS_OPTIONS: Array<FormValues["status"]> = [
  "pending",
  "current",
  "completed",
];

export default function CreateClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectClientMutationLoading);

  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      projectName: "",
      industry: "",
      staffSize: "",
      description: "",
      problems: "",
      strength: "",
      weakness: "",
      opportunities: "",
      threats: "",
      engagement: "",
      deliverables: "",
      payableAmount: "",
      status: "pending",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const payload: ClientCreateInput = {
      name: values.name.trim(),
      projectName: values.projectName.trim(),
      engagement: values.engagement?.trim() || undefined,
      industry: values.industry?.trim() || undefined,
      staffSize: values.staffSize ? Number(values.staffSize) : undefined,
      description: values.description?.trim() || undefined,
      problems: values.problems?.trim() || undefined,
      strength: values.strength?.trim() || undefined,
      weakness: values.weakness?.trim() || undefined,
      opportunities: values.opportunities?.trim() || undefined,
      threats: values.threats?.trim() || undefined,
      deliverables: values.deliverables?.trim() || undefined,
      payableAmount: values.payableAmount
        ? Number(values.payableAmount)
        : undefined,
      status: values.status,
    };

    try {
      const created = await dispatch(createClient(payload)).unwrap();
      if (created?._id) {
        router.push({
          pathname: "/(admin)/clients/[id]",
          params: { id: created._id },
        });
      } else {
        router.back();
      }
    } catch {
      // showError already handled in thunk
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            disabled={loading}
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-3xl font-kumbh text-text">Add New Client</Text>
        </View>

        {/* Add (top-right) */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || loading}
          className={clsx(
            "flex-row items-center gap-2 px-4 py-2 rounded-xl active:opacity-90",
            !isValid || loading ? "bg-gray-300" : "bg-primary-500"
          )}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Plus size={16} color="#fff" />
          )}
          <Text className="text-white font-kumbhBold">
            {loading ? "Adding..." : "Add"}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={
          Platform.select({ ios: 8, android: 0 }) as number
        }
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pb-10"
            keyboardShouldPersistTaps="handled"
          >
            {/* Name */}
            <Field label="Name">
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange } }) => (
                  <Input
                    placeholder="Enter Name"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.name?.message ? (
              <ErrorText msg={errors.name.message} />
            ) : null}

            {/* Project Name */}
            <Field label="Project Name">
              <Controller
                control={control}
                name="projectName"
                render={({ field: { value, onChange } }) => (
                  <Input
                    placeholder="Enter Project Name"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.projectName?.message ? (
              <ErrorText msg={errors.projectName.message} />
            ) : null}

            {/* Industry + Staff size */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="Industry">
                  <Controller
                    control={control}
                    name="industry"
                    render={({ field: { value, onChange } }) => (
                      <Input
                        placeholder="Enter Industry"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </Field>
                {errors.industry?.message ? (
                  <ErrorText msg={errors.industry.message} />
                ) : null}
              </View>

              <View className="flex-1">
                <Field label="Staff Size">
                  <Controller
                    control={control}
                    name="staffSize"
                    render={({ field: { value, onChange } }) => (
                      <Input
                        placeholder="Enter Staff size"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="numeric"
                      />
                    )}
                  />
                </Field>
                {errors.staffSize?.message ? (
                  <ErrorText msg={errors.staffSize.message} />
                ) : null}
              </View>
            </View>

            {/* Description */}
            <Field label="Description">
              <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange } }) => (
                  <Input
                    multiline
                    placeholder="Enter Description"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.description?.message ? (
              <ErrorText msg={errors.description.message} />
            ) : null}

            {/* Problems */}
            <Field label="Problems Faced">
              <Controller
                control={control}
                name="problems"
                render={({ field: { value, onChange } }) => (
                  <Input
                    multiline
                    placeholder="Enter Problems"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.problems?.message ? (
              <ErrorText msg={errors.problems.message} />
            ) : null}

            {/* Strength */}
            <Field label="Strengths">
              <Controller
                control={control}
                name="strength"
                render={({ field: { value, onChange } }) => (
                  <Input
                    multiline
                    placeholder="Enter Strengths"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.strength?.message ? (
              <ErrorText msg={errors.strength.message} />
            ) : null}

            {/* Weakness */}
            <Field label="Weaknesses">
              <Controller
                control={control}
                name="weakness"
                render={({ field: { value, onChange } }) => (
                  <Input
                    multiline
                    placeholder="Enter Weaknesses"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.weakness?.message ? (
              <ErrorText msg={errors.weakness.message} />
            ) : null}

            {/* Opportunities */}
            <Field label="Opportunities">
              <Controller
                control={control}
                name="opportunities"
                render={({ field: { value, onChange } }) => (
                  <Input
                    multiline
                    placeholder="Enter Opportunities"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.opportunities?.message ? (
              <ErrorText msg={errors.opportunities.message} />
            ) : null}

            {/* Threats */}
            <Field label="Threats">
              <Controller
                control={control}
                name="threats"
                render={({ field: { value, onChange } }) => (
                  <Input
                    multiline
                    placeholder="Enter Threats"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.threats?.message ? (
              <ErrorText msg={errors.threats.message} />
            ) : null}

            {/* Engagement */}
            <Field label="Engagement Offered">
              <Controller
                control={control}
                name="engagement"
                render={({ field: { value, onChange } }) => (
                  <Input
                    placeholder='e.g. "Full-time", "Part-time"'
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.engagement?.message ? (
              <ErrorText msg={errors.engagement.message} />
            ) : null}

            {/* Deliverables */}
            <Field label="Deliverables">
              <Controller
                control={control}
                name="deliverables"
                render={({ field: { value, onChange } }) => (
                  <Input
                    multiline
                    placeholder="Enter Deliverables"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </Field>
            {errors.deliverables?.message ? (
              <ErrorText msg={errors.deliverables.message} />
            ) : null}

            {/* Amount + Status */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="Payable Amount">
                  <Controller
                    control={control}
                    name="payableAmount"
                    render={({ field: { value, onChange } }) => (
                      <Input
                        placeholder="Enter Amount"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="numeric"
                      />
                    )}
                  />
                </Field>
                {errors.payableAmount?.message ? (
                  <ErrorText msg={errors.payableAmount.message} />
                ) : null}
              </View>

              <View className="flex-1">
                <Field label="Status">
                  <Controller
                    control={control}
                    name="status"
                    render={({ field: { value, onChange } }) => (
                      <View>
                        <Pressable
                          disabled={loading}
                          onPress={() => setShowStatusMenu((s) => !s)}
                          className="flex-row items-center justify-between bg-gray-200 rounded-2xl px-4 py-4"
                        >
                          <Text className="text-gray-700 font-kumbh">
                            {capitalize(value)}
                          </Text>
                          <ChevronDown size={18} color="#111827" />
                        </Pressable>

                        {showStatusMenu ? (
                          <View className="mt-2 rounded-2xl bg-white border border-gray-200 overflow-hidden">
                            {STATUS_OPTIONS.map((opt) => (
                              <Pressable
                                key={opt}
                                onPress={() => {
                                  onChange(opt);
                                  setShowStatusMenu(false);
                                }}
                                className={clsx(
                                  "px-4 py-3",
                                  value === opt ? "bg-primary-50" : "bg-white"
                                )}
                              >
                                <Text
                                  className={clsx(
                                    "font-kumbh",
                                    value === opt
                                      ? "text-primary-700"
                                      : "text-text"
                                  )}
                                >
                                  {capitalize(opt)}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    )}
                  />
                </Field>
                {errors.status?.message ? (
                  <ErrorText msg={errors.status.message} />
                ) : null}
              </View>
            </View>

            {/* Bottom actions – left as requested (disabled while loading) */}
            {/* <View className="mt-8">
              <Pressable
                disabled={loading}
                className={clsx(
                  "flex-row items-center justify-center gap-3 rounded-2xl py-4 active:opacity-90",
                  loading ? "bg-gray-300" : "bg-primary-500"
                )}
              >
                <View className="w-6 h-6 rounded-md bg-primary-400 items-center justify-center">
                  <Bell size={14} color="white" />
                </View>
                <Text className="text-white font-kumbhBold">Send Invoice</Text>
              </Pressable>

              <Pressable
                disabled={loading}
                className={clsx(
                  "mt-3 rounded-2xl py-4 items-center",
                  "border",
                  loading ? "border-gray-300" : "border-primary-300"
                )}
              >
                <Text
                  className={clsx(
                    "font-kumbhBold",
                    loading ? "text-gray-400" : "text-primary-700"
                  )}
                >
                  Generate Invoice
                </Text>
              </Pressable>
            </View> */}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function ErrorText({ msg }: { msg: string }) {
  return <Text className="text-xs text-red-600 mt-1">{msg}</Text>;
}
