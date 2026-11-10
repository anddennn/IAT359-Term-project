import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "./PrimaryButton";

export default function ActivityListItem({
  label,
  actionLabel,
  onAction,
  actionColor,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <PrimaryButton
        title={actionLabel}
        color={actionColor}
        onPress={onAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#a9aec2",
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  label: {
    flexShrink: 1,
    fontSize: 16,
    color: "#484e63",
    margin: 10,
  },
});
