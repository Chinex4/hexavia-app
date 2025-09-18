import { Image, Pressable, Text, View } from "react-native";
import MemberStack from "../MemberStack";
import { useRouter } from "expo-router";

interface Channel {
  id: string;
  title: string;
  subtitle: string;
  logo?: string;
  color: string;
  memberAvatars: string[];
}

const ChannelCard = ({
  item,
  width,
  gap,
}: {
  item: Channel;
  width: number;
  gap: number;
}) => {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/(staff)/channels")}
      style={{ width, marginRight: gap }}
    >
      <View
        className="rounded-2xl p-4"
        style={{
          backgroundColor: item.color,
          height: 200,
          justifyContent: "space-between",
        }}
      >
        <View className="flex-row justify-between">
          <Text className="text-white text-3xl font-kumbhBold">
            {item.title}
          </Text>
          <View className="size-16 rounded-full overflow-hidden border border-white/40">
            {item.logo ? (
              <Image source={{ uri: item.logo }} className="h-full w-full" />
            ) : (
              <View className="h-full w-full bg-white/30" />
            )}
          </View>
        </View>
        <View className="mt-4 flex-row justify-between items-end">
          <Text className="text-white/90 mt-4 leading-5 text-[13px] font-kumbh w-44">
            {item.subtitle}
          </Text>
          <MemberStack avatars={item.memberAvatars} />
        </View>
      </View>
    </Pressable>
  );
};

export default ChannelCard;
