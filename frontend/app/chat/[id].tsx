// app/chat/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { socket } from "@/services/socket";

interface Sender {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: "TEXT" | "OFFER" | "SYSTEM";
  content?: string;
  offerAmount?: number;
  offerStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  sender?: Sender;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [dbUser, setDbUser] = useState<{ id: string } | null>(null);
  const { getToken, userId : clerkUserId } = useAuth();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerValue, setOfferValue] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    const fetchMessagesAndConnect = async () => {
      try {
        const token = await getToken();

        // Fetch message history
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/chat/${chatId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }

        // 👈 CRITICAL FIX: Always update auth and force a fresh connection
        socket.auth = { token };

        // If a ghost connection exists from a previous login, kill it
        if (socket.connected) {
          socket.disconnect();
        }

        // Connect fresh with the current user's token
        socket.connect();

        socket.emit("join_room", chatId);

        socket.on("receive_message", (newMessage: Message) => {
          setMessages((prev) => [newMessage, ...prev]);
        });
      } catch (err) {
        console.error("Error fetching messages or connecting socket:", err);
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchMessagesAndConnect();
    }

    return () => {
      socket.off("receive_message");
    };
  }, [chatId]);

  const handleRespondToOffer = async (
    messageId: string,
    status: "ACCEPTED" | "REJECTED",
  ) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/chat/messages/${messageId}/offer-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (res.ok) {
        const updatedMessage = await res.json();
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? updatedMessage : msg)),
        );
      }
    } catch (err) {
      console.error("Error responding to offer:", err);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !chatId) return;

    const payload = {
      chatId,
      content: inputText.trim(),
      type: "TEXT",
      // senderId removed - backend handles it securely!
    };

    socket.emit("send_message", payload);
    setInputText("");
  };

  const handleSendOffer = () => {
    const amount = parseFloat(offerValue);
    if (isNaN(amount) || amount <= 0 || !chatId) {
      Alert.alert("Invalid Amount", "Please enter a valid offer price.");
      return;
    }

    const payload = {
      chatId,
      content: `Offered ₹${amount}`,
      type: "OFFER",
      offerAmount: amount,
      // senderId removed - backend handles it securely!
    };

    socket.emit("send_message", payload);
    setOfferValue("");
    setIsOfferModalOpen(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const statusStyles: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: "bg-amber-200/70", text: "text-amber-900" },
    ACCEPTED: { bg: "bg-emerald-200/70", text: "text-emerald-900" },
    REJECTED: { bg: "bg-rose-200/70", text: "text-rose-900" },
  };

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      edges={["top"]}
    >
      {/* Header */}
      <View
        className="mb-15 flex-row items-center justify-between px-3 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-1 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
        >
          <Ionicons name="arrow-back" size={22} color="#4f46e5" />
        </TouchableOpacity>

        <View className="flex-1 ml-1">
          <Text className="font-bold text-base text-slate-900 dark:text-white">
            Chat
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500">
            {messages.length > 0 ? "Active conversation" : "Say hello 👋"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsOfferModalOpen(true)}
          className="flex-row items-center bg-indigo-50 dark:bg-indigo-950/60 px-3 py-2 rounded-full border border-indigo-200 dark:border-indigo-800"
        >
          <Ionicons name="pricetag-outline" size={14} color="#4f46e5" />
          <Text className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs ml-1">
            Offer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body + Input, keyboard-aware */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="min-h-[80%]"
        keyboardVerticalOffset={0}
      >
        {/* Message area takes all remaining space above the input */}
        <View className="flex-1">
          {messages.length === 0 ? (
            <View className="flex-1 justify-center items-center px-10">
              <View className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 justify-center items-center mb-3">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={28}
                  color="#4f46e5"
                />
              </View>
              <Text className="text-slate-500 dark:text-slate-400 text-center text-sm">
                No messages yet. Start the conversation or make an offer.
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              inverted
              contentContainerStyle={{ padding: 14, paddingBottom: 6 }}
              renderItem={({ item }) => {
                const isMe = item.senderId === dbUser?.id || item.senderId === clerkUserId;
                const isOffer = item.type === "OFFER";
                const status = item.offerStatus
                  ? statusStyles[item.offerStatus]
                  : null;

                return (
                  <View className={`w-full flex-row ${isMe ? "justify-end" : "justify-start"} mb-2.5`}>
                  <View
                    className={`mb-2.5 max-w-[78%] px-4 py-3 rounded-2xl ${
                      isMe
                        ? isOffer
                          ? "bg-amber-500 self-end rounded-br-md"
                          : "bg-indigo-600 self-end rounded-br-md"
                        : isOffer
                          ? "bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 self-start rounded-bl-md"
                          : "bg-white dark:bg-slate-900 self-start rounded-bl-md border border-slate-200 dark:border-slate-800"
                    }`}
                    style={{
                      shadowColor: "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: 1,
                    }}
                  >
                    {isOffer ? (
                      <View className="w-full">
                        <View className="flex-row items-center mb-1.5">
                          <Ionicons
                            name="pricetag"
                            size={13}
                            color={isMe ? "#fff7ed" : "#d97706"}
                          />
                          <Text
                            className={`font-bold text-[10px] uppercase tracking-wider ml-1 ${
                              isMe
                                ? "text-amber-50"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            Price Offer
                          </Text>
                        </View>

                        <Text
                          className={`text-2xl font-black mb-1 ${
                            isMe
                              ? "text-white"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          ₹{item.offerAmount}
                        </Text>

                        {item.content && (
                          <Text
                            className={`text-sm mb-2 ${
                              isMe
                                ? "text-amber-50"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {item.content}
                          </Text>
                        )}

                        {status && (
                          <View
                            className={`self-start px-2 py-0.5 rounded-full mb-1 ${status.bg}`}
                          >
                            <Text
                              className={`text-[10px] font-bold uppercase ${status.text}`}
                            >
                              {item.offerStatus}
                            </Text>
                          </View>
                        )}

                        {!isMe && item.offerStatus === "PENDING" && (
                          <View className="flex-row gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <TouchableOpacity
                              onPress={() =>
                                handleRespondToOffer(item.id, "REJECTED")
                              }
                              className="flex-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 py-2 rounded-lg items-center"
                            >
                              <Text className="text-rose-600 dark:text-rose-400 font-bold text-xs">
                                Decline
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                handleRespondToOffer(item.id, "ACCEPTED")
                              }
                              className="flex-1 bg-emerald-600 py-2 rounded-lg items-center"
                            >
                              <Text className="text-white font-bold text-xs">
                                Accept
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        <Text
                          className={`text-[10px] mt-1.5 ${
                            isMe ? "text-amber-100/80" : "text-slate-400"
                          }`}
                        >
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                    ) : (
                      <View>
                        <Text
                          className={`text-[15px] leading-5 ${
                            isMe
                              ? "text-white"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {item.content}
                        </Text>
                        <Text
                          className={`text-[10px] mt-1 self-end ${
                            isMe ? "text-indigo-100/80" : "text-slate-400"
                          }`}
                        >
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                    )}
                  </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* Input Bar — always pinned to bottom */}
        <View
          className="flex-row items-center px-3 pt-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        >
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 rounded-3xl mr-2 text-[15px] max-h-24"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            className={`w-11 h-11 rounded-full justify-center items-center ${
              inputText.trim()
                ? "bg-indigo-600"
                : "bg-slate-200 dark:bg-slate-800"
            }`}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? "white" : "#94a3b8"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Make Offer Modal */}
      <Modal visible={isOfferModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-900 p-6 pb-8 rounded-t-3xl">
            <View className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full self-center mb-4" />

            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Make a Price Offer
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Enter the amount you'd like to offer the seller.
            </Text>

            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5 px-4 border border-slate-200 dark:border-slate-700">
              <Text className="text-xl font-bold text-slate-400 mr-1">₹</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={offerValue}
                onChangeText={setOfferValue}
                autoFocus
                className="flex-1 text-slate-900 dark:text-white py-4 text-xl font-bold"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setIsOfferModalOpen(false);
                  setOfferValue("");
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl items-center"
              >
                <Text className="font-bold text-slate-700 dark:text-slate-300">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendOffer}
                className="flex-1 bg-indigo-600 py-4 rounded-2xl items-center"
              >
                <Text className="font-bold text-white">Send Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
