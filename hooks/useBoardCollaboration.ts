"use client";

import { useEffect, useMemo, useState } from "react";

type CollaborationState = {
  annotations: string[];
  votes: Record<string, number>;
};

const initialState: CollaborationState = {
  annotations: [],
  votes: {}
};

export function useBoardCollaboration(boardId: string | undefined) {
  const [state, setState] = useState<CollaborationState>(initialState);
  const channelName = `collabcanvas:${boardId ?? "draft"}`;

  const channel = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return new BroadcastChannel(channelName);
  }, [channelName]);

  useEffect(() => {
    if (!channel) {
      return;
    }

    channel.onmessage = (event: MessageEvent<CollaborationState>) => {
      setState(event.data);
    };

    return () => channel.close();
  }, [channel]);

  function publish(next: CollaborationState) {
    setState(next);
    channel?.postMessage(next);
  }

  function vote(label: string) {
    publish({
      ...state,
      votes: {
        ...state.votes,
        [label]: (state.votes[label] ?? 0) + 1
      }
    });
  }

  function addAnnotation(annotation: string) {
    if (!annotation.trim()) {
      return;
    }

    publish({
      ...state,
      annotations: [annotation.trim(), ...state.annotations].slice(0, 12)
    });
  }

  return {
    ...state,
    vote,
    addAnnotation,
    realtimeMode: "BroadcastChannel local realtime; replace with WebSocket server in production."
  };
}
