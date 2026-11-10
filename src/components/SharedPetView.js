import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

import PrimaryButton from "./PrimaryButton";
import ProgressBar from "./ProgressBar";
import ActivityListItem from "./ActivityListItem";

const MAX_HEALTH_SECONDS = 60;
const ACTIVITY_NAMES = ["Q&A", "Camera", "Voice Notes", "Play"];

// Initialize activities list
const createActivities = () =>
  ACTIVITY_NAMES.map((name) => ({
    key: name,
    value: name,
    completed: false,
  }));

// Initialize pet
const createPet = () => ({
  exp: 0,
  health: MAX_HEALTH_SECONDS,
  activities: createActivities(),
});

export default function SharedPetView({ showPartnerId = false }) {
  const navigation = useNavigation();

  // User stuff
  const userId = auth.currentUser?.uid;
  const [account, setAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState(false);

  // Pet stuff
  const [petSnapshot, setPetSnapshot] = useState(null);
  const [petError, setPetError] = useState(false);

  // For timer
  const [now, setNow] = useState(0);

  // Account listener to handle loading and errors
  useEffect(() => {
    if (!userId) {
      return;
    }

    return onSnapshot(
      doc(db, "users", userId), // Basically if the user exists or if the pairing exists
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
    if (!pairingId) return;

    const pairingRef = doc(db, "pairings", pairingId);
    let initializing = false;

    // Checks the current snapshot of the pet to either get dta of an existing pet or create a new one
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

        if (initializing) return;

        // Initialization to create a pet or update a pet based off of data
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
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const updatePet = async (update) => {
    if (!pairingId) {
      throw new Error("This account is not paired.");
    }

    const pairingRef = doc(db, "pairings", pairingId);
    return runTransaction(db, async (transaction) => {
      const pairingSnapshot = await transaction.get(pairingRef);
      if (!pairingSnapshot.exists() || !pairingSnapshot.data().pet) {
        throw new Error("The shared pet is not available.");
      }

      const pairingData = pairingSnapshot.data();
      const lastUpdated = pairingData.petUpdatedAt?.toMillis?.() ?? now;
      const elapsedSeconds = Math.floor(Math.max(now - lastUpdated, 0) / 1000);
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
        return true;
      }
      return false;
    });
  };

  const handleUpdateError = (error) => {
    console.error("Error updating shared pet:", error);
    Alert.alert("Unable to update pet", error.message);
  };

  // Activity functions:
  // - handleRefreshActivities resets the task list
  // - handleCompleteActivities marks activities as completed
  // - handleTaskPress identifies which task is pressed and navigates as such

  const handleRefreshActivities = () => {
    updatePet((pet) => ({ ...pet, activities: createActivities() })).catch(
      handleUpdateError,
    );
  };

  const handleCompleteActivity = (key) => {
    return updatePet((pet) => {
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
    });
  };

  const handleTaskPress = (key) => {
    if (key === "Q&A") {
      navigation.navigate("QAScreen", {
        pairingId,
        userId,
        partnerId: account?.pairedWith,
        onComplete: () => handleCompleteActivity(key),
      });
    } else if (key === "Camera") {
      navigation.navigate("CameraTaskScreen", {
        onComplete: () => handleCompleteActivity(key),
      });
    } else {
      handleCompleteActivity(key).catch(handleUpdateError);
    }
  };

  const displayId = showPartnerId ? account?.pairedWith : userId;
  const title = displayId ?? (showPartnerId ? "Partner ID" : "User ID");

  const hasCurrentPet = petSnapshot?.pairingId === pairingId;

  const pet = hasCurrentPet ? petSnapshot.pet : null;

  const lastUpdated = petSnapshot?.updatedAt?.toMillis?.() ?? now;

  // Timer math
  const elapsedSeconds = Math.floor(Math.max(now - lastUpdated, 0) / 1000); // by millisecond
  const health = Math.max(
    (pet?.health ?? MAX_HEALTH_SECONDS) - elapsedSeconds,
    0,
  ); // decreases by the second

  const incompleteActivities =
    pet?.activities.filter((activity) => !activity.completed) ?? [];

  //Loading and error messages///////////////////////
  const message = !userId
    ? "User is unavailable."
    : accountLoading
      ? "Loading pairing..."
      : accountError
        ? "Unable to load pairing."
        : !pairingId
          ? "Pair with another user to share a pet."
          : petError
            ? "Unable to load the shared pet."
            : !pet
              ? "Loading shared pet..."
              : null;
  ////////////////////////////////////////////////////////

  ////////////////////////// RENDERING VIEW ///////////////////////

  return (
    <View style={styles.container}>
      <Text style={styles.header}>userID: {title}</Text>
      {message ? (
        <Text>{message}</Text>
      ) : (
        <>
          <View style={styles.barContainer}>
            <ProgressBar label="Exp" value={pet?.exp ?? 0} max={100} />
            <ProgressBar
              label="Hp"
              value={health}
              max={MAX_HEALTH_SECONDS}
              color="#0e8f66"
            />
          </View>

          <View
            style={[
              styles.placeholderHappy,
              health < MAX_HEALTH_SECONDS * 0.67 && styles.placeholderNeutral,
              health < MAX_HEALTH_SECONDS * 0.33 && styles.placeholderSad,
            ]}
          />
          <PrimaryButton
            title="Refresh activities (debug)"
            onPress={handleRefreshActivities}
            color="#000"
          />

          <FlatList
            style={styles.list}
            data={incompleteActivities}
            keyExtractor={(activity) => activity.key}
            renderItem={({ item }) => {
              const isNavigable = item.key === "Camera" || item.key === "Q&A";
              return (
                <ActivityListItem
                  label={item.value}
                  actionLabel={isNavigable ? "Go to task" : "Complete"}
                  actionColor={isNavigable ? undefined : "#0e8f66"}
                  onAction={() =>
                    isNavigable
                      ? handleTaskPress(item.key)
                      : handleCompleteActivity(item.key).catch(
                          handleUpdateError,
                        )
                  }
                />
              );
            }}
          />
        </>
      )}
    </View>
  );
}

/////////////////////// STYLES //////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingVertical: 40,
    backgroundColor: "#f2f2f2",
  },
  barContainer: {
    flexDirection: "column",
    gap: 2,
  },
  ///PET PLACEHOLDER TO BE REPLACED WITH IMAGES
  placeholderHappy: {
    width: 100,
    height: 100,
    borderRadius: 50,
    margin: 20,
    backgroundColor: "#33ff00",
  },
  placeholderNeutral: {
    backgroundColor: "#d6b600",
  },
  placeholderSad: {
    backgroundColor: "#790000",
  },
  // ----------------------------------------
  list: {
    maxHeight: "auto",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  header: {
    fontSize: 16,
    textAlign: "center",
  },
});
