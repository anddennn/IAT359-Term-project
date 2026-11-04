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

export default function SignUpScreen() {
  // state variables to track email and password inputs.
  // these make the text inputs "Controlled Components" (React manages their values).
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  async function handleSignUp() {
    try {
      // send request to Firebase to create a user.
      // 'await' pauses execution here until Firebase responds.
      const response = await createUserWithEmailAndPassword(
        auth,
        email, //testing hardcoded value
        password,
      );

      console.log(response);
      alert("Sign up success. User: " + email + " signed up.");
      // note: After successful signup, Firebase automatically signs the user in.
      // the onAuthStateChanged listener in App.js will detect this and navigate.
    } catch (error) {
      // handle errors (e.g., email already in use, weak password).
      console.log(error.message);
      alert(error.message);
    }
  }

  //////////////////////// SCREEN ////////////////////////
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign Up</Text>

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

      {/* Action Buttons -> TO BE CHANGED TO TOUCHABLE OPACITY*/}
      <View style={styles.buttonContainer}>
        <Button title="Sign Up" onPress={handleSignUp} />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Sign in instead"
          color="#333"
          onPress={() => navigation.navigate("SignIn")}
        />
      </View>
    </View>
  );
}

//////////////////////// STYLE SHEET ////////////////////////

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
