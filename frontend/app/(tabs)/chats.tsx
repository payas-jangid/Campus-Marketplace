// app/(tabs)/chats.tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, Href } from "expo-router";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";

interface UserInfo {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface ItemInfo {
  id: string;
  title: string;
  price: number;
  images?: string[];
  status: string;
}

interface MessagePreview {
  content?: string;
  type: "TEXT" | "OFFER" | "SYSTEM";
  createdAt: string;
}

interface ChatThread {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  item: ItemInfo;
  seller: UserInfo;
  buyer: UserInfo;
  messages: MessagePreview[];
}

export default function InboxScreen() {
  const router = useRouter();
  const { getToken, userId } = useAuth();

  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chat`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch inbox items whenever user navigates back to this tab
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      edges={["top"]}
    >
      {/* Header */}
      <View className="px-5 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-row justify-between items-center">
        <Text className="text-2xl font-black text-slate-900 dark:text-white">
          Inbox 💬
        </Text>
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4f46e5"]}
          />
        }
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <View className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={32} color="#94a3b8" />
            </View>
            <Text className="text-slate-700 dark:text-slate-300 font-bold text-lg mb-1">
              No conversations yet
            </Text>
            <Text className="text-slate-400 text-center text-sm px-8">
              Message a seller from any listing to start negotiating or asking
              questions!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUserSeller = item.sellerId === userId;
          const otherParty = isUserSeller ? item.buyer : item.seller;
          const lastMessage = item.messages?.[0];

          // Format last message content
          let previewText = "Conversation started";
          if (lastMessage) {
            if (lastMessage.type === "OFFER") {
              previewText = `🏷️ Price Offer`;
            } else if (lastMessage.content) {
              previewText = lastMessage.content;
            }
          }

          const itemImage =
            item.item?.images && item.item.images.length > 0
              ? item.item.images[0]
              : "https://via.placeholder.com/100";

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/chat/${item.id}` as Href)}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 border border-slate-200 dark:border-slate-700 flex-row items-center"
            >
              {/* Item Thumbnail */}
              <Image
                source={{ uri: itemImage }}
                className="w-16 h-16 rounded-xl bg-slate-100 mr-3.5"
                resizeMode="cover"
              />

              {/* Chat Info */}
              <View className="flex-1 justify-center">
                <View className="flex-row items-center justify-between mb-1">
                  <Text
                    className="font-bold text-base text-slate-900 dark:text-white flex-1 mr-2"
                    numberOfLines={1}
                  >
                    {item.item?.title || "Listing"}
                  </Text>
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      isUserSeller
                        ? "bg-amber-100 dark:bg-amber-950"
                        : "bg-indigo-100 dark:bg-indigo-950"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${
                        isUserSeller
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-indigo-700 dark:text-indigo-400"
                      }`}
                    >
                      {isUserSeller ? "Selling" : "Buying"}
                    </Text>
                  </View>
                </View>

                {/* Other User Name */}
                <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  With {otherParty?.name || "Campus Member"}
                </Text>

                {/* Last Message Preview */}
                <Text
                  className="text-sm text-slate-600 dark:text-slate-300"
                  numberOfLines={1}
                >
                  {previewText}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
