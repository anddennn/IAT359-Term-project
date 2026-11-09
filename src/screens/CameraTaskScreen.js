import { useState, useRef } from "react";
import { Alert, StyleSheet, Text, View, Button, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Asset, requestPermissionsAsync } from "expo-media-library";

export default function CameraTaskScreen({ navigation, route }) {
  const { onComplete } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [camType, setCamType] = useState("back");
  const [flash, setFlash] = useState("off");
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);

  const handleCompleteTask = async () => {
    if (completing) return;

    setCompleting(true);

    try {
      await onComplete();

      Alert.alert("Task completed!", "Your pet received EXP and health.");
      navigation.navigate("HomePetScreen");
    } catch (error) {
      Alert.alert("Unable to complete task", error.message);
    } finally {
      setCompleting(false);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && cameraReady) {
      try {
        const data = await cameraRef.current.takePictureAsync();
        setCameraReady(false);
        setImage(data.uri);
      } catch (e) {
        console.error("Error taking picture:", e);
        Alert.alert("Unable to take picture", e.message);
      }
    }
  };

  const saveImage = async () => {
    if (image) {
      try {
        const permission = await requestPermissionsAsync(true, ["photo"]);
        if (!permission.granted) {
          Alert.alert(
            "Permission required",
            "Allow photo access to save this picture.",
          );
          return;
        }
        await Asset.create(image);
        Alert.alert(
          "Picture saved",
          "The picture was saved to your photo library.",
        );
        setImage(null);
      } catch (e) {
        console.error("Error saving picture:", e);
        Alert.alert("Unable to save picture", e.message);
      }
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>No camera access</Text>
        <Button title="Allow camera access" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Camera</Text>
      {!image ? (
        <CameraView
          style={styles.camera}
          facing={camType}
          flash={flash}
          ref={cameraRef}
          onCameraReady={() => setCameraReady(true)}
        >
          <View style={styles.actionButtons}>
            <View style={styles.buttonContainer}>
              <Button
                title={"Flip Cam"}
                color={"#333"}
                onPress={() => {
                  setCameraReady(false);
                  setCamType(camType === "back" ? "front" : "back");
                }}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title={"Flash"}
                color={flash === "off" ? "gray" : "red"}
                onPress={() => {
                  setFlash(flash === "off" ? "on" : "off");
                }}
              />
            </View>
          </View>
        </CameraView>
      ) : (
        <Image source={{ uri: image }} style={styles.camera} />
      )}
      <View>
        {image ? (
          <View>
            <View style={styles.buttonContainer}>
              <Button
                title={completing ? "Completing..." : "Complete Task"}
                onPress={handleCompleteTask}
                disabled={completing}
              />
            </View>
            <View style={styles.actionButtons}>
              <View style={styles.buttonContainer}>
                <Button
                  title={"Retake picture"}
                  onPress={() => {
                    setCameraReady(false);
                    setImage(null);
                  }}
                />
              </View>
              <View style={styles.buttonContainer}>
                <Button title={"Save"} onPress={saveImage} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <Button
              title="Take a picture"
              onPress={takePicture}
              disabled={!cameraReady}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignContent: "flex-start",
    padding: 16,
    backgroundColor: "#f2f2f2",
  },
  header: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  camera: {
    flex: 1,
    maxHeight: "70%",
    borderRadius: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 50,
  },
  buttonContainer: {
    padding: 20,
  },
});
