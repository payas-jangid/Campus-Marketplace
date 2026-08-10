// app/listing/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";

export default function ListingDetailScreen() {
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams();
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

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

      // Navigate to the chat screen passing the chatId
      router.push(`/chat/${chatData.id}` as Href);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not start conversation with seller.");
    }
  };

  const imageList =
    item?.images && Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : item?.imageUrl
        ? [item.imageUrl]
        : ["https://via.placeholder.com/400"];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      {/* Back Button Header */}
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
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Simple Main Image Display */}
        <Image
          source={{ uri: imageList[0] }}
          className="w-full h-72 bg-slate-200"
          resizeMode="cover"
        />

        {/* Details Content */}
        <View className="p-5">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white flex-1 pr-2">
              {item?.title || "Untitled Item"}
            </Text>
            <Text className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              ₹{item?.price}
            </Text>
          </View>

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

          {/* Seller Information */}
          {item?.seller && (
            <View className="mt-2 mb-[80px] p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex-row items-center">
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
        </View>
      </ScrollView>

      {/* Action Footer Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pb-35">
        <TouchableOpacity
          className="bg-indigo-600 py-4 rounded-xl flex-row justify-center items-center"
          onPress={handleContactSeller}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color="white"
          />
          <Text className="text-white font-bold text-lg ml-2">
            Contact Seller
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
