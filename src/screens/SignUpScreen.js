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
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import InputText from "../components/InputText";

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

      <PrimaryButton title="Sign Up" onPress={handleSignUp} />
      <SecondaryButton
        text="Already have an account?"
        link="Sign in."
        onPress={() => navigation.navigate("SignIn")}
      />
    </View>
  );
}

//////////////////////// STYLE SHEET ////////////////////////

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
