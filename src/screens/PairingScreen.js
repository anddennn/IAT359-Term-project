import React, { useState, useEffect } from "react";
import {
  Button,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";

export default function PairingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("default");
  const [generatedCode, setGeneratedCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const currentUserId = auth.currentUser?.uid;

  // Listen for pairing status updates
  useEffect(() => {
    let unsubscribeSnapshot;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists() && docSnap.data().pairingId) {
              navigation.replace("HomePetScreen");
            } else {
              setLoading(false);
            }
          },
          (error) => {
            console.error("Error fetching user document:", error);
            setLoading(false);
          },
        );
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [navigation]);

  // Generate a new pairing code
  const handleGenerateCode = async () => {
    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      await setDoc(doc(db, "pairingCodes", newCode), {
        creatorId: currentUserId,
        createdAt: new Date(),
      });

      setGeneratedCode(newCode);
      setViewMode("generate");
    } catch (error) {
      Alert.alert("Error", "Could not generate code. Please try again.");
    }
  };

  // Cancel and remove the active pairing code
  const handleCancelGenerate = async () => {
    if (generatedCode) {
      await deleteDoc(doc(db, "pairingCodes", generatedCode));
    }
    setGeneratedCode("");
    setViewMode("default");
  };

  // Process submitted pairing code
  const handleInputCodeSubmit = async () => {
    if (!inputCode.trim()) {
      Alert.alert("Invalid", "Please enter a code.");
      return;
    }

    const codeToSearch = inputCode.trim().toUpperCase();

    try {
      const codeRef = doc(db, "pairingCodes", codeToSearch);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        Alert.alert(
          "Not Found",
          "That pairing code does not exist or has expired.",
        );
        return;
      }

      const partnerId = codeSnap.data().creatorId;

      if (partnerId === currentUserId) {
        Alert.alert("Error", "Cannot pair with yourself.");
        return;
      }

      // Create unique alphabetical pairing ID
      const sharedPairingId = [currentUserId, partnerId].sort().join("-");

      // Link accounts
      await setDoc(
        doc(db, "users", currentUserId),
        {
          pairedWith: partnerId,
          pairingId: sharedPairingId,
        },
        { merge: true },
      );

      await setDoc(
        doc(db, "users", partnerId),
        {
          pairedWith: currentUserId,
          pairingId: sharedPairingId,
        },
        { merge: true },
      );

      // Initialize shared pairing document
      await setDoc(doc(db, "pairings", sharedPairingId), {
        pairingId: sharedPairingId,
        users: [currentUserId, partnerId],
        createdAt: new Date(),
      });

      // Remove the used code
      await deleteDoc(codeRef);
    } catch (error) {
      Alert.alert("Error", "Failed to pair accounts: " + error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Checking pairing status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {viewMode === "default" && (
        <View style={styles.content}>
          <Text style={styles.title}>Pair Accounts</Text>
          <Text style={styles.subtitle}>
            Link with your partner to share a pet!
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGenerateCode}
          >
            <Text style={styles.buttonText}>Generate a Pair Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setViewMode("input")}
          >
            <Text style={styles.secondaryButtonText}>I have a code</Text>
          </TouchableOpacity>
        </View>
      )}

      {viewMode === "generate" && (
        <View style={styles.content}>
          <Text style={styles.title}>Your Code</Text>
          <Text style={styles.codeText}>{generatedCode}</Text>

          <ActivityIndicator
            size="small"
            color="#0000ff"
            style={{ marginVertical: 20 }}
          />
          <Text style={styles.waitingText}>
            Waiting for partner to enter code...
          </Text>

          <Button title="Cancel" color="red" onPress={handleCancelGenerate} />
        </View>
      )}

      {viewMode === "input" && (
        <View style={styles.content}>
          <Text style={styles.title}>Enter Partner's Code</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. A8F9B2"
            value={inputCode}
            onChangeText={setInputCode}
            autoCapitalize="characters"
            maxLength={6}
          />

          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              color="gray"
              onPress={() => setViewMode("default")}
            />
            <View style={{ width: 20 }} />
            <Button title="Submit Code" onPress={handleInputCodeSubmit} />
          </View>
        </View>
      )}

      <View style={styles.debugSection}>
        <Button onPress={() => signOut(auth)} title="Sign Out" color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    marginBottom: 40,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007BFF",
  },
  secondaryButtonText: {
    color: "#007BFF",
    fontSize: 16,
    fontWeight: "600",
  },
  codeText: {
    fontSize: 48,
    fontWeight: "bold",
    letterSpacing: 5,
    color: "#333",
    marginVertical: 20,
  },
  waitingText: {
    fontSize: 16,
    color: "gray",
    marginBottom: 30,
  },
  input: {
    height: 60,
    width: "80%",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 30,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 3,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  debugSection: {
    position: "absolute",
    bottom: 40,
  },
});
