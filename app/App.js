// app/App.js
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import MeshHomeScreen from "./screens/MeshHomeScreen";
import SendMessageScreen from "./screens/SendMessageScreen";
import PeerListScreen from "./screens/PeerListScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import AlertDetailScreen from "./screens/AlertDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem("hasSeenOnboarding");
        setShowOnboarding(seen !== "true");
      } catch (error) {
        console.log("Error checking onboarding:", error);
        setShowOnboarding(true); // Show onboarding on error
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  if (isLoading || showOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={showOnboarding ? "Onboarding" : "MeshHome"}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MeshHome" component={MeshHomeScreen} />
        <Stack.Screen name="SendMessage" component={SendMessageScreen} />
        <Stack.Screen name="PeerList" component={PeerListScreen} />
        <Stack.Screen 
          name="AlertDetail" 
          component={AlertDetailScreen}
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
});

