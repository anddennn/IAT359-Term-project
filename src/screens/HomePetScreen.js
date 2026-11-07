import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, Text, View, Button } from "react-native";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import PartnerPetScreen from "./PartnerPetScreen";

const Tab = createBottomTabNavigator();

function HomeIdScreen() {
  return (
    <View style={styles.screen}>
      <Text>User ID: {auth.currentUser?.uid ?? "Unavailable"}</Text>
      <View style={styles.debugSection}>
        <Button onPress={() => signOut(auth)} title="Sign Out" color="red" />
      </View>
    </View>
  );
}

export default function HomePetScreen() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeIdScreen} />
      <Tab.Screen name="Partner" component={PartnerPetScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
