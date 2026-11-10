import { StyleSheet, Text, View, TextInput } from "react-native";

export default function InputText({
  label,
  placeholder,
  secure,
  value,
  onChangeText,
  multiline = false,
  style,
}) {
  return (
    <View style={styles.inputContainer}>
      {label ? <Text style={styles.inputLabel}>{label}:</Text> : null}
      <TextInput
        style={style ? [styles.input, style] : styles.input}
        placeholder={placeholder}
        secureTextEntry={secure}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "column",
  },
  inputLabel: {
    fontWeight: "bold",
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,

    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "white",

    marginVertical: 8,
    borderRadius: 10,
  },
});
