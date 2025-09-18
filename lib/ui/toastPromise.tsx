import { ToastType } from "react-native-toast-notifications";

type Opts = {
  loading?: string;
  success?: string | ((val: any) => string);
  error?: string | ((err: any) => string);
  type?: ToastType;
  placement?: "top" | "bottom" | "center"; // or string, depending on your usage
};

export async function toastPromise<T>(
  toast: { show: (msg: string, cfg?: any) => any; hide: (id?: any) => void },
  promise: Promise<T>,
  opts: Opts = {}
) {
  const loadingId = toast.show(opts.loading ?? "Please wait…", {
    type: "normal",
    placement: opts.placement ?? "top",
    duration: 0,
  });

  try {
    const val = await promise;
    const msg = typeof opts.success === "function" ? opts.success(val) : (opts.success ?? "Done");
    toast.hide(loadingId);
    toast.show(msg, { type: opts.type ?? "success", placement: opts.placement ?? "top" });
    return val;
  } catch (err: any) {
    const msg = typeof opts.error === "function" ? opts.error(err) : (opts.error ?? "Something went wrong");
    toast.hide(loadingId);
    toast.show(msg, { type: "danger", placement: opts.placement ?? "top" });
    throw err;
  }
}
