import { Image, View } from "react-native";

const AvatarPlaceholder = ({ avatar }: { avatar: any }) => (
  <View className="h-12 w-12 rounded-full bg-gray-200">
    <Image
      source={{ uri: avatar || "https://i.pravatar.cc/100?img=1" }}
      className="h-12 w-12 rounded-full"
      resizeMode="cover"
    />
  </View>
);
export default AvatarPlaceholder;
