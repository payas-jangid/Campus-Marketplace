// app/listing/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/items/${id}`,
        );
        const data = await res.json();
        setItem(data);
      } catch (err) {
        console.error("Error fetching item details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScrollView>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-4 left-4 z-10 bg-black/40 p-2 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Image
          source={{ uri: item?.imageUrl }}
          className="w-full h-80 bg-slate-200"
        />

        <View className="p-5">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
            {item?.title}
          </Text>
          <Text className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{item?.price}
          </Text>

          <View className="h-px bg-slate-200 dark:bg-slate-800 my-4" />

          <Text className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Description
          </Text>
          <Text className="text-slate-700 dark:text-slate-300 text-base leading-relaxed">
            {item?.description || "No description provided."}
          </Text>
        </View>
      </ScrollView>

      {/* Footer Contact Button */}
      <View className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <TouchableOpacity className="bg-indigo-600 py-4 rounded-xl flex-row justify-center items-center">
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
