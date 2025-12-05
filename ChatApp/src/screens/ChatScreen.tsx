import React, { useEffect, useState } from "react";
import {
 View,
 Text,
 TextInput,
 Button,
 FlatList,
 StyleSheet,
 Image,
 TouchableOpacity,
 Alert,
 ActivityIndicator,
} from "react-native";

import {
 addDoc,
 serverTimestamp,
 query,
 orderBy,
 onSnapshot,
 messagesCollection,
 db,
 collection,
} from "../config/firebase";
// Storage import not needed for base64 approach
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";

type MessageType = {
 id: string;
 text: string;
 user: string;
 photoURL?: string;
 imageURL?: string;
 imageBase64?: string;
 createdAt: { seconds: number; nanoseconds: number } | null;
};
type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export default function ChatScreen({ route, navigation }: Props) {
 const { name } = route.params;
 const [message, setMessage] = useState<string>("");
 const [messages, setMessages] = useState<MessageType[]>([]);
 const [uploading, setUploading] = useState(false);

 useEffect(() => {
  // Listen to Firestore updates
  const q = query(messagesCollection, orderBy("createdAt", "asc"));
  const unsub = onSnapshot(
   q,
   (snapshot: any) => {
    const list: MessageType[] = [];
    snapshot.forEach((doc: any) => {
     list.push({
      id: doc.id,
      ...(doc.data() as Omit<MessageType, "id">),
     });
    });
    setMessages(list);
   },
   (error: any) => {
    // If error (likely because of null createdAt), fetch without ordering
    console.log("Error with orderBy, fetching all messages:", error);
    const unorderedQuery = collection(db, "messages");
    const unorderedUnsub = onSnapshot(unorderedQuery, (snapshot: any) => {
     const list: MessageType[] = [];
     snapshot.forEach((doc: any) => {
      list.push({
       id: doc.id,
       ...(doc.data() as Omit<MessageType, "id">),
      });
     });
     // Sort manually by createdAt, putting null at the beginning
     list.sort((a, b) => {
      if (!a.createdAt) return -1;
      if (!b.createdAt) return 1;
      return a.createdAt.seconds - b.createdAt.seconds;
     });
     setMessages(list);
    });
    return unorderedUnsub;
   }
  );
  return () => unsub();
 }, []);



 const sendMessage = async () => {
  if (!message.trim()) return;
  const photoURL = await AsyncStorage.getItem("photoURL");
  await addDoc(messagesCollection, {
   text: message,
   user: name,
   photoURL: photoURL || "",
   createdAt: serverTimestamp(),
  });
  setMessage("");
 };

 const pickAndSendImage = () => {
  launchImageLibrary(
   {
    mediaType: "photo",
    quality: 0.5,
    maxWidth: 800,
    maxHeight: 800,
    includeBase64: true,
   },
   async (response) => {
    if (response.didCancel) return;
    if (response.errorMessage) {
     Alert.alert("Error", response.errorMessage);
     return;
    }

    if (response.assets && response.assets[0]) {
     setUploading(true);
     try {
      const asset = response.assets[0];

      // Check file size (Firestore has 1MB document limit)
      const fileSize = asset.fileSize || 0;
      if (fileSize > 900000) {
       Alert.alert("Error", "Ukuran foto terlalu besar. Pilih foto yang lebih kecil.");
       setUploading(false);
       return;
      }

      // Get base64 string
      const base64String = asset.base64;
      if (!base64String) {
       Alert.alert("Error", "Gagal mengkonversi foto ke base64");
       setUploading(false);
       return;
      }

      // Create data URI
      const mimeType = asset.type || "image/jpeg";
      const imageBase64 = `data:${mimeType};base64,${base64String}`;
      
      const photoURL = await AsyncStorage.getItem("photoURL");
      
      // Send message with base64 image
      await addDoc(messagesCollection, {
       text: "",
       imageBase64,
       user: name,
       photoURL: photoURL || "",
       createdAt: serverTimestamp(),
      });
      
      Alert.alert("Sukses", "Foto berhasil dikirim!");
     } catch (error: any) {
      console.error("Error sending image:", error);
      Alert.alert("Error", `Gagal mengirim foto: ${error.message}`);
     } finally {
      setUploading(false);
     }
    }
   }
  );
 };

 const handleLogout = async () => {
  Alert.alert(
   "Logout",
   "Yakin ingin keluar?",
   [
    { text: "Batal", style: "cancel" },
    {
     text: "Logout",
     onPress: async () => {
      await AsyncStorage.removeItem("isLoggedIn");
      await AsyncStorage.removeItem("username");
      await AsyncStorage.removeItem("photoURL");
      navigation.replace("Login");
     },
    },
   ]
  );
 };

 const renderItem = ({ item }: { item: MessageType }) => (
  <View
   style={[
    styles.msgBox,
    item.user === name ? styles.myMsg : styles.otherMsg,
   ]}
  >
   <View style={styles.messageHeader}>
    {item.photoURL && (
     <Image source={{ uri: item.photoURL }} style={styles.avatar} />
    )}
    <Text style={styles.sender}>{item.user}</Text>
   </View>
   {(item.imageURL || item.imageBase64) ? (
    <Image 
     source={{ uri: item.imageBase64 || item.imageURL }} 
     style={styles.chatImage}
     resizeMode="cover"
    />
   ) : (
    <Text style={styles.messageText}>{item.text}</Text>
   )}
  </View>
 );

 return (
  <View style={{ flex: 1 }}>
   <View style={styles.header}>
    <Text style={styles.headerTitle}>Chat Room</Text>
    <TouchableOpacity onPress={handleLogout}>
     <Text style={styles.logoutButton}>Logout</Text>
    </TouchableOpacity>
   </View>
   <FlatList
    data={messages}
    keyExtractor={(item) => item.id}
    renderItem={renderItem}
    contentContainerStyle={{ padding: 10 }}
    keyboardShouldPersistTaps="handled"
   />
   <View style={styles.inputRow}>
    <TouchableOpacity 
     style={styles.imageButton} 
     onPress={pickAndSendImage}
     disabled={uploading}
    >
     {uploading ? (
      <ActivityIndicator size="small" color="#007AFF" />
     ) : (
      <Text style={styles.imageButtonText}>📷</Text>
     )}
    </TouchableOpacity>
    <TextInput
     style={styles.input}
     placeholder="Ketik pesan..."
     value={message}
     onChangeText={setMessage}
     autoFocus={false}
     multiline={false}
     returnKeyType="send"
     onSubmitEditing={sendMessage}
     blurOnSubmit={false}
     editable={!uploading}
     selectTextOnFocus={true}
    />
    <Button title="Kirim" onPress={sendMessage} disabled={uploading} />
   </View>
  </View>
 );
}

