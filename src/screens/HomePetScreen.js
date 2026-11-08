import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import SharedPetView from "../components/SharedPetView";
import PartnerPetScreen from "./PartnerPetScreen";
import LocationScreen from "./LocationScreen";

const Tab = createBottomTabNavigator();

function CurrentUserPetScreen() {
  return <SharedPetView />;
}

export default function HomePetScreen() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={CurrentUserPetScreen} />
      <Tab.Screen name="Partner" component={PartnerPetScreen} />
      <Tab.Screen name="Location" component={LocationScreen} />
    </Tab.Navigator>
  );
}
