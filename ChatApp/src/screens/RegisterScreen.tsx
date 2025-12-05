import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { createUserWithEmailAndPassword, updateProfile, uploadProfileImage } from "../config/firebase";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props): React.ReactElement {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.5,
        maxWidth: 500,
        maxHeight: 500,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          setProfileImage(asset.uri || null);
        }
      }
    );
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Username dan password harus diisi!");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Password tidak cocok!");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password minimal 6 karakter (syarat Firebase)!");
      return;
    }

    try {
      // Convert username to email format
      const email = `${username.trim()}@chatapp.com`;
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Upload profile photo if exists
      let photoURL = "";
      if (profileImage) {
        photoURL = await uploadProfileImage(user.uid, profileImage);
      }
      
      // Update profile with username and photo
      await updateProfile(user, {
        displayName: username.trim(),
        photoURL: photoURL || null,
      });

      await AsyncStorage.setItem("username", username.trim());
      await AsyncStorage.setItem("isLoggedIn", "true");
      await AsyncStorage.setItem("photoURL", photoURL);

      Alert.alert("Sukses", "Registrasi berhasil!");
      navigation.replace("Chat", { name: username.trim() });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Error", "Username sudah dipakai!");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("Error", "Password terlalu lemah!");
      } else {
        Alert.alert("Error", error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daftar Akun Baru</Text>

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <Text style={styles.imageButtonText}>Pilih Foto Profil</Text>
        )}
      </TouchableOpacity>

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

      <TextInput
        style={styles.input}
        placeholder="Konfirmasi Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Daftar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Sudah punya akun? Login disini</Text>
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
  imageButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ddd",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  imageButtonText: {
    textAlign: "center",
    color: "#666",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
