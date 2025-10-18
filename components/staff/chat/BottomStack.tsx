import React from "react";
import { Platform, View } from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  tray?: React.ReactNode;
  composer: React.ReactNode;
  isAdmin: boolean;
};
export default function BottomStack({ tray, composer, isAdmin = false }: Props) {
  const { bottom } = useSafeAreaInsets();
  const kb = useAnimatedKeyboard();

  const animatedStyle = useAnimatedStyle(() => {
    const h = kb.height.value;
    if (Platform.OS === "ios") {
      const offset = Math.max(-45, h - 110);
      return {
        transform: [{ translateY: withTiming(-offset, { duration: 0 }) }],
      };
    }
    const needsTranslate = h > 0;
    const translateY = needsTranslate ? -h + (isAdmin ? 0 : 75) : 0;

    return {
      transform: [{ translateY: withTiming(translateY, { duration: 0 }) }],
    };
  }, [bottom]);

  return (
    <Animated.View
      style={[
        { position: "absolute", left: 0, right: 0, bottom: 0 },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      {tray ? <View pointerEvents="auto">{tray}</View> : null}
      <View
        style={{ paddingBottom: bottom > 0 ? bottom : 0 }}
        pointerEvents="auto"
      >
        {composer}
      </View>
    </Animated.View>
  );
}
