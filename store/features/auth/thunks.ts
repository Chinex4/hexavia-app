import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser, Role } from "./types";

// 🔧 Dummy login: pick role based on identifier prefix for now
// "admin:*" -> admin, "staff:*" -> staff, otherwise client.
export const loginThunk = createAsyncThunk<AuthUser, { identifier: string }>(
  "auth/login",
  async ({ identifier }) => {
    await new Promise((r) => setTimeout(r, 1200)); // simulate network

    let role: Role = "client";
    if (identifier.startsWith("admin:")) role = "admin";
    else if (identifier.startsWith("staff:")) role = "staff";

    const user: AuthUser = {
      id: Date.now(),
      name: identifier.replace(/^(admin:|staff:)/, ""),
      email: identifier.includes("@")
        ? identifier
        : `${identifier}@example.com`,
      role,
    };

    await AsyncStorage.setItem("hex_auth_user", JSON.stringify(user));
    return user;
  }
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await AsyncStorage.removeItem("hex_auth_user");
});

export const bootstrapAuthThunk = createAsyncThunk(
  "auth/bootstrap",
  async () => {
    const raw = await AsyncStorage.getItem("hex_auth_user");
    return raw ? JSON.parse(raw) : null;
  }
);
