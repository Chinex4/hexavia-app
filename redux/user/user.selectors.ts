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

export const selectUserById = (state: RootState, userId?: string | null) => {
  if (!userId) return undefined;

  const me: BasicUser | null = state.user.user as any;
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
};
