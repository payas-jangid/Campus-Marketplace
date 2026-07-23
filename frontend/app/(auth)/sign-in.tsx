import { AuthView } from "@clerk/expo/native";
import { View } from "react-native";

export default function SignInScreen() {
  return (
    <View style={{ flex: 1,paddingTop:40}}>
      <AuthView isDismissible={false}/>
    </View>
  );
}
