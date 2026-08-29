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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";
import { useItemStore } from "@/store/useItemStore";
import ItemSkeleton from "@/components/ItemSkeleton";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const { items, loading, fetchItems } = useItemStore();

  useEffect(() => {
    if (items.length === 0) {
      fetchItems();
    }
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/items/categories`,
        );

        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const filteredItems = items.filter((item) => {
    const matchSearches = item.title
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = categoryId ? item.category.id === categoryId : true;
    return matchSearches && matchesCategory;
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 pt-2">
      {/* Header & Search */}
      <View className="p-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl text-center font-bold text-slate-900 dark:text-white">
            Campus Market
          </Text>
          <Ionicons name="binoculars" size={20} color="white" className="mr-2"/>
        </View>

        <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-xl px-3 py-2 mt-3 mb-3 shadow-sm border border-slate-200 dark:border-slate-700">
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            placeholder="Search textbooks, electronics..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            className="flex-1 ml-2 text-slate-900 dark:text-white"
          />
        </View>
        <ScrollView
          key={categories.length > 0 ? "loaded" : "empty"}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          style={{ height: 44 }}
          contentContainerStyle={{ alignItems: "center" }}
        >
          {categories.map((cat) => {
            const isSelected = categoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() =>
                  setCategoryId(categoryId === cat.id ? "" : cat.id)
                }
                className={`px-4 py-2 rounded-full mr-2 border ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-600"
                    : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                }`}
              >
                <Text
                  className={`font-medium ${
                    isSelected
                      ? "text-white"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View className="flex-row flex-wrap justify-between">
          {[...Array(6)].map((_, i) => (
            <ItemSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 150 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item, index }) => {
            const imageUrl =
              Array.isArray(item.images) && item.images.length > 0
                ? item.images[0]
                : "https://via.placeholder.com/300";

            return (
              <Animated.View
                entering={FadeInUp.delay(index * 60)
                  .springify()
                  .damping(35)}
                layout={Layout.springify()}
                className="w-[48%] mb-4"
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: `/listing/${item.id}`,
                      params:{
                        initialTitle: item.title,
                        initialPrice: item.price,
                        initialImage: imageUrl,
                      }
                    } as any)
                  }
                  className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <Animated.Image
                    source={{ uri: imageUrl }}
                    className="w-full h-36 rounded-xl bg-slate-200 dark:bg-slate-700"
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
              </Animated.View>
            );
          }}
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
