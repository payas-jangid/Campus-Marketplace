// app/my-listings.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";

type MyItem = {
  id: string;
  title: string;
  price: number;
  status: string;
  images: string[];
  createdAt: string;
};

export default function MyListingsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [items, setItems] = useState<MyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyItems = async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/items/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (error) {
        console.error("Error fetching my listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyItems();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "AVAILABLE" ? "SOLD" : "AVAILABLE";
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/items/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (res.ok) {
        // Update the item in our local state so the UI changes instantly
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to permanently delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const res = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/items/${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                },
              );

              if (res.ok) {
                // Remove the item from local state
                setItems((prev) => prev.filter((item) => item.id !== id));
              }
            } catch (error) {
              console.error("Error deleting item:", error);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      edges={["top"]}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text className="font-bold text-lg ml-2 text-slate-900 dark:text-white">
          My Active Listings
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16,paddingBottom: 80 }}
        renderItem={({ item }) => {
          const imageUrl =
            item.images?.[0] || "https://via.placeholder.com/150";

          return (
            <TouchableOpacity
              onPress={() => router.push(`/listing/${item.id}`)}
              className="flex-row bg-white dark:bg-slate-800 p-3 rounded-2xl mb-4 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <Image
                source={{ uri: imageUrl }}
                className="w-24 h-24 rounded-xl bg-slate-200"
                resizeMode="cover"
              />
              <View className="flex-1 ml-4 justify-center">
                <View className="flex-row justify-between items-start">
                  <Text
                    className="font-bold text-base text-slate-900 dark:text-white flex-1 mr-2"
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  {/* Status Badge */}
                  <View
                    className={`px-2 py-1 rounded-md ${item.status === "AVAILABLE" ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-slate-100 dark:bg-slate-700"}`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${item.status === "AVAILABLE" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-lg mt-2">
                  ₹{item.price}
                </Text>

                <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <TouchableOpacity
                    onPress={() => handleToggleStatus(item.id, item.status)}
                    className={`flex-1 py-1.5 rounded-lg border ${
                      item.status === "AVAILABLE"
                        ? "bg-slate-50 border-slate-200"
                        : "bg-emerald-50 border-emerald-200"
                    } items-center`}
                  >
                    <Text
                      className={`font-semibold text-xs ${
                        item.status === "AVAILABLE"
                          ? "text-slate-600"
                          : "text-emerald-700"
                      }`}
                    >
                      {item.status === "AVAILABLE"
                        ? "Mark Sold"
                        : "Mark Available"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    className="py-1.5 px-3 rounded-lg bg-rose-50 border border-rose-200 items-center"
                  >
                    <Ionicons name="trash-outline" size={16} color="#e11d48" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons name="pricetags-outline" size={48} color="#94a3b8" />
            <Text className="text-slate-500 font-medium text-base mt-4">
              You have no active listings.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
