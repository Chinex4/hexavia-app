import { Image, View } from "react-native";

const AvatarPlaceholder = ({ avatar }: { avatar: any }) => (
  <View className="h-12 w-12 rounded-full bg-gray-200">
    <Image
      source={{
        uri:
          avatar ||
          "https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png",
      }}
      className="h-12 w-12 rounded-full"
      resizeMode="cover"
    />
  </View>
);
export default AvatarPlaceholder;
