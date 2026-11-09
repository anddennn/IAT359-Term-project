import React, { useState, useEffect } from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert} from "react-native";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// A temporary list of questions. 
const QUESTIONS = [
  "What is your partner's go-to comfort movie?",
  "What is your partner's favorite meal?",
  "What is a habit your partner has that makes you smile?",
  "What is your partner's dream vacation destination?",
];

export default function QAScreen({ route, navigation }) {
  const { pairingId, userId, partnerId, onComplete } = route.params;

  const [pairingData, setPairingData] = useState(null);
  const [myAnswerInput, setMyAnswerInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  //both users see the same question and answers at the same time.
  useEffect(() => {
    const pairingRef = doc(db, "pairings", pairingId);
    
    const unsubscribe = onSnapshot(pairingRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // If there isn't a question chosen yet, picks a random one and saves it to the database
        if (!data.qaSession) {
          const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
          await updateDoc(pairingRef, {
            qaSession: {
              question: randomQ,
              answers: {}, 
            },
          });
        } else {
          setPairingData(data);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pairingId]);

  if (loading || !pairingData?.qaSession) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0e8f66" />
      </View>
    );
  }

  // Figure out who has answered based on the database data
  const qaSession = pairingData.qaSession;
  const myAnswer = qaSession.answers[userId];
  const partnerAnswer = partnerId ? qaSession.answers[partnerId] : null;

  const hasAnswered = !!myAnswer;
  const partnerHasAnswered = !!partnerAnswer;
  const bothAnswered = hasAnswered && partnerHasAnswered;

  // Save the user's typed answer to the database. 
  const handleSubmitAnswer = async () => {
    if (!myAnswerInput.trim()) return; // Don't submit if the box is empty
    
    const pairingRef = doc(db, "pairings", pairingId);
    await updateDoc(pairingRef, {
      [`qaSession.answers.${userId}`]: myAnswerInput.trim(),
    });
  };

  // give exp when both users answer
  const handleCompleteTask = async () => {
    if (completing) return;
    setCompleting(true);

    try {
      // Clear the current question from the database
      const pairingRef = doc(db, "pairings", pairingId);
      await updateDoc(pairingRef, { qaSession: null });

      if (onComplete) {
        await onComplete();
      }

      Alert.alert("Task completed!", "Your pet received EXP and health.");
      navigation.navigate("HomePetScreen");
    } catch (error) {
      console.error("Error completing QA task:", error);
      Alert.alert("Unable to complete task", error.message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Q&A</Text>
      
      <Text style={styles.questionText}>{qaSession.question}</Text>

      {!hasAnswered ? (
        <View style={styles.contentBlock}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer..."
            value={myAnswerInput}
            onChangeText={setMyAnswerInput}
            multiline
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitAnswer}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contentBlock}>
          
          <View style={styles.answerRow}>
            <Text style={styles.avatarIcon}>👤</Text>
            <Text style={styles.answerText}>{myAnswer}</Text>
          </View>

          <View style={styles.answerRow}>
            <Text style={styles.avatarIcon}>👤</Text>
            <Text
              style={[
                styles.answerText,
                !partnerHasAnswered && styles.pendingText,
              ]}
            >
              {partnerHasAnswered ? partnerAnswer : "Pending..."}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.expBtn, (!bothAnswered || completing) && styles.expBtnDisabled]}
            disabled={!bothAnswered || completing}
            onPress={handleCompleteTask}
          >
            <Text style={styles.expBtnText}>
              {completing ? "Completing..." : "Complete Task"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  questionText: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 30,
    lineHeight: 28,
    color: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 15,
  },
  contentBlock: {
    flex: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 4,
    padding: 15,
    fontSize: 16,
    minHeight: 60,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  submitBtn: {
    backgroundColor: "#0e8f66",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
  },
  avatarIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  answerText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  pendingText: {
    color: "#aaa",
    fontStyle: "italic",
    fontWeight: "400",
  },
  expBtn: {
    backgroundColor: "#0e8f66",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: "auto", 
    marginBottom: 40, 
  },
  expBtnDisabled: {
    backgroundColor: "#aaa",
  },
  expBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});