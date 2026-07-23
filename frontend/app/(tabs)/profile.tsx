// app/(tabs)/profile.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useClerk } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 items-center shadow-sm border border-slate-100 dark:border-slate-700">
          <Image
            source={{ uri: user?.imageUrl }}
            className="w-20 h-20 rounded-full mb-3"
          />
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {user?.fullName || "Campus Student"}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        {/* Action Options */}
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-2 mt-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <TouchableOpacity className="flex-row items-center p-3 border-b border-slate-100 dark:border-slate-700">
            <Ionicons name="pricetags-outline" size={22} color="#4f46e5" />
            <Text className="flex-1 ml-3 font-semibold text-slate-800 dark:text-slate-200">
              My Active Listings
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-3">
            <Ionicons name="chatbubbles-outline" size={22} color="#4f46e5" />
            <Text className="flex-1 ml-3 font-semibold text-slate-800 dark:text-slate-200">
              Saved Messages
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={() => signOut()}
          className="bg-red-50 dark:bg-red-900/20 py-4 rounded-xl mt-8 border border-red-200 dark:border-red-800/40"
        >
          <Text className="text-red-600 dark:text-red-400 text-center font-bold text-base">
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
