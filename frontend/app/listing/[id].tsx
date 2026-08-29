import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import Animated from "react-native-reanimated";

export default function ListingDetailScreen() {
  const { getToken } = useAuth();
  const { id, initialTitle, initialPrice, initialImage } =
    useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/items/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          },
        );
        if (!res.ok) throw new Error("Failed to fetch item details");
        const data = await res.json();
        setItem(data);
      } catch (err) {
        console.error("Error fetching item details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItem();
  }, [id]);

  const handleContactSeller = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId: item.id,
          sellerId: item.seller.id,
        }),
      });

      if (!res.ok) throw new Error("Could not create chat");

      const chatData = await res.json();
      router.push(`/chat/${chatData.id}` as Href);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not start conversation with seller.");
    }
  };

  // 2. RESOLVE DATA SAFELY (Prefer loaded API data, fallback to initial params)
  const displayImage =
    item?.images?.[0] ||
    item?.imageUrl ||
    initialImage ||
    "https://via.placeholder.com/400";
  const displayTitle = item?.title || initialTitle || "Loading...";
  const displayPrice = item?.price || initialPrice || "...";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"
        >
          <Ionicons name="arrow-back" size={22} color="#4f46e5" />
        </TouchableOpacity>
        <Text className="font-semibold text-base text-slate-800 dark:text-slate-100">
          Listing Details
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="h-screen"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 3. HERO IMAGE FLY-IN (Using Animated.Image + Shared Tag) */}
        <Animated.Image
          {...({ sharedTransitionTag: `image-${id}` } as any)}
          source={{ uri: displayImage as string }}
          className="w-full h-72 bg-slate-200"
          resizeMode="cover"
        />

        <View className="p-5">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white flex-1 pr-2">
              {displayTitle}
            </Text>
            <Text className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              ₹{displayPrice}
            </Text>
          </View>

          {/* 4. CONDITIONAL RENDER FOR THE REST OF THE DATA */}
          {loading ? (
            <View className="mt-4">
              <View className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full mb-6" />
              <View className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md mb-4" />
              <View className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-md mb-2" />
              <View className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-md mb-6" />
              <View className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </View>
          ) : (
            <>
              {item?.category?.name && (
                <View className="self-start bg-indigo-100 dark:bg-indigo-950/60 px-3 py-1 rounded-full mb-4">
                  <Text className="text-indigo-700 dark:text-indigo-300 font-medium text-xs">
                    {item.category.name}
                  </Text>
                </View>
              )}

              <View className="h-px bg-slate-200 dark:bg-slate-800 my-3" />

              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Description
              </Text>
              <Text className="text-slate-700 dark:text-slate-300 text-base leading-relaxed mb-6">
                {item?.description || "No description provided."}
              </Text>

              {item?.seller && (
                <View className="mt-2 mb-20 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 justify-center items-center mr-3">
                    <Ionicons name="person" size={20} color="#4f46e5" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.seller.name || "Campus Seller"}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">
                      {item.seller.email || "Verified Student"}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <View className="absolute bottom-5 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pb-30">
        <TouchableOpacity
          className={`py-4 rounded-xl flex-row justify-center items-center ${loading ? "bg-indigo-400" : "bg-indigo-600"}`}
          onPress={handleContactSeller}
          disabled={loading}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color="white"
          />
          <Text className="text-white font-bold text-lg ml-2">
            {loading ? "Loading..." : "Contact Seller"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
