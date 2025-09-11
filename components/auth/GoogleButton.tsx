// components/auth/GoogleButton.tsx
import { Pressable, Text, View, ActivityIndicator, Image } from 'react-native';
import { useGoogleIdToken } from '@/hooks/useGoogleIdToken';

export default function GoogleButton({ onToken }: { onToken: (t: string) => void }) {
  const { signIn, loading } = useGoogleIdToken();

  type GoogleSignInResult =
    | { idToken: string }
    | { cancelled: true }
    | null;

  async function onPress() {
    const res = await signIn() as GoogleSignInResult;
    if (res && !('cancelled' in res) && 'idToken' in res && res.idToken) {
      onToken(res.idToken); // POST { id_token } to Laravel
    }
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="mt-6 py-3 rounded-xl bg-gray-100 flex-row items-center justify-center active:opacity-90"
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View className="flex-row items-center">
          <Image source={require('@/assets/images/google.png')} className="w-5 h-5 mr-2" />
          <Text className="text-black font-kumbh">Continue with Google</Text>
        </View>
      )}
    </Pressable>
  );
}
