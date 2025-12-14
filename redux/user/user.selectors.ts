import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store";

type BasicUser = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  avatar?: string;
  profilePicture?: string;
  photoUrl?: string;
};

const selectMe = (state: RootState) => state.user.user as BasicUser | null;
const selectUserId = (_: RootState, userId?: string | null) => userId;

// Memoized selector so useSelector doesn't see a new object on every call
export const selectUserById = createSelector(
  [selectMe, selectUserId],
  (me, userId) => {
    if (!userId) return undefined;

    const meId = (me?._id ?? me?.id) as string | undefined;
    if (me && meId && meId === userId) {
      return {
        id: meId,
        name:
          me.name ??
          me.fullName ??
          me.username ??
          (me.email ? me.email.split("@")[0] : "Member"),
        avatarUrl: me.avatar ?? me.profilePicture ?? me.photoUrl ?? undefined,
      };
    }

    return undefined;
  }
);
