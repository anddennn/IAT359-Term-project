import { useEffect, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, View } from "react-native";
import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

const MAX_HEALTH_SECONDS = 60;
const ACTIVITY_NAMES = ["Q&A", "Camera", "Voice Notes", "Play"];

function createActivities() {
  return ACTIVITY_NAMES.map((name) => ({
    key: name,
    value: name,
    completed: false,
  }));
}

function createPet() {
  return {
    exp: 0,
    health: MAX_HEALTH_SECONDS,
    activities: createActivities(),
  };
}

export default function SharedPetView({ showPartnerId = false }) {
  const userId = auth.currentUser?.uid;
  const [account, setAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState(false);
  const [petSnapshot, setPetSnapshot] = useState(null);
  const [petError, setPetError] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return onSnapshot(
      doc(db, "users", userId),
      (userSnapshot) => {
        setAccount(userSnapshot.exists() ? userSnapshot.data() : null);
        setAccountLoading(false);
        setAccountError(false);
      },
      (error) => {
        console.error("Error fetching account pairing:", error);
        setAccountLoading(false);
        setAccountError(true);
      },
    );
  }, [userId]);

  const pairingId = account?.pairingId ?? null;

  useEffect(() => {
    if (!pairingId) {
      return;
    }

    const pairingRef = doc(db, "pairings", pairingId);
    let initializing = false;

    return onSnapshot(
      pairingRef,
      (pairingSnapshot) => {
        if (!pairingSnapshot.exists()) {
          setPetError(true);
          return;
        }

        const pairingData = pairingSnapshot.data();
        if (pairingData.pet) {
          setPetSnapshot({
            pairingId,
            pet: pairingData.pet,
            updatedAt: pairingData.petUpdatedAt,
          });
          setPetError(false);
          return;
        }

        if (initializing) {
          return;
        }

        initializing = true;
        runTransaction(db, async (transaction) => {
          const currentPairing = await transaction.get(pairingRef);
          if (currentPairing.exists() && !currentPairing.data().pet) {
            transaction.update(pairingRef, {
              pet: createPet(),
              petUpdatedAt: serverTimestamp(),
            });
          }
        }).catch((error) => {
          console.error("Error initializing shared pet:", error);
          initializing = false;
          setPetError(true);
        });
      },
      (error) => {
        console.error("Error fetching shared pet:", error);
        setPetError(true);
      },
    );
  }, [pairingId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const updatePet = async (update) => {
    if (!pairingId) {
      throw new Error("This account is not paired.");
    }

    const pairingRef = doc(db, "pairings", pairingId);
    await runTransaction(db, async (transaction) => {
      const pairingSnapshot = await transaction.get(pairingRef);
      if (!pairingSnapshot.exists() || !pairingSnapshot.data().pet) {
        throw new Error("The shared pet is not available.");
      }

      const pairingData = pairingSnapshot.data();
      const lastUpdated = pairingData.petUpdatedAt?.toMillis?.() ?? now;
      const elapsedSeconds = Math.floor(
        Math.max(now - lastUpdated, 0) / 1000,
      );
      const currentPet = {
        ...pairingData.pet,
        health: Math.max(pairingData.pet.health - elapsedSeconds, 0),
      };
      const nextPet = update(currentPet);

      if (nextPet) {
        transaction.update(pairingRef, {
          pet: nextPet,
          petUpdatedAt: serverTimestamp(),
        });
      }
    });
  };

  const handleUpdateError = (error) => {
    console.error("Error updating shared pet:", error);
    Alert.alert("Unable to update pet", error.message);
  };

  const handleRefreshActivities = () => {
    updatePet((pet) => ({ ...pet, activities: createActivities() })).catch(
      handleUpdateError,
    );
  };

  const handleCompleteActivity = (key) => {
    updatePet((pet) => {
      const activity = pet.activities.find((item) => item.key === key);
      if (!activity || activity.completed) {
        return null;
      }

      return {
        ...pet,
        exp: pet.exp + 10,
        health: Math.min(pet.health + 15, MAX_HEALTH_SECONDS),
        activities: pet.activities.map((item) =>
          item.key === key ? { ...item, completed: true } : item,
        ),
      };
    }).catch(handleUpdateError);
  };

  const displayId = showPartnerId ? account?.pairedWith : userId;
  const title = displayId ?? (showPartnerId ? "Partner ID" : "User ID");
  const hasCurrentPet = petSnapshot?.pairingId === pairingId;
  const pet = hasCurrentPet ? petSnapshot.pet : null;
  const lastUpdated = petSnapshot?.updatedAt?.toMillis?.() ?? now;
  const elapsedSeconds = Math.floor(Math.max(now - lastUpdated, 0) / 1000);
  const health = Math.max((pet?.health ?? MAX_HEALTH_SECONDS) - elapsedSeconds, 0);
  const expBarWidth = `${Math.min(Math.max((pet?.exp ?? 0) / 100, 0), 1) * 100}%`;
  const healthBarWidth = `${(health / MAX_HEALTH_SECONDS) * 100}%`;
  const incompleteActivities =
    pet?.activities.filter((activity) => !activity.completed) ?? [];

  let message = null;
  if (!userId) {
    message = "User is unavailable.";
  } else if (accountLoading) {
    message = "Loading pairing...";
  } else if (accountError) {
    message = "Unable to load pairing.";
  } else if (!pairingId) {
    message = "Pair with another user to share a pet.";
  } else if (petError) {
    message = "Unable to load the shared pet.";
  } else if (!pet) {
    message = "Loading shared pet...";
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
      {message ? (
        <Text>{message}</Text>
      ) : (
        <>
          <View style={styles.barContainer}>
            <Text>Exp</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: expBarWidth }]} />
              </View>
            </View>
          </View>

          <View style={styles.barContainer}>
            <Text>Health</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[styles.progressBarFill, { width: healthBarWidth }]}
                />
              </View>
            </View>
          </View>

          <View
            style={[
              styles.placeholderHappy,
              health < MAX_HEALTH_SECONDS * 0.67 &&
                styles.placeholderNeutral,
              health < MAX_HEALTH_SECONDS * 0.33 && styles.placeholderSad,
            ]}
          />
          <Button
            title="Refresh activities (debug)"
            color="#122666"
            onPress={handleRefreshActivities}
          />
          <FlatList
            style={styles.list}
            data={incompleteActivities}
            keyExtractor={(activity) => activity.key}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={styles.listItemText}>{item.value}</Text>
                <Button
                  title="Complete"
                  color="#0e8f66"
                  onPress={() => handleCompleteActivity(item.key)}
                />
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBar: {
    width: "80%",
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  progressBarTrack: {
    height: 8,
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#e0e0df",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#3b5998",
  },
  placeholderHappy: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#33ff00",
  },
  placeholderNeutral: {
    backgroundColor: "#d6b600",
  },
  placeholderSad: {
    backgroundColor: "#790000",
  },
  list: {
    maxHeight: "40%",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  listItem: {
    backgroundColor: "#dfe2eb",
    borderWidth: 1,
    borderColor: "#a9aec2",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  listItemText: {
    fontSize: 16,
    color: "#484e63",
    margin: 10,
    flexWrap: "wrap",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f2f2f2",
  },
  header: {
    fontSize: 24,
    textAlign: "center",
  },
});