const styles = StyleSheet.create({
 header: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 15,
  backgroundColor: "#007AFF",
 },
 headerTitle: {
  fontSize: 18,
  fontWeight: "bold",
  color: "#fff",
 },
 logoutButton: {
  color: "#fff",
  fontWeight: "bold",
 },
 msgBox: {
  padding: 10,
  marginVertical: 6,
  borderRadius: 6,
  maxWidth: "80%",
 },
 myMsg: {
  backgroundColor: "#d1f0ff",
  alignSelf: "flex-end",
 },
 otherMsg: {
  backgroundColor: "#eee",
  alignSelf: "flex-start",
 },
 messageHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 4,
 },
 avatar: {
  width: 24,
  height: 24,
  borderRadius: 12,
  marginRight: 6,
 },
 sender: {
  fontWeight: "bold",
  fontSize: 12,
 },
 messageText: {
  fontSize: 14,
 },
 chatImage: {
  width: 200,
  height: 200,
  borderRadius: 8,
  marginTop: 5,
 },
 inputRow: {
  flexDirection: "row",
  padding: 10,
  borderTopWidth: 1,
  borderColor: "#ccc",
  alignItems: "center",
 },
 imageButton: {
  width: 40,
  height: 40,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 8,
  backgroundColor: "#f0f0f0",
  borderRadius: 20,
 },
 imageButtonText: {
  fontSize: 20,
 },
 input: {
  flex: 1,
  borderWidth: 1,
  marginRight: 10,
  padding: 8,
  borderRadius: 6,
 },
});
