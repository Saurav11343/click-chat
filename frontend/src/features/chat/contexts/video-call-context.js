import { createContext, useContext } from "react";

export const VideoCallContext = createContext(null);

export function useVideoCall() {
  const context = useContext(VideoCallContext);

  if (!context) {
    throw new Error("useVideoCall must be used inside VideoCallProvider");
  }

  return context;
}
