import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import BackButton from "../components/BackButton";
import InputText from "../components/InputText";
import PrimaryButton from "../components/PrimaryButton";

// A temporary list of questions.
const QUESTIONS = [
  "What is your partner's go-to comfort movie?",
  "What is your partner's favorite meal?",
  "What is a habit your partner has that makes you smile?",
  "What is your partner's dream vacation destination?",
];

export default function QAScreen({ route, navigation }) {
  const { pairingId, userId, partnerId, onComplete } = route.params;
  const returnToPet = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomePetScreen");
    }
  };

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
          const randomQ =
            QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
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
        <BackButton title="Back to pet" onPress={returnToPet} />
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
      <BackButton title="Back to pet" onPress={returnToPet} />
      <Text style={styles.title}>Q&A</Text>

      <Text style={styles.questionText}>{qaSession.question}</Text>

      {!hasAnswered ? (
        <View style={styles.contentBlock}>
          <InputText
            placeholder="Type your answer..."
            value={myAnswerInput}
            onChangeText={setMyAnswerInput}
            multiline
          />
          <PrimaryButton
            title="Submit"
            color="#0e8f66"
            onPress={handleSubmitAnswer}
            style={styles.submitButton}
          />
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

          <PrimaryButton
            title={completing ? "Completing..." : "Complete Task"}
            color="#0e8f66"
            disabled={!bothAnswered || completing}
            onPress={handleCompleteTask}
            style={styles.completeButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    padding: 24,
    backgroundColor: "#f2f2f2",
    paddingVertical: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
    lineHeight: 28,
    color: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 15,
  },
  contentBlock: {
    flex: 1,
  },
  submitButton: {
    width: "100%",
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
  completeButton: {
    width: "100%",
    marginTop: "auto",
    marginBottom: 40,
  },
});
