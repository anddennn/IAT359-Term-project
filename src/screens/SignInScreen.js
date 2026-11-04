import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TextInput, Button } from "react-native";
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function SignInScreen() {
  // state variables to track email and password inputs.
  // these make the text inputs "Controlled Components" (React manages their values).
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  // handles User Login.
  //  this checks credentials against existing users in Firebase

  async function handleSignIn() {
    try {
      // send request to Firebase to validate credentials.
      const response = await signInWithEmailAndPassword(auth, email, password);

      //console.log(response);
      alert("User: " + email + " signed in");
      // note: Similar to sign up, a success here triggers App.js to switch screens automatically.
    } catch (error) {
      // handle errors (e.g., wrong password, user not found).
      console.log(error.message);
      alert(error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome Back!</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address" // optimizes keyboard for email entry (@ symbol)
        value={email}
        onChangeText={setEmail} // updates state on every keystroke
        autoCapitalize="none" // important! Prevents auto-capitalizing the first letter of emails
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true} // hides text for security (dots/asterisks)
        value={password}
        onChangeText={setPassword}
      />

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button title="Sign In" onPress={handleSignIn} />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Sign up instead"
          color="#333"
          onPress={() => navigation.navigate("SignUp")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f2f2f2",
  },
  header: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },
  buttonContainer: {
    padding: 20,
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    color: "#888",
  },
});
