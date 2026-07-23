// app/(auth)/_layout.tsx
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/expo";

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Wait until Clerk loads authentication state
  if (!isLoaded) return null;

  // If user is already signed in, redirect them to the home tabs
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
