// redux/admin/admin.slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AdminState, AdminRole, AdminUser } from "./admin.types";
import {
  downgradeAdmin,
  fetchAdminUsers,
  promoteUser,
  toggleUserSuspension,
  adminAddChannelMember,
  adminRemoveChannelMember,
  adminUpdateChannelMemberRole,
} from "./admin.thunks";
import type { RootState } from "@/store";

const initialState: AdminState = {
  users: [],
  count: null,

  fetchingUsers: false,
  suspending: false,
  promoting: false,
  downgrading: false,

  addingMember: false,
  removingMember: false,
  updatingMemberRole: false,

  roleFilter: undefined,
  lastError: null,
  lastActionMessage: null,
};

const upsertUser = (list: AdminUser[], updated: AdminUser) => {
  const idx = list.findIndex((u) => u._id === updated._id);
  if (idx >= 0) list[idx] = { ...list[idx], ...updated };
  else list.unshift(updated);
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setRoleFilter(state, action: PayloadAction<AdminRole | undefined>) {
      state.roleFilter = action.payload;
    },
    clearAdminError(state) {
      state.lastError = null;
    },
    resetAdmin(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // FETCH USERS
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.fetchingUsers = true;
        state.lastError = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.fetchingUsers = false;
        state.users = action.payload.data ?? [];
        state.count = action.payload.count ?? state.users.length;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.fetchingUsers = false;
        state.lastError =
          (action.payload as string) ||
          action.error.message ||
          "Failed to load users";
      });

    // SUSPEND/UNSUSPEND
    builder
      .addCase(toggleUserSuspension.pending, (state) => {
        state.suspending = true;
        state.lastError = null;
      })
      .addCase(toggleUserSuspension.fulfilled, (state, action) => {
        state.suspending = false;
        const updated = (action.payload as any)?.user as AdminUser | undefined;
        if (updated?._id) upsertUser(state.users, updated);
        state.lastActionMessage = "Suspension updated";
      })
      .addCase(toggleUserSuspension.rejected, (state, action) => {
        state.suspending = false;
        state.lastError =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update suspension";
      });

    // PROMOTE
    builder
      .addCase(promoteUser.pending, (state) => {
        state.promoting = true;
        state.lastError = null;
      })
      .addCase(promoteUser.fulfilled, (state, action) => {
        state.promoting = false;
        const updated = (action.payload as any)?.user as AdminUser | undefined;
        if (updated?._id) upsertUser(state.users, updated);
        state.lastActionMessage = "User promoted";
      })
      .addCase(promoteUser.rejected, (state, action) => {
        state.promoting = false;
        state.lastError =
          (action.payload as string) ||
          action.error.message ||
          "Failed to promote user";
      });

    // DOWNGRADE
    builder
      .addCase(downgradeAdmin.pending, (state) => {
        state.downgrading = true;
        state.lastError = null;
      })
      .addCase(downgradeAdmin.fulfilled, (state, action) => {
        state.downgrading = false;
        const updated = (action.payload as any)?.user as AdminUser | undefined;
        if (updated?._id) upsertUser(state.users, updated);
        state.lastActionMessage = "Admin downgraded";
      })
      .addCase(downgradeAdmin.rejected, (state, action) => {
        state.downgrading = false;
        state.lastError =
          (action.payload as string) ||
          action.error.message ||
          "Failed to downgrade admin";
      });

    // CHANNEL MEMBER – ADD
    builder
      .addCase(adminAddChannelMember.pending, (state) => {
        state.addingMember = true;
        state.lastError = null;
      })
      .addCase(adminAddChannelMember.fulfilled, (state, action) => {
        state.addingMember = false;
        state.lastActionMessage = action.payload?.message ?? "Member added";
      })
      .addCase(adminAddChannelMember.rejected, (state, action) => {
        state.addingMember = false;
        state.lastError =
          (action.payload as string) ||
          action.error.message ||
          "Failed to add member";
      });

    // CHANNEL MEMBER – REMOVE
    builder
      .addCase(adminRemoveChannelMember.pending, (state) => {
        state.removingMember = true;
        state.lastError = null;
      })
      .addCase(adminRemoveChannelMember.fulfilled, (state, action) => {
        state.removingMember = false;
        state.lastActionMessage = action.payload?.message ?? "Member removed";
      })
      .addCase(adminRemoveChannelMember.rejected, (state, action) => {
        state.removingMember = false;
        state.lastError =
          (action.payload as string) ||
          action.error.message ||
          "Failed to remove member";
      });

    // CHANNEL MEMBER – UPDATE ROLE
    builder
      .addCase(adminUpdateChannelMemberRole.pending, (state) => {
        state.updatingMemberRole = true;
        state.lastError = null;
      })
      .addCase(adminUpdateChannelMemberRole.fulfilled, (state, action) => {
        state.updatingMemberRole = false;
        state.lastActionMessage =
          action.payload?.message ?? "Member role updated";
      })
      .addCase(adminUpdateChannelMemberRole.rejected, (state, action) => {
        state.updatingMemberRole = false;
        state.lastError =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update member role";
      });
  },
});

export const { setRoleFilter, clearAdminError, resetAdmin } =
  adminSlice.actions;

export default adminSlice.reducer;

/* ----------------- Selectors ----------------- */
export const selectAdminState = (s: RootState) => s.admin;
export const selectAdminUsers = (s: RootState) => s.admin.users;
export const selectAdminCount = (s: RootState) =>
  s.admin.count ?? s.admin.users.length;

export const selectAdminLoading = (s: RootState) =>
  s.admin.fetchingUsers ||
  s.admin.suspending ||
  s.admin.promoting ||
  s.admin.downgrading ||
  s.admin.addingMember ||
  s.admin.removingMember ||
  s.admin.updatingMemberRole;

export const selectAdminErrors = (s: RootState) => s.admin.lastError;
export const selectAdminRoleFilter = (s: RootState) => s.admin.roleFilter;
export const selectAdminLastActionMessage = (s: RootState) =>
  s.admin.lastActionMessage;
