import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ChatScreen from "./src/screens/ChatScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Chat: { name: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<"Login" | "Chat">("Login");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        const savedUsername = await AsyncStorage.getItem("username");

        if (isLoggedIn === "true" && savedUsername) {
          setUsername(savedUsername);
          setInitialRoute("Chat");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAutoLogin();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: "Login", headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: "Daftar Akun" }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          initialParams={{ name: username }}
          options={{ 
            title: "Chat Room",
            headerLeft: () => null,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
