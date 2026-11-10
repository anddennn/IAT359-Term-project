import { StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import SharedPetView from "../components/SharedPetView";
import PartnerPetScreen from "./PartnerPetScreen";
import LocationScreen from "./LocationScreen";

const Tab = createBottomTabNavigator();

function CurrentUserPetScreen() {
  return (
    <View style={styles.container}>
      <SharedPetView />
    </View>
  );
}

export default function HomePetScreen() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={CurrentUserPetScreen} />
      <Tab.Screen name="Partner" component={PartnerPetScreen} />
      <Tab.Screen name="Location" component={LocationScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 20,
    paddingVertical: 40,
    backgroundColor: "#f2f2f2",
  },
});
