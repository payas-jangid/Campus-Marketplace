import React, { useEffect } from "react";
import { View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 24;

export default function ItemSkeleton() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-CARD_WIDTH, CARD_WIDTH],
    );
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      className="m-2 p-2 bg-gray-200 dark:bg-zinc-800 rounded-2xl overflow-hidden"
      style={{ width: CARD_WIDTH }}
    >
      <View className="h-36 bg-gray-300 dark:bg-zinc-700 rounded-xl overflow-hidden relative">
        <Animated.View className="absolute inset-0" style={animatedStyle}>
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full h-full"
          />
        </Animated.View>
      </View>

      <View className="h-3.5 bg-gray-300 dark:bg-zinc-700 rounded-md mt-3 w-3/5" />
      <View className="h-4 bg-gray-300 dark:bg-zinc-700 rounded-md mt-2 w-4/5" />
      <View className="h-5 bg-gray-300 dark:bg-zinc-700 rounded-md mt-2 w-1/3" />
    </View>
  );
}
