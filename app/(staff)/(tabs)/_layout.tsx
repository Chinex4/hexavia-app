import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, View } from "react-native";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectFirstChannelId } from "@/redux/channels/channels.selectors";
import { fetchChannels } from "@/redux/channels/channels.thunks";

const PRIMARY = "#4C5FAB";
const INACTIVE = "#9CA3AF";

function TabButton({
  focused,
  label,
  activeName,
  inactiveName,
}: {
  focused: boolean;
  label: string;
  activeName: React.ComponentProps<typeof Ionicons>["name"];
  inactiveName: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View
      className="rounded-xl"
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: "center",
        backgroundColor: "transparent",
        width: 75,
      }}
    >
      <Ionicons
        name={focused ? activeName : inactiveName}
        size={24}
        color={focused ? PRIMARY : INACTIVE}
      />
      <Text
        style={{
          marginTop: 4,
          fontSize: 12,
          fontFamily: focused ? "KumbhSans-Bold" : "KumbhSans-Regular",
          fontWeight: "500",
          color: focused ? PRIMARY : INACTIVE,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function StaffTabsLayout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // ✅ make sure channels exist so "first id" is not null
  useEffect(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

  const firstChannelId = useAppSelector(selectFirstChannelId);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          height: 75,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          paddingHorizontal: 18,
          paddingVertical: 10,
          paddingTop: 6,
          borderTopColor: "#eee",
        },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton
              focused={focused}
              label="Home"
              activeName="home"
              inactiveName="home-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="tasks/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton
              focused={focused}
              label="Task"
              activeName="clipboard"
              inactiveName="clipboard-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chats/[channelId]"
        listeners={{
          tabPress: (e) => {
            if (!firstChannelId) return;
            e.preventDefault();
            router.push({
              pathname: "/(client)/(tabs)/chats/[channelId]",
              params: { channelId: firstChannelId },
            });
          },
        }}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton
              focused={focused}
              label="Chat"
              activeName="chatbubble"
              inactiveName="chatbubble-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton
              focused={focused}
              label="Profile"
              activeName="person"
              inactiveName="person-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}
