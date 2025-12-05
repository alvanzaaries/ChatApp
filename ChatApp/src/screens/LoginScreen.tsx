import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {signInWithEmailAndPassword} from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Username dan password harus diisi!");
      return;
    }

    try {
      // Convert username to email format
      const email = `${username.trim()}@chatapp.com`;
      
      // Login with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Save to AsyncStorage
      await AsyncStorage.setItem("username", username.trim());
      await AsyncStorage.setItem("isLoggedIn", "true");
      await AsyncStorage.setItem("photoURL", user.photoURL || "");

      navigation.replace("Chat", { name: username.trim() });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert("Error", "Username atau password salah!");
      } else {
        Alert.alert("Error", error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Chat App</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.linkText}>Belum punya akun? Daftar disini</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkText: {
    color: "#007AFF",
    textAlign: "center",
    marginTop: 10,
  },
});