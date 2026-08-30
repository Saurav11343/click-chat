import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { socket } from "@/shared/realtime/socket-client";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

const VideoCallContext = createContext(null);

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const getDisplayName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
  person?.name ||
  "Contact";

const getInitials = (person) => {
  const name = getDisplayName(person);
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
};

export function VideoCallProvider({ children }) {
  const authUser = useAuthStore((state) => state.authUser);

  const [call, setCall] = useState(null);
  const [callState, setCallState] = useState("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null);
  const acceptedIncomingRef = useRef(false);
  const callRef = useRef(null);
  const incomingTimeoutRef = useRef(null);

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());

    localStreamRef.current = null;
    remoteStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const closePeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }
  }, []);

  const resetCall = useCallback(() => {
    closePeer();
    stopMedia();

    if (incomingTimeoutRef.current) {
      window.clearTimeout(incomingTimeoutRef.current);
      incomingTimeoutRef.current = null;
    }

    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    acceptedIncomingRef.current = false;
    callRef.current = null;
    setCall(null);
    setCallState("idle");
    setIsMuted(false);
    setIsCameraOff(false);
  }, [closePeer, stopMedia]);

  const emitCallEnd = useCallback((currentCall) => {
    if (!currentCall || !socket.connected) return;

    socket.emit("call:end", {
      callId: currentCall.callId,
      conversationId: currentCall.conversationId,
      targetUserId: currentCall.targetUserId,
    });
  }, []);

  const endCall = useCallback(
    ({ notifyPeer = true, message = null } = {}) => {
      const currentCall = callRef.current;

      if (notifyPeer) {
        emitCallEnd(currentCall);
      }

      resetCall();

      if (message) toast.info(message);
    },
    [emitCallEnd, resetCall],
  );

  const flushCandidates = useCallback(async (peer) => {
    const queued = pendingCandidatesRef.current.splice(0);

    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(candidate);
      } catch (error) {
        console.warn("Unable to add queued ICE candidate:", error);
      }
    }
  }, []);

  const createPeerConnection = useCallback(
    (currentCall) => {
      closePeer();

      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerRef.current = peer;

      peer.onicecandidate = (event) => {
        if (!event.candidate || !socket.connected) return;

        socket.emit("call:ice-candidate", {
          callId: currentCall.callId,
          conversationId: currentCall.conversationId,
          targetUserId: currentCall.targetUserId,
          candidate: event.candidate.toJSON(),
        });
      };

      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;

        remoteStreamRef.current = stream;

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      peer.onconnectionstatechange = () => {
        if (["connected", "completed"].includes(peer.connectionState)) {
          setCallState("connected");
        }

        if (
          ["failed", "disconnected", "closed"].includes(peer.connectionState)
        ) {
          endCall({
            notifyPeer: peer.connectionState !== "closed",
            message: "Video call ended.",
          });
        }
      };

      const localStream = localStreamRef.current;
      localStream?.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
      });

      return peer;
    },
    [closePeer, endCall],
  );

  const getLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera and microphone are not available in this browser.",
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  }, []);

  const startVideoCall = useCallback(
    async (conversation) => {
      if (!conversation?.conversationId || conversation.isGroup) {
        toast.error(
          "Video calls are currently available for direct chats only.",
        );
        return;
      }

      if (!conversation.userId) {
        toast.error("The other participant could not be identified.");
        return;
      }

      if (!socket.connected) {
        toast.error("Realtime connection is not available.");
        return;
      }

      if (callRef.current) {
        toast.error("A video call is already active.");
        return;
      }

      const currentCall = {
        callId:
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conversationId: conversation.conversationId,
        targetUserId: conversation.userId,
        peerUser: {
          _id: conversation.userId,
          firstName: conversation.name?.split(" ")[0],
          lastName: conversation.name?.split(" ").slice(1).join(" "),
          profilePic: conversation.image,
        },
        direction: "outgoing",
      };

      try {
        setCall(currentCall);
        setCallState("calling");

        await getLocalMedia();
        const peer = createPeerConnection(currentCall);

        socket.emit("call:invite", {
          callId: currentCall.callId,
          conversationId: currentCall.conversationId,
          targetUserId: currentCall.targetUserId,
        });

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("call:offer", {
          callId: currentCall.callId,
          conversationId: currentCall.conversationId,
          targetUserId: currentCall.targetUserId,
          offer,
        });
      } catch (error) {
        console.error("Unable to start video call:", error);
        endCall({ notifyPeer: false });
        toast.error(
          error.name === "NotAllowedError"
            ? "Camera and microphone permission was denied."
            : error.message || "Unable to start video call.",
        );
      }
    },
    [createPeerConnection, endCall, getLocalMedia],
  );

  const acceptIncomingCall = useCallback(async () => {
    const currentCall = callRef.current;
    if (!currentCall || currentCall.direction !== "incoming") return;

    try {
      acceptedIncomingRef.current = true;
      setCallState("connecting");

      await getLocalMedia();
      const peer = createPeerConnection(currentCall);

      const offer = pendingOfferRef.current;
      if (!offer) {
        return;
      }

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      await flushCandidates(peer);

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("call:accept", {
        callId: currentCall.callId,
        conversationId: currentCall.conversationId,
        targetUserId: currentCall.targetUserId,
      });

      socket.emit("call:answer", {
        callId: currentCall.callId,
        conversationId: currentCall.conversationId,
        targetUserId: currentCall.targetUserId,
        answer,
      });

      pendingOfferRef.current = null;
    } catch (error) {
      console.error("Unable to accept video call:", error);
      endCall({ notifyPeer: true });
      toast.error("Unable to accept the video call.");
    }
  }, [createPeerConnection, endCall, flushCandidates, getLocalMedia]);

  const rejectIncomingCall = useCallback(() => {
    const currentCall = callRef.current;
    if (!currentCall) return;

    socket.emit("call:reject", {
      callId: currentCall.callId,
      conversationId: currentCall.conversationId,
      targetUserId: currentCall.targetUserId,
    });

    resetCall();
  }, [resetCall]);

  useEffect(() => {
    const handleIncoming = (payload) => {
      if (!payload?.callId || !payload?.conversationId || !payload?.caller) {
        return;
      }

      if (callRef.current) {
        socket.emit("call:reject", {
          callId: payload.callId,
          conversationId: payload.conversationId,
          targetUserId: payload.callerUserId,
        });
        return;
      }

      const incomingCall = {
        callId: payload.callId,
        conversationId: payload.conversationId,
        targetUserId: payload.callerUserId,
        peerUser: payload.caller,
        direction: "incoming",
      };

      pendingOfferRef.current = null;
      acceptedIncomingRef.current = false;
      setCall(incomingCall);
      setCallState("incoming");

      if (incomingTimeoutRef.current) {
        window.clearTimeout(incomingTimeoutRef.current);
      }

      incomingTimeoutRef.current = window.setTimeout(() => {
        if (callRef.current?.callId === payload.callId) {
          socket.emit("call:reject", {
            callId: payload.callId,
            conversationId: payload.conversationId,
            targetUserId: payload.callerUserId,
          });
          resetCall();
        }
      }, 30000);

      callRef.current = incomingCall;
    };

    const handleOffer = async (payload) => {
      const currentCall = callRef.current;
      if (
        !currentCall ||
        currentCall.callId !== payload?.callId ||
        currentCall.direction !== "incoming"
      ) {
        return;
      }

      pendingOfferRef.current = payload.offer;

      if (!acceptedIncomingRef.current || !peerRef.current) return;

      try {
        const peer = peerRef.current;
        await peer.setRemoteDescription(
          new RTCSessionDescription(payload.offer),
        );
        await flushCandidates(peer);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("call:answer", {
          callId: currentCall.callId,
          conversationId: currentCall.conversationId,
          targetUserId: currentCall.targetUserId,
          answer,
        });

        pendingOfferRef.current = null;
      } catch (error) {
        console.error("Unable to process video call offer:", error);
        endCall({ notifyPeer: true });
      }
    };

    const handleAnswer = async (payload) => {
      const currentCall = callRef.current;
      const peer = peerRef.current;

      if (
        !currentCall ||
        currentCall.callId !== payload?.callId ||
        !peer ||
        currentCall.direction !== "outgoing"
      ) {
        return;
      }

      try {
        await peer.setRemoteDescription(
          new RTCSessionDescription(payload.answer),
        );
        await flushCandidates(peer);
        setCallState("connecting");
      } catch (error) {
        console.error("Unable to process video call answer:", error);
        endCall({ notifyPeer: true });
      }
    };

    const handleIceCandidate = async (payload) => {
      const currentCall = callRef.current;
      const peer = peerRef.current;

      if (
        !currentCall ||
        currentCall.callId !== payload?.callId ||
        !payload.candidate
      ) {
        return;
      }

      if (!peer || !peer.remoteDescription) {
        pendingCandidatesRef.current.push(payload.candidate);
        return;
      }

      try {
        await peer.addIceCandidate(payload.candidate);
      } catch (error) {
        console.warn("Unable to add ICE candidate:", error);
      }
    };

    const handleRejected = (payload) => {
      if (callRef.current?.callId !== payload?.callId) return;
      endCall({ notifyPeer: false, message: "The video call was declined." });
    };

    const handleEnded = (payload) => {
      if (callRef.current?.callId !== payload?.callId) return;
      endCall({ notifyPeer: false, message: "The video call ended." });
    };

    const handleAccepted = (payload) => {
      if (callRef.current?.callId !== payload?.callId) return;
      setCallState("connecting");
    };

    socket.on("call:incoming", handleIncoming);
    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:rejected", handleRejected);
    socket.on("call:ended", handleEnded);
    socket.on("call:accepted", handleAccepted);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:rejected", handleRejected);
      socket.off("call:ended", handleEnded);
      socket.off("call:accepted", handleAccepted);
    };
  }, [endCall, flushCandidates, resetCall]);

  useEffect(() => {
    if (callState === "incoming") return;

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callState]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsCameraOff(!track.enabled);
  }, []);

  useEffect(
    () => () => {
      const currentCall = callRef.current;
      if (currentCall) emitCallEnd(currentCall);
      closePeer();
      stopMedia();
    },
    [closePeer, emitCallEnd, stopMedia],
  );

  const contextValue = {
    startVideoCall,
    isVideoCallActive: Boolean(call),
  };

  return (
    <VideoCallContext.Provider value={contextValue}>
      {children}

      {call && (
        <div className="fixed inset-0 z-[100] bg-black text-white">
          {callState === "incoming" ? (
            <IncomingCall
              call={call}
              onAccept={acceptIncomingCall}
              onReject={rejectIncomingCall}
            />
          ) : (
            <ActiveCall
              call={call}
              callState={callState}
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              onToggleMute={toggleMute}
              onToggleCamera={toggleCamera}
              onEnd={() => endCall({ notifyPeer: true })}
            />
          )}
        </div>
      )}
    </VideoCallContext.Provider>
  );
}

