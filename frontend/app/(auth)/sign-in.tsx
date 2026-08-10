// app/(auth)/sign-in.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";

// Conditionally require AuthView ONLY on native platforms to prevent web crash
let AuthView: any = null;
if (Platform.OS !== "web") {
  try {
    AuthView = require("@clerk/expo/native").AuthView;
  } catch (e) {
    AuthView = null;
  }
}

export default function SignInScreen() {
  // Native Mobile Rendering (iOS / Android)
  if (Platform.OS !== "web" && AuthView) {
    return (
      <View className="flex-1 pt-10 bg-white dark:bg-slate-900">
        <AuthView isDismissible={false} />
      </View>
    );
  }

  // Web Fallback using useClerk()
  const clerk = useClerk() as any;
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!clerk || !clerk.client) return;
    setLoading(true);

    try {
      const signInAttempt = await clerk.client.signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await clerk.setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        console.log("Sign in incomplete status:", signInAttempt);
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      const errorMessage =
        err?.errors?.[0]?.message || err?.message || "Failed to sign in";
      Alert.alert("Sign In Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-6 bg-slate-50 dark:bg-slate-900">
      <View className="w-full max-w-sm bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">
          Campus Market 🎓
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
          Sign in to your account
        </Text>

        <Text className="text-xs font-bold text-slate-500 uppercase mb-1">
          Email Address
        </Text>
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="student@example.com"
          placeholderTextColor="#94a3b8"
          onChangeText={setEmailAddress}
          className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-xl mb-4 border border-slate-200 dark:border-slate-700"
        />

        <Text className="text-xs font-bold text-slate-500 uppercase mb-1">
          Password
        </Text>
        <TextInput
          value={password}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          onChangeText={setPassword}
          className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-xl mb-6 border border-slate-200 dark:border-slate-700"
        />

        <TouchableOpacity
          onPress={onSignInPress}
          disabled={loading}
          className="bg-indigo-600 py-4 rounded-xl items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
