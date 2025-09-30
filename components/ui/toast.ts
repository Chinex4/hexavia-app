import Toast from "react-native-toast-message";

export function showSuccess(message: string, description?: string) {
  Toast.show({
    type: "success",
    text1: message,
    text2: description,
    position: "top",
  });
}
export function showError(message: string, description?: string) {
  Toast.show({
    type: "error",
    text1: message,
    text2: description,
    position: "top",
    visibilityTime: 4000,
  });
}

export async function showPromise<T>(
  p: Promise<T>,
  loadingMessage = "Please wait…",
  successMessage = "Success"
): Promise<T> {
  Toast.show({
    type: "info",
    text1: loadingMessage,
    autoHide: false,
    position: "top",
  });

  try {
    const res = await p;
    Toast.hide();
    Toast.show({ type: "success", text1: successMessage, position: "top" });
    return res;
  } catch (e: any) {
    // 🔎 noisy console logging so you can see what's going on
    // eslint-disable-next-line no-console
    console.log("[showPromise] error", {
      message: e?.message,
      status: e?.response?.status,
      data: e?.response?.data,
      url: e?.config?.url,
      method: e?.config?.method,
      params: e?.config?.params,
      body: e?.config?.data,
    });

    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Something went wrong";

    Toast.hide();
    Toast.show({
      type: "error",
      text1: msg,
      position: "top",
      visibilityTime: 5000,
    });
    throw e;
  }
}
