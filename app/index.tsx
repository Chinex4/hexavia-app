import { bootstrapSession, ensureProfile } from "@/redux/auth/auth.slice";
import { STORAGE_KEYS } from "@/storage/keys";
import { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function Splash() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hydrated, phase, user } = useAppSelector((s: RootState) => s.auth);
  const token = useAppSelector((s: RootState) => s.auth.token);

  useEffect(() => {
    dispatch(bootstrapSession());
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (phase === "authenticated") {
      // kick off profile fetch if needed (shows loading state)
      dispatch(ensureProfile());
    }
  }, [hydrated, phase]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      // const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      // const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);

      // if (!token && !user) {
      //   router.replace("/(auth)/login");
      // } else {
      //   if (user?.includes('"role":"client"')) {
      //     router.replace("/(client)/(tabs)");
      //   } else if (user?.includes('"role":"staff"')) {
      //     router.replace("/(staff)/(tabs)");
      //   } else if (user?.includes('"role":"super-admin"')) {
      //     router.replace("/(admin)");
      //   } else {
      //     router.replace("/(admin)");
      //   }
      // }

      if (!hydrated) return;

      if (phase === "idle") {
        router.replace("/(auth)/login");
      } else if (phase === "authenticated") {
        const role = user?.role; // might be null initially if not fetched yet
        // Optional: route quickly using lastKnownRole stored in user object (if you save it),
        // otherwise send to a neutral gate that shows a spinner until profile completes.
        if (role === "client") router.replace("/(client)/(tabs)");
        else if (role === "staff") router.replace("/(staff)/(tabs)");
        else if (role === "admin") router.replace("/(admin)");
        else router.replace("/(admin)");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [hydrated, phase, user?.role]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
      />
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4C5FAB",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
});