function IncomingCall({ call, onAccept, onReject }) {
  const person = call.peerUser;

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6">
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-28 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
          <Avatar className="size-24">
            <AvatarImage src={person?.profilePic?.url || person?.profilePic} />
            <AvatarFallback className="text-2xl">
              {getInitials(person)}
            </AvatarFallback>
          </Avatar>
        </div>

        <p className="text-sm text-white/60">Incoming video call</p>
        <h2 className="mt-2 text-3xl font-semibold">
          {getDisplayName(person)}
        </h2>

        <div className="mt-10 flex justify-center gap-5">
          <Button
            type="button"
            size="lg"
            variant="destructive"
            className="size-16 rounded-full"
            onClick={onReject}
            aria-label="Decline video call"
          >
            <PhoneOff className="size-7" />
          </Button>

          <Button
            type="button"
            size="lg"
            className="size-16 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onAccept}
            aria-label="Accept video call"
          >
            <Video className="size-7" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActiveCall({
  call,
  callState,
  localVideoRef,
  remoteVideoRef,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEnd,
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="h-full w-full object-contain"
      />

      <div className="absolute left-4 top-4 rounded-full bg-black/50 px-4 py-2 text-sm backdrop-blur">
        <div className="flex items-center gap-2">
          {callState === "connected" ? (
            <PhoneCall className="size-4 text-emerald-400" />
          ) : (
            <Video className="size-4" />
          )}
          <span>
            {callState === "calling"
              ? `Calling ${getDisplayName(call.peerUser)}…`
              : callState === "connecting"
                ? "Connecting…"
                : getDisplayName(call.peerUser)}
          </span>
        </div>
      </div>

      <div className="absolute right-4 top-4 h-36 w-28 overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/20 shadow-2xl sm:h-44 sm:w-36">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        {isCameraOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <VideoOff className="size-7 text-white/70" />
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/60 p-3 backdrop-blur-xl ring-1 ring-white/10">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-12 rounded-full"
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-12 rounded-full"
          onClick={onToggleCamera}
          aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCameraOff ? <VideoOff /> : <Video />}
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="size-12 rounded-full"
          onClick={onEnd}
          aria-label="End video call"
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}

export function useVideoCall() {
  const context = useContext(VideoCallContext);

  if (!context) {
    throw new Error("useVideoCall must be used inside VideoCallProvider");
  }

  return context;
}
