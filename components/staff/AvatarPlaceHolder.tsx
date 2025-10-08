import { Image, View } from "react-native";

const AvatarPlaceholder = ({ avatar }: { avatar: any }) => {
  return (
    <View className="h-12 w-12 rounded-full bg-gray-200">
      {avatar ? (
        <Image
          source={{
            uri: avatar,
          }}
          className="h-12 w-12 rounded-full"
          resizeMode="cover"
        />
      ) : (
        <Image
          source={require("@/assets/images/default.jpg")}
          className="h-12 w-12 rounded-full"
          resizeMode="cover"
        />
      )}
    </View>
  );
};
export default AvatarPlaceholder;
