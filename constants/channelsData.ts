export type Channel = {
  id: string;
  name: string;
  description: string;
  department: "PR" | "Marketing" | "Engineering" | "Finance" | "General";
  memberAvatars: string[];
  logo: string;
  color: string;
  unread?: boolean;
  membersCount: number;
};

const CARD_GREEN = "#37CC86";
const CARD_BLUE = "#48A7FF";

export const CHANNELS: Channel[] = [
  {
    id: "1",
    name: "FinTeam",
    description:
      "Horizontal swipeable carousel of channel cards PR/Marketing Channel",
    department: "Finance",
    memberAvatars: [
      "https://i.pravatar.cc/100?img=1",
      "https://i.pravatar.cc/100?img=2",
      "https://i.pravatar.cc/100?img=3",
      "https://i.pravatar.cc/100?img=4",
      "https://i.pravatar.cc/100?img=5",
    ],
    logo: "https://i.ibb.co/7GZ5g38/phx.png",
    color: CARD_GREEN,
    unread: true,
    membersCount: 36,
  },
  {
    id: "2",
    name: "ZEETeam",
    description:
      "Horizontal swipeable carousel of channel cards PR/Marketing Channel",
    department: "PR",
    memberAvatars: [
      "https://i.pravatar.cc/100?img=6",
      "https://i.pravatar.cc/100?img=7",
      "https://i.pravatar.cc/100?img=8",
      "https://i.pravatar.cc/100?img=9",
      "https://i.pravatar.cc/100?img=10",
    ],
    logo: "https://i.ibb.co/7GZ5g38/phx.png",
    color: CARD_BLUE,
    unread: false,
    membersCount: 52,
  },
  {
    id: "3",
    name: "ZEETeam",
    description:
      "Horizontal swipeable carousel of channel cards PR/Marketing Channel",
    department: "Marketing",
    memberAvatars: [
      "https://i.pravatar.cc/100?img=11",
      "https://i.pravatar.cc/100?img=12",
      "https://i.pravatar.cc/100?img=13",
      "https://i.pravatar.cc/100?img=14",
      "https://i.pravatar.cc/100?img=15",
    ],
    logo: "https://i.ibb.co/7GZ5g38/phx.png",
    color: CARD_GREEN,
    unread: true,
    membersCount: 21,
  },
  {
    id: "4",
    name: "ZEETeam",
    description:
      "Horizontal swipeable carousel of channel cards PR/Marketing Channel",
    department: "Engineering",
    memberAvatars: [
      "https://i.pravatar.cc/100?img=16",
      "https://i.pravatar.cc/100?img=17",
      "https://i.pravatar.cc/100?img=18",
      "https://i.pravatar.cc/100?img=19",
      "https://i.pravatar.cc/100?img=20",
    ],
    logo: "https://i.ibb.co/7GZ5g38/phx.png",
    color: CARD_BLUE,
    unread: false,
    membersCount: 64,
  },
];
