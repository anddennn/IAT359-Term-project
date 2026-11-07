import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth } from "../firebaseConfig";
import { getAuth, signOut } from "firebase/auth";
import { useEffect, useState } from "react";

const MAX_HEALTH_SECONDS = 60;

export default function HomePetScreen({ navigation }) {
  ///////////////////////// FUNCTIONS ////////////////////////

  // Pet states
  const [item, setItem] = useState("");

  const [exp, setExp] = useState(0);
  const expBarWidth = Math.min(Math.max(exp / 100, 0), 1) * 100 + "%"; //clamp between 0 and 1, then convert to percentage

  // Health timer countdown: https://www.youtube.com/watch?v=UOzkJbgIo8Q

  const [count, setCount] = useState(MAX_HEALTH_SECONDS); // remaining health time in seconds
  const validatedCount = Math.min(Math.max(count / MAX_HEALTH_SECONDS, 0), 1);
  const healthBarWidth = validatedCount * 100 + "%";

  useEffect(() => {
    if (count <= 0) return; // TODO: change to tertiary operators
    const interval = setInterval(() => {
      setCount((remainingSeconds) => Math.max(remainingSeconds - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [count]);

  // Activity states lowkey i dont know if this is the play
  // surely there's a better way to do this right
  // well its all hard coded rn so ...
  // TODO: make it so that activities take you to dedicated activity page,
  //       and then you complete it from there
  const [activity, setActivity] = useState("");
  const [activities, setActivities] = useState([
    { key: "Q&A", value: "Q&A", completed: false },
    { key: "Camera", value: "Camera", completed: false },
    { key: "Voice Notes", value: "Voice Notes", completed: false },
    { key: "Play", value: "Play", completed: false },
  ]); //list of activities hard coded

  // only render activities in the flat list that are not completed
  const incompleteActivities = activities.filter(
    (activity) => !activity.completed,
  );

  //Debugging tool to automatically repopulate list
  function addItem() {
    setActivities(
      ["Q&A", "Camera", "Voice Notes", "Play"].map((activity) => ({
        key: activity,
        value: activity,
        completed: false,
      })),
    );
  }

  //Filter list to have everything but that item that was deleted
  function deleteItem(key) {
    setActivities(activities.filter((activity) => activity.key !== key));
  }

  //Map list so that only the item pressed on changes it's property to completed:true
  function markCompleted(key) {
    setActivities((currentActivities) =>
      currentActivities.map((activity) =>
        activity.key === key ? { ...activity, completed: true } : activity,
      ),
    );
    setCount((remainingSeconds) =>
      Math.min(remainingSeconds + 15, MAX_HEALTH_SECONDS),
    );
    setExp((currentExp) => currentExp + 10);
  }

  //////////////////// SCREEN /////////////////////
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Home Pet Screen</Text>

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
            <View style={[styles.progressBarFill, { width: healthBarWidth }]} />
          </View>
        </View>
      </View>

      <View
        style={[
          styles.placeholderHappy,
          validatedCount < 0.67 && styles.placeholderNeutral,
          validatedCount < 0.33 && styles.placeholderSad,
        ]}
      ></View>
      <Button title="refresh (debug)" color="#122666" onPress={addItem} />
      <FlatList
        style={styles.list}
        data={incompleteActivities}
        keyExtractor={(activity) => activity.key}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemText}>{item.value}</Text>
            <View style={styles.listButtons}>
              <Button
                title="Complete"
                color="#0e8f66"
                onPress={() => markCompleted(item.key)}
              />
            </View>
          </View>
        )}
      />

      {/* Sign out for debugging, remove later */}
      <Button onPress={() => signOut(auth)} title="Sign Out" />
    </View>
  );
}

const styles = StyleSheet.create({
  /////// progress bar //////////

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

  ///////////////////////////////

  //////////// Placeholder pet: ////////////////
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
  ///////////////////////////////////////////////

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
  listButtons: {
    flexDirection: "row",
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
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },
  buttonContainer: {
    padding: 20,
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    color: "#888",
  },
});
