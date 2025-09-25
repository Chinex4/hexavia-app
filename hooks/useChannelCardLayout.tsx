import { useMemo } from "react";
import { Dimensions } from "react-native";

export default function useChannelCardLayout() {
  const { width: SCREEN_WIDTH } = Dimensions.get("window");

  return useMemo(() => {
    const PAGE_PAD = 16;
    const GAP = 10;
    const PEEK = 20;

    const CARD_WIDTH = SCREEN_WIDTH - PAGE_PAD * 2 - PEEK;
    const SNAP = CARD_WIDTH + GAP;

    return {
      SCREEN_WIDTH,
      PAGE_PAD,
      GAP,
      PEEK,
      CARD_WIDTH,
      SNAP,
    };
  }, [SCREEN_WIDTH]);
}
