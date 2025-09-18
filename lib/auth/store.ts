// // lib/auth/store.ts
// import { create } from "zustand";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { persist, createJSONStorage } from "zustand/middleware";

// export type Role = "client" | "staff" | "admin" | null;

// type Session = {
//   token: string | null; // keep null for now in “dummy” mode
//   role: Role; // <- the key for routing
// };

// type AuthState = {
//   session: Session;
//   setSession: (s: Partial<Session>) => void;
//   clearSession: () => void;
// };

// export const useAuth = create<AuthState>()(
//   persist(
//     (set) => ({
//       session: { token: null, role: null },
//       setSession: (s) =>
//         set((state) => ({ session: { ...state.session, ...s } })),
//       clearSession: () => set({ session: { token: null, role: null } }),
//     }),
//     {
//       name: "hexavia-auth",
//       storage: createJSONStorage(() => AsyncStorage),
//     }
//   )
// );
