// hooks/useGoogleIdToken.ts
import { useCallback, useMemo, useState } from "react";
import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";

type GoogleProfile = {
  email: string;
  name: string | null;
  photo: string | null;
  id: string;
};

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

export function useGoogleIdToken() {
  const [loading, setLoading] = useState(false);

  // ENV ONLY (as requested)
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  // Expo Go => MUST use Web client + Expo proxy redirect
  const USE_EXPO_PROXY = true;

  // Build the Expo proxy redirect explicitly to avoid TS flags:
  // Set these two envs to your Expo account + app slug (from app.json: expo.slug)
  const expoUsername = process.env.EXPO_PUBLIC_EXPO_USERNAME; // e.g. "heischinex"
  const expoSlug = process.env.EXPO_PUBLIC_EXPO_SLUG;         // e.g. "unipaddy"

  const redirectUri = useMemo(() => {
    if (USE_EXPO_PROXY) {
      if (!expoUsername || !expoSlug) {
        throw new Error(
          "Set EXPO_PUBLIC_EXPO_USERNAME and EXPO_PUBLIC_EXPO_SLUG envs for the Expo proxy redirect."
        );
      }
      return `https://auth.expo.dev/@${expoUsername}/${expoSlug}`;
      // (legacy also works: https://auth.expo.io/@${expoUsername}/${expoSlug})
    }
    // Dev client / production: use your own app scheme
    return AuthSession.makeRedirectUri({ scheme: "unipaddy" });
  }, [USE_EXPO_PROXY, expoUsername, expoSlug]);

  const clientId = useMemo(() => {
    if (USE_EXPO_PROXY) return webClientId; // web client for proxy
    return Platform.select({ ios: iosClientId, android: androidClientId, default: webClientId });
  }, [USE_EXPO_PROXY, iosClientId, androidClientId, webClientId]);

  if (!clientId) {
    throw new Error(
      "Missing Google OAuth clientId. Ensure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and IOS/ANDROID when not using proxy) are set."
    );
  }

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,                                  // <- critical
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,                                // <- avoid Google 400 on code_challenge_method
      scopes: ["openid", "email", "profile"],
      extraParams: {
        nonce: Math.random().toString(36).slice(2),
        response_mode: "fragment",
        prompt: "select_account",
      },
    },
    discovery
  );

  const signIn = useCallback(async () => {
    if (!request) return { cancelled: true as const };
    setLoading(true);
    try {
      // No options (keeps your installed types happy)
      const res = await promptAsync();
      if (res.type !== "success") return { cancelled: true as const };

      const idToken = (res.params as any).id_token as string | undefined;
      if (!idToken) throw new Error("No id_token returned");

      const profile: GoogleProfile = { email: "", name: null, photo: null, id: "" };
      return { cancelled: false as const, idToken, profile };
    } finally {
      setLoading(false);
    }
  }, [promptAsync, request]);

  const signOut = useCallback(async () => {
    // Clear your app session
  }, []);

  return { signIn, signOut, loading };
}
