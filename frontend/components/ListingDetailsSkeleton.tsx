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

export default function ListingDetailsSkeleton() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-width, width]);
    return {
      transform: [{ translateX }],
    };
  });

  // Helper to easily create shimmering blocks of any size
  const ShimmerBlock = ({ className }: { className: string }) => (
    <View
      className={`bg-slate-200 dark:bg-slate-800 overflow-hidden relative ${className}`}
    >
      <Animated.View className="absolute inset-0" style={animatedStyle}>
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="w-full h-full"
        />
      </Animated.View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Hero Image Skeleton */}
      <ShimmerBlock className="h-80 w-full rounded-b-3xl" />

      <View className="p-5">
        {/* Category Pill */}
        <ShimmerBlock className="h-6 w-1/4 rounded-full mb-4" />

        {/* Title */}
        <ShimmerBlock className="h-8 w-3/4 rounded-md mb-3" />

        {/* Price */}
        <ShimmerBlock className="h-7 w-2/5 rounded-md mb-6" />

        {/* Divider */}
        <View className="h-px bg-slate-200 dark:bg-slate-800 w-full mb-6" />

        {/* Description Section */}
        <ShimmerBlock className="h-5 w-1/3 rounded-md mb-4" />
        <ShimmerBlock className="h-4 w-full rounded-md mb-2" />
        <ShimmerBlock className="h-4 w-full rounded-md mb-2" />
        <ShimmerBlock className="h-4 w-5/6 rounded-md mb-6" />

        {/* Seller Info Box */}
        <View className="flex-row items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
          <ShimmerBlock className="h-12 w-12 rounded-full mr-4" />
          <View className="flex-1">
            <ShimmerBlock className="h-4 w-1/2 rounded-md mb-2" />
            <ShimmerBlock className="h-3 w-1/3 rounded-md" />
          </View>
        </View>
      </View>
    </View>
  );
}
