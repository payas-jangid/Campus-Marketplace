// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Item = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  category: string;
  createdAt: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/items`,
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      setItems(Array.isArray(data) ? data : []); // Ensures data is an array
    } catch (err) {
      console.error("Error fetching items:", err);
      setItems([]); // Fallback to empty list so ListEmptyComponent renders
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter((item) =>
    item.title?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 pt-2">
      {/* Header & Search */}
      <View className="mb-4">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Campus Market 🛒
        </Text>
        <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-xl px-3 py-2 mt-3 shadow-sm border border-slate-200 dark:border-slate-700">
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            placeholder="Search textbooks, electronics..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            className="flex-1 ml-2 text-slate-900 dark:text-white"
          />
        </View>
      </View>

      {/* Feed Grid */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchItems();
              }}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/listing/${item.id}` as Href)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 mb-4 shadow-sm w-[48%] border border-slate-100 dark:border-slate-700"
            >
              <Image
                source={{ uri: item.imageUrl }}
                className="w-full h-36 rounded-xl bg-slate-200"
                resizeMode="cover"
              />
              <Text
                numberOfLines={1}
                className="font-semibold text-slate-900 dark:text-white mt-2 text-base"
              >
                {item.title}
              </Text>
              <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-lg mt-0.5">
                ₹{item.price}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons name="basket-outline" size={48} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 font-medium text-base mt-2">
                No items found.
              </Text>
              <Text className="text-slate-400 text-xs mt-1">
                Be the first to list an item on Campus Market!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
