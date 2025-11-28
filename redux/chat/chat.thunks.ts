import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/api/axios";
import type { RootState } from "@/store";
import { showPromise } from "@/components/ui/toast";

type FetchArgs = {
  id: string;
  type: "community" | "direct";
  limit?: number;
  skip?: number;
};

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ id, type, limit = 50, skip = 0 }: FetchArgs) => {
    const { data } = await showPromise(api.get(`/messages/${id}/${type}`, {
      params: { limit, skip },
    }), "Loading old messages", "Done");
    // console.log(data)
    return {
      threadId: id,
      kind: type,
      items: data?.messages ?? [],
      page: { limit, skip },
    };
  },
  {
    condition: ({ id }: FetchArgs, { getState }) => {
      const s = getState() as RootState;
      const loading = s.chat.loadingByThread?.[id];
      const hasMore = s.chat.hasMoreByThread?.[id];
      if (loading) return false;
      if (hasMore === false) return false;
      return true;
    },
  }
);
