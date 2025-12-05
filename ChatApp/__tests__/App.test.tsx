import React, { useEffect, useState } from "react";
import { NavigationContainer } from"@react-navigation/native";
import { createNativeStackNavigator } from"@react-navigation/native-stack";
import LoginScreen from "../src/screens/LoginScreen";
import ChatScreen from"./ChatScreen";
import { auth, signInAnonymously, onAuthStateChanged } from "../src/config/firebase";
import { User } from "firebase/auth";
export type RootStackParamList = {
Login: undefined;
Chat: { name: string };
};

const Stack =createNativeStackNavigator<RootStackParamList>();
export default function App() {
const [user, setUser] = useState<User | null>(null);
useEffect(() => {
signInAnonymously(auth).catch(console.error);
const unsub = onAuthStateChanged(auth, (u: User | null) => {
setUser(u);
});
return () => unsub();
}, []);
if (!user) return null;

return (
<NavigationContainer>
<Stack.Navigator>
<Stack.Screen name="Login" component={LoginScreen} />
<Stack.Screen name="Chat" component={ChatScreen} />
</Stack.Navigator>
</NavigationContainer>
);
}