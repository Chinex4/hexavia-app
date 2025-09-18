import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

const SanctionCard = () => {
  const router = useRouter();
  
  return (
    <View
      className="mt-6 rounded-2xl px-5 py-8"
      style={{ backgroundColor: "#EF476F" }}
    >
      <Text className="text-white text-3xl font-kumbh">Sanction Grid</Text>
      <Text className="text-white/90 mt-1 font-kumbh">Accountability &amp; Compliance</Text>

      <Pressable
        className="mt-16 rounded-xl bg-black/80 py-4 items-center"
        onPress={() => router.push("/(staff)/sanctions")}
      >
        <Text className="text-white font-kumbh">View Sanctions</Text>
      </Pressable>
    </View>
  );
};

export default SanctionCard;