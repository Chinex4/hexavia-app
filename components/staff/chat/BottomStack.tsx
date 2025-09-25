import React from "react";
import { Platform, View } from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = { tray?: React.ReactNode; composer: React.ReactNode };

/**
 * Notes:
 * - We subtract the bottom safe-area on iOS to remove the visible gap.
 * - On Android:
 *    • If your window is in `adjustResize` mode, kb.height will usually be 0 and
 *      the absolute bottom of this view is already pushed up by the system, so no translate needed.
 *    • If not resizing, kb.height > 0 and we translate by that height to sit above the keyboard.
 */
export default function BottomStack({ tray, composer }: Props) {
  const { bottom } = useSafeAreaInsets();
  const kb = useAnimatedKeyboard(); // { height, state, progress }

  const animatedStyle = useAnimatedStyle(() => {
    const h = kb.height.value;

    // iOS: keyboard overlaps content; move view up by (keyboard - safeAreaBottom)
    if (Platform.OS === "ios") {
      const offset = Math.max(-45, h - 110);
      return {
        transform: [{ translateY: withTiming(-offset, { duration: 0 }) }],
      };
    }

    // ANDROID:
    // If window is set to adjustResize, h is often 0 because layout shrinks;
    // in that case, we don't translate at all.
    // If not resizing (h > 0), translate by keyboard height.
    const needsTranslate = h > 0;
    const translateY = needsTranslate ? -h + 75 : 0;

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
        // Keep the comfy padding for home indicator; it's ignored when keyboard shows
        style={{ paddingBottom: bottom > 0 ? bottom : 0 }}
        pointerEvents="auto"
      >
        {composer}
      </View>
    </Animated.View>
  );
}
