import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TextInput, Button } from "react-native";
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import InputText from "../components/InputText";

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
      <InputText
        label="Email"
        placeholder="example@gmail.com..."
        secure={false}
        value={email}
        onChangeText={setEmail}
      />

      {/* Password Input */}
      <InputText
        label="Password"
        placeholder="password..."
        secure={true}
        value={password}
        onChangeText={setPassword}
      />

      {/* Action Buttons */}
      <PrimaryButton title="Sign In" onPress={handleSignIn} />
      <SecondaryButton
        text="Don't have an account yet?"
        link="Sign up now."
        onPress={() => navigation.navigate("SignUp")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 40,
    backgroundColor: "#f2f2f2",
  },
  header: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    color: "#888",
  },
});
