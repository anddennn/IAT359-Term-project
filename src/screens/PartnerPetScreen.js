import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export default function PartnerPairScreen() {
  const [partnerId, setPartnerId] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      return;
    }

    return onSnapshot(
      doc(db, "users", userId),
      (userSnapshot) => {
        const pairedWith = userSnapshot.exists()
          ? userSnapshot.data().pairedWith ?? null
          : null;
        setPartnerId(pairedWith);
        setLoadError(false);
      },
      (error) => {
        console.error("Error fetching partner ID:", error);
        setLoadError(true);
      },
    );
  }, [userId]);

  let partnerText = partnerId ?? "Not found";
  if (!userId) {
    partnerText = "Unavailable";
  } else if (loadError) {
    partnerText = "Unable to load";
  }

  return (
    <View style={styles.screen}>
      <Text>Partner ID: {partnerText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
