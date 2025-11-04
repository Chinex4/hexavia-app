// redux/sanctions/sanctions.selectors.ts
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { selectSanctions } from "./sanctions.slice";
import { selectChannelById } from "@/redux/channels/channels.slice";

const memberIdOf = (m: any): string | null => {
  if (!m) return null;
  if (typeof m === "string") return m;
  return (
    m._id ??
    m.id ??
    m.userId ??
    m.memberId ??
    (m.user && (m.user._id ?? m.user.id ?? m.user.userId)) ??
    null
  );
};

/**
 * Factory selector:
 * Returns ONLY active sanctions (isActive === true)
 * for staff that are members of the given channelId.
 */
export const makeSelectActiveSanctionsForChannelMembers = (
  channelId?: string | null
) =>
  createSelector(
    [
      (s: RootState) => (channelId ? selectChannelById(channelId)(s) : null),
      (s: RootState) => selectSanctions(s),
    ],
    (channel, sanctions) => {
      if (!channel) return [];
      const members: any[] = Array.isArray((channel as any)?.members)
        ? (channel as any).members
        : [];

      const memberIds = new Set(
        members
          .map(memberIdOf)
          .filter((id: string | null): id is string => Boolean(id))
      );

      return (sanctions as any[]).filter((s) => {
        const sid =
          s?.userId ??
          s?.user?._id ??
          s?.sanctionUser?._id ??
          null;

        return Boolean(s?.isActive === true && sid && memberIds.has(String(sid)));
      });
    }
  );

