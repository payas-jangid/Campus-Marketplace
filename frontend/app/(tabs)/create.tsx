// app/(tabs)/create.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreateListingScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!title || !price || !image) {
      Alert.alert('Missing Fields', 'Please provide a title, price, and image.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Image to Cloudinary (or backend)
      // 2. POST listing payload to Express API endpoint
      Alert.alert('Success', 'Listing created successfully!');
      router.push('/(tabs)');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create listing.');
    }finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Post an Item 🏷️
        </Text>

        {/* Image Picker Box */}
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
            <Text className="text-white font-bold text-lg">Publish Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}