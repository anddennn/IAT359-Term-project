import { StyleSheet, Text, View } from "react-native";

export default function ProgressBar({ label, value, max, color = "#3b5998" }) {
  const progress =
    Number.isFinite(value) && Number.isFinite(max) && max > 0
      ? Math.min(Math.max(value / max, 0), 1)
      : 0;

  // EXAMPLE:
  // value = 5
  // max = 10

  // min(max((5/10), 0), 1
  // min(0.5, 1)
  // progress = 0.5

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${progress * 100}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  label: {
    fontWeight: "bold",
    minWidth: 25,
  },
  trackContainer: {
    flex: 1,
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  track: {
    height: 8,
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#e0e0df",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 16,
  },
});
