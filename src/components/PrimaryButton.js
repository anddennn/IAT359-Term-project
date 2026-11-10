import { StyleSheet, Text, TouchableOpacity } from "react-native";

// Primary button used for main CTA actions -> filled colour

export default function PrimaryButton({
  title,
  color = "#2563EB",
  onPress,
  disabled = false,
  style,
  width = "auto",
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: color, width: width },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    borderRadius: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
