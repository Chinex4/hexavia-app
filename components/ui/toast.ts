import Toast from "react-native-toast-message";

export function showSuccess(message: string, description?: string) {
  Toast.show({
    type: "success",
    text1: message,
    text2: description,
    visibilityTime: 2500,
    position: "top",
  });
}
export function showError(message: string, description?: string) {
  Toast.show({
    type: "error",
    text1: message,
    text2: description,
    visibilityTime: 3500,
    position: "top",
  });
}

export async function showPromise<T>(
  p: Promise<T>,
  loadingMessage = "Please wait…",
  successMessage = "Success"
): Promise<T> {
  const id = Date.now().toString();
  Toast.show({
    type: "info",
    text1: loadingMessage,
    autoHide: false,
    position: "top",
    onPress: () => Toast.hide(),
    props: { id },
  });

  try {
    const res = await p;
    Toast.hide();
    Toast.show({
      type: "success",
      text1: successMessage,
      visibilityTime: 2200,
      position: "top",
    });
    return res;
  } catch (e: any) {
    const msg =
      e?.response?.data?.message || e?.message || "Something went wrong";
    Toast.hide();
    Toast.show({
      type: "error",
      text1: msg,
      visibilityTime: 4000,
      position: "top",
    });
    throw e;
  }
}
