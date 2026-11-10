import { useState, useRef } from "react";
import { Alert, StyleSheet, Text, View, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import BackButton from "../components/BackButton";
import PrimaryButton from "../components/PrimaryButton";

export default function CameraTaskScreen({ navigation, route }) {
  const { onComplete } = route.params;
  const returnToPet = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomePetScreen");
    }
  };

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
        <BackButton title="Back to pet" onPress={returnToPet} />
        <Text>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <BackButton title="Back to pet" onPress={returnToPet} />
        <Text>No camera access</Text>
        <PrimaryButton
          title="Allow camera access"
          onPress={requestPermission}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton title="Back to pet" onPress={returnToPet} />
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
            <PrimaryButton
              title="Flip Cam"
              color="#333"
              onPress={() => {
                setCameraReady(false);
                setCamType(camType === "back" ? "front" : "back");
              }}
            />
            <PrimaryButton
              title="Flash"
              color={flash === "off" ? "gray" : "red"}
              onPress={() => {
                setFlash(flash === "off" ? "on" : "off");
              }}
            />
          </View>
        </CameraView>
      ) : (
        <Image source={{ uri: image }} style={styles.camera} />
      )}
      <View>
        {image ? (
          <View>
            <View style={styles.actionButtons}>
              <PrimaryButton
                title="Retake picture"
                onPress={() => {
                  setCameraReady(false);
                  setImage(null);
                }}
                width="45%"
              />
              <PrimaryButton title="Save" onPress={saveImage} width="45%" />
            </View>
            <PrimaryButton
              title={completing ? "Completing..." : "Complete Task"}
              onPress={handleCompleteTask}
              disabled={completing}
              color="#0e8f66"
            />
          </View>
        ) : (
          <PrimaryButton
            title="Take a picture"
            onPress={takePicture}
            disabled={!cameraReady}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    justifyContent: "flex-start",
    alignContent: "center",
    padding: 20,
    paddingVertical: 40,
    backgroundColor: "#f2f2f2",
  },
  header: {
    fontSize: 24,
    textAlign: "center",
  },
  camera: {
    flex: 1,
    maxHeight: "70%",
    borderRadius: 20,
    padding: 10,
  },
  actionButtons: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
});
