// app/(clients)/ClientChannelSanctions.tsx
import React, { useEffect, useMemo } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSanctions } from "@/redux/sanctions/sanctions.thunks";
import {
  selectSanctionsLoading,
  selectSanctionsState,
} from "@/redux/sanctions/sanctions.slice";
import { makeSelectActiveSanctionsForChannelMembers } from "@/redux/sanctions/sanctions.selectors";

const PRIMARY = "#4C5FAB";

type Props = {
  channelId: string; // channel that the client belongs to
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClientChannelSanctions({ channelId }: Props) {
  const dispatch = useAppDispatch();

  // Fetch once for _all if not fetched already
  const { fetchedFor } = useAppSelector(selectSanctionsState);
  useEffect(() => {
    if (!fetchedFor["_all"]) {
      dispatch(fetchSanctions()); // no userId => fetch all
    }
  }, [dispatch, fetchedFor]);

  const loading = useAppSelector(selectSanctionsLoading);

  // Filtered rows: only active sanctions for members of this channel
  const selectRows = useMemo(
    () => makeSelectActiveSanctionsForChannelMembers(channelId),
    [channelId]
  );
  const rows = useAppSelector(selectRows);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="px-4 pt-4 pb-2">
        <Text className="text-lg font-kumbhBold text-gray-900">
          Active Sanctions (Channel)
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          Showing sanctions for staff who belong to this client’s channel.
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={PRIMARY} />
          <Text className="mt-2 text-gray-500 font-kumbh text-sm">
            Loading…
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i: any) => String(i?._id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-gray-500 font-kumbh">
                No active sanctions for members of this channel.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const recipientName =
              item?.user?.fullname ??
              item?.user?.name ??
              item?.sanctionUser?.username ??
              item?.sanctionUser?.email ??
              "Unknown";

            return (
              <View
                className="mb-3 p-4 rounded-2xl bg-white"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className="text-[15px] font-kumbhBold text-gray-900"
                    numberOfLines={1}
                  >
                    {recipientName}
                  </Text>
                  <View
                    className="px-2 py-[2px] rounded-full"
                    style={{ backgroundColor: "#E8EDFF" }}
                  >
                    <Text
                      className="text-[11px] font-kumbhBold"
                      style={{ color: PRIMARY }}
                    >
                      {String(item?.type ?? "").toUpperCase() || "—"}
                    </Text>
                  </View>
                </View>

                <Text
                  className="text-[13px] text-gray-800 mb-2"
                  numberOfLines={3}
                >
                  {item?.reason || "—"}
                </Text>

                <View className="flex-row">
                  <Text className="text-[12px] text-gray-500">
                    Created:&nbsp;
                  </Text>
                  <Text className="text-[12px] text-gray-700">
                    {formatDate(item?.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
