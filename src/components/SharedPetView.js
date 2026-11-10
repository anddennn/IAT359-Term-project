import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { signOut } from "firebase/auth";

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
});

export default function SharedPetView({
  //props are used to differentiate between home and pet view
  showPartnerId = false,
  showPartnerActivities = false,
  readOnly = false,
}) {
  const navigation = useNavigation();

  // User stuff
  const userId = auth.currentUser?.uid;
  const [account, setAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState(false);

  const [activities, setActivities] = useState([]); // will hold activity list

  // Pet stuff
  const [petSnapshot, setPetSnapshot] = useState(null);
  const [petError, setPetError] = useState(false);

  // For timer
  const [now, setNow] = useState(0);

  // Account listener to store account data and reads pairingID
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

  const activityUserId = showPartnerActivities ? account?.pairedWith : userId;
  // Account listener to store/make individual user activities
  useEffect(() => {
    if (!activityUserId) return;

    const userRef = doc(db, "users", activityUserId);

    return onSnapshot(userRef, (userSnapshot) => {
      if (!userSnapshot.exists()) return;

      const userData = userSnapshot.data();

      // If activities don't exist yet, initialize them
      if (!userData.activities) {
        updateDoc(userRef, {
          activities: createActivities(),
        });
      } else {
        setActivities(userData.activities);
      }
    });
  }, [activityUserId]);

  const pairingId = account?.pairingId ?? null;

  // Pairing listener that watches 'pairings' document and stores shared pet state.
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

  // Timer Listener
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
    const userRef = doc(db, "users", userId);
    updateDoc(userRef, { activities: createActivities() }).catch(
      handleUpdateError,
    );
  };

  const handleCompleteActivity = async (key) => {
    const activity = pet.activities.find((item) => item.key === key);

    if (!activity || activity.completed) return;

    // Update shared pet exp and health
    await updatePet((pet) => ({
      ...pet,
      exp: pet.exp + 10,
      health: Math.min(pet.health + 15, MAX_HEALTH_SECONDS),
    }));

    // Update ONLY CURRENT USER activities
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      activities: activities.map((item) =>
        item.key === key ? { ...item, completed: true } : item,
      ),
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

  const incompleteActivities = activities.filter(
    (activity) => !activity.completed,
  );
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully!");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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

          {/* Only accessible on your own home pet screen */}
          {!readOnly && (
            <PrimaryButton
              title="Refresh activities (debug)"
              onPress={handleRefreshActivities}
              color="#000"
            />
          )}

          <View style={styles.activityContainer}>
            <Text style={[{ fontWeight: "bold" }]}>Activity List:</Text>
            <FlatList
              style={styles.list}
              data={incompleteActivities}
              keyExtractor={(activity) => activity.key}
              renderItem={({ item }) => {
                const isNavigable = item.key === "Camera" || item.key === "Q&A";
                return (
                  <ActivityListItem
                    label={item.value}
                    readOnly={readOnly}
                    itemColor={readOnly ? "#d6e2fd" : "#FFFFFF"}
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
          </View>
        </>
      )}
      <PrimaryButton title="Sign out" color="Red" onPress={handleLogout} />
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

  activityContainer: {
    width: "100%",
    flexDirection: "column",
    gap: 4,
    alignContent: "flex-start",
  },

  list: {
    maxHeight: "auto",
    width: "100%",
  },
  header: {
    fontSize: 16,
    textAlign: "center",
  },
});
