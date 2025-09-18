import { Image, Pressable, Text, View } from "react-native";
const TaskCard = () => {
  return (
    <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-6">
      <Text className="text-3xl font-semibold text-black font-kumbh">Task</Text>

      <View className="items-center justify-center py-6">
        <Image
          source={require("../../assets/images/task.png")}
          resizeMode="contain"
        />
      </View>

      <Pressable
        className="mt-2 w-full rounded-xl bg-gray-300 py-4 items-center"
        onPress={() => {}}
        disabled={true}
      >
        <Text className="text-white font-semibold">View Task</Text>
      </Pressable>
    </View>
  );
};
export default TaskCard;
