import { StyleSheet, Text, View } from "react-native";
import SharedPetView from "../components/SharedPetView";

export default function PartnerPetScreen() {
  return (
    <View style={styles.container}>
      <SharedPetView showPartnerId showPartnerActivities readOnly />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 20,
    paddingVertical: 40,
    backgroundColor: "#f1f6ff",
  },
});
