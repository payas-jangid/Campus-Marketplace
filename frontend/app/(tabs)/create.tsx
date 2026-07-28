// app/(tabs)/create.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
interface Category {
  id: string;
  name: string;
  slug: string;
}
export default function CreateListingScreen() {
  const {getToken} = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/items/categories`,
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          if (data.length > 0) {
            setCategoryId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const token = await getToken();

    if (!title || !price || !image) {
      Alert.alert(
        "Missing Fields",
        "Please provide a title, price, and image.",
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Image to Cloudinary (or backend)
      // 2. POST listing payload to Express API endpoint
      const formData = new FormData();
      formData.append('title',title);
      formData.append('description',description || '');
      formData.append("price", price.toString());
      formData.append("categoryId", categoryId);

      const filename = image.split("/").pop() || "upload.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("images", {
        uri: image,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const raw = await response.text();
      console.log("RAW SERVER RESPONSE:", raw);

      if (!response.ok) {
        throw new Error("Failed to create listing (check console for details)");
      }

      const data = JSON.parse(raw);
      Alert.alert("Success", "Listing created successfully!");
      router.push("/(tabs)");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} className="p-3">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Post an Item 🏷️
        </Text>

        <TouchableOpacity
          onPress={pickImage}
          className="w-full h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl justify-center items-center mb-4 overflow-hidden border border-dashed border-slate-400"
        >
          {image ? (
            <Image source={{ uri: image }} className="w-full h-full" />
          ) : (
            <View className="items-center">
              <Ionicons name="camera-outline" size={36} color="#64748b" />
              <Text className="text-slate-500 font-medium mt-1">
                Tap to add photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2">
          Category
        </Text>
        {loadingCategories ? (
          <ActivityIndicator size="small" color="#6366f1" className="mb-4" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4 flex-row"
          >
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
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
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Form Fields */}
        <TextInput
          placeholder="Item Title (e.g. Engineering Physics Textbook)"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
          className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-4 rounded-xl mb-3 border border-slate-200 dark:border-slate-700"
        />

        <TextInput
          placeholder="Price (₹)"
          placeholderTextColor="#94a3b8"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-4 rounded-xl mb-3 border border-slate-200 dark:border-slate-700"
        />

        <TextInput
          placeholder="Description & Item Condition..."
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-4 rounded-xl mb-6 border border-slate-200 dark:border-slate-700 text-top"
        />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-indigo-600 p-4 rounded-xl flex-row justify-center items-center shadow-sm"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Publish Listing
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
