import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Secondary button showing up as text and hyperlink

export default function SecondaryButton({
  text,
  link,
  onPress,
  disabled = false,
  style,
}) {
  return (
    <View style={styles.row}>
      <Text>{text}</Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}
        style={[disabled && styles.disabled, style]}
      >
        <Text style={styles.link}>{link}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  link: {
    color: "#2563EB",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
