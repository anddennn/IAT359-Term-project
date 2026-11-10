import PrimaryButton from "./PrimaryButton";

export default function BackButton({ onPress, title = "Back" }) {
  return (
    <PrimaryButton
      title={title}
      onPress={onPress}
      style={{ alignSelf: "flex-start", marginVertical: 0 }}
    />
  );
}
