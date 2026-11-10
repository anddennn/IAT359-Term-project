import { StyleSheet, Text, View, Image, Button } from "react-native";
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";

export default function LandingScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/placeholder.png")}
        style={styles.image}
        resizeMode="repeat"
      />

      {/* Action Buttons */}
      <View style={styles.landingContainer}>
        <Text style={styles.header}>PLING!: Your Virtual Pet Child Thing!</Text>
        <View>
          <PrimaryButton
            title="Sign Up"
            onPress={() => navigation.navigate("SignUp")}
          />
          <SecondaryButton
            text="Already have an account?"
            link="Sign in."
            onPress={() => navigation.navigate("SignIn")}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingVertical: 40,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    justifyContent: "center",
    position: "absolute",
  },
  header: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "bold",
  },
  landingContainer: {
    height: "90%",
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "space-between",
    padding: 75,
  },
});
