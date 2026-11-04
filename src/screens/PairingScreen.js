import { Button, StyleSheet, Text, View } from "react-native";
import { auth } from "../firebaseConfig";
import { getAuth, signOut } from "firebase/auth";

export default function PairingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>Pairing Screen</Text>

      {/* Make it so pairing screen is only shown on the first time, if user has already paired, go to main pet screen */}

      {/* Sign out for debugging, remove later */}
      <Button onPress={() => signOut(auth)} title="Sign Out" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
