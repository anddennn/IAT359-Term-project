import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./src/firebaseConfig";

import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import PairingScreen from "./src/screens/PairingScreen";
import HomePetScreen from "./src/screens/HomePetScreen";

export default function App() {
  //////////////////////// FUNCTIONS ////////////////////////
  const Stack = createNativeStackNavigator();
  const ProtectedStack = createNativeStackNavigator();

  const [user, setUser] = useState(null);

  //think of a better name than protected screen bc this was just from lecture
  function ProtectedLayout() {
    return (
      <ProtectedStack.Navigator>
        <ProtectedStack.Screen name="PairingScreen" component={PairingScreen} />
        <ProtectedStack.Screen name="HomePetScreen" component={HomePetScreen} />
      </ProtectedStack.Navigator>
    );
  }

  // useEffect hook to listen for Firebase authentication state changes.
  // This runs once when the component mounts.
  useEffect(() => {
    // onAuthStateChanged sets up a listener.
    // it triggers whenever the user logs in, logs out, or the token refreshes.
    onAuthStateChanged(auth, (user) => {
      console.log("user", user);

      // if user is found, 'user' is an object. If logged out, 'user' is null.
      // we update the local state to trigger a re-render of the navigation.
      setUser(user);
    });
  }, []);

  //////////////////////// SCREENS ////////////////////////
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUp">
        {user ? (
          // if user is logged in, show the protected screens
          <Stack.Screen name="Protected" component={ProtectedLayout} />
        ) : (
          // if user is not logged in, show the auth screens
          <>
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
