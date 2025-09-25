import { Task } from "@/features/staff/types";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import TaskDetailModal from "./modals/TaskDetailModal";

export default function TaskCard({
  task,
  openDetail = false,
}: {
  task: Task;
  openDetail?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setShow(true)}
        className="rounded-2xl border px-4 py-4"
        style={{ borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}
      >
        <Text className="font-kumbh text-[#111827] text-[15px]">
          {task.title}
        </Text>
        {task.description ? (
          <Text className="font-kumbh text-[#6B7280] mt-1">
            {task.description}
          </Text>
        ) : null}
        <View className="flex-row mt-3" style={{ gap: 10 }}>
          <Text className="font-kumbh text-[12px] text-[#6B7280]">
            Channel: {task.channelCode}
          </Text>
          <Text className="font-kumbh text-[12px] text-[#6B7280]">
            Status: {task.status.replace("_", " ")}
          </Text>
        </View>
      </Pressable>

      <TaskDetailModal
        visible={show}
        onClose={() => setShow(false)}
        task={task}
      />
    </>
  );
}
