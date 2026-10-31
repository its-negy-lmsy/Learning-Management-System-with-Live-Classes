import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  MessageCircle,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { ErrorPanel, friendlyError } from "../common/UIComponents";
import {
  useLiveClassMessagesQuery,
  useSendLiveClassMessageMutation,
  useEndLiveClassMutation,
} from "../../api";
import { useAppSelector } from "../../store";

interface RemotePeer {
  id: string;
  name: string;
  stream: MediaStream;
}

export function LiveRoom({
  sessionId,
  url,
  token,
  title,
  onClose,
}: {
  sessionId?: string;
  url: string;
  token: string;
  title: string;
  onClose: () => void;
}) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isInstructor = currentUser?.role === "INSTRUCTOR" || currentUser?.role === "ADMIN";
  const isLocalMode = url === "local-mesh" || token.startsWith("local-");

  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatText, setChatText] = useState("");
  const [error, setError] = useState("");
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);

  // Persistent server chat
  const { data: serverChat } = useLiveClassMessagesQuery(sessionId ?? "", {
    skip: !sessionId,
    pollingInterval: 3000,
  });
  const [sendServerMessage] = useSendLiveClassMessageMutation();
  const [endLiveClass, endState] = useEndLiveClassMutation();

  const [localMessages, setLocalMessages] = useState<
    Array<{ sender: string; text: string; time: string }>
  >([
    {
      sender: "Fieldnotes Studio",
      text: "Welcome to the live session! Audio, video, and classroom chat are active.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const livekitRoomRef = useRef<import("livekit-client").Room | undefined>(undefined);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const participantIdRef = useRef<string>(
    currentUser?.id ? `${currentUser.id}-${Math.random().toString(36).slice(2, 7)}` : Math.random().toString(36).slice(2, 10)
  );

  // Initialize room & WebRTC
  useEffect(() => {
    let cancelled = false;

    // Helper: Create fallback synthetic stream if device camera/mic is denied or unavailable in test env
    const createFallbackStream = (): MediaStream => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#16231e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#8ea89a";
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(currentUser?.name ?? "Presenter", canvas.width / 2, canvas.height / 2);
      }
      const stream = canvas.captureStream(15);
      return stream;
    };

    if (isLocalMode) {
      const channel = new BroadcastChannel(`fs03-live-room-${sessionId ?? "default"}`);
      channelRef.current = channel;

      const myId = participantIdRef.current;
      const myName = currentUser?.name ?? "Learner";

      const startLocalMedia = async () => {
        try {
          let stream: MediaStream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          } catch {
            stream = createFallbackStream();
          }

          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            void localVideoRef.current.play().catch(() => {});
          }
          setConnected(true);

          // Broadcast announcement of joining
          channel.postMessage({
            type: "peer-joined",
            peerId: myId,
            name: myName,
          });
        } catch (mediaErr) {
          console.warn("Camera/mic error:", mediaErr);
          setConnected(true);
        }
      };

      void startLocalMedia();

      // WebRTC Mesh negotiation via BroadcastChannel
      channel.onmessage = async (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== "object") return;

        if (msg.type === "peer-joined" && msg.peerId !== myId) {
          // A new peer joined; initiate offer
          try {
            const pc = new RTCPeerConnection({ iceServers: [] });
            peerConnectionsRef.current.set(msg.peerId, pc);

            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
            }

            pc.ontrack = (trackEvent) => {
              const remoteStream = trackEvent.streams[0] ?? new MediaStream([trackEvent.track]);
              setRemotePeers((prev) => {
                const existing = prev.filter((p) => p.id !== msg.peerId);
                return [...existing, { id: msg.peerId, name: msg.name, stream: remoteStream }];
              });
            };

            pc.onicecandidate = (e) => {
              if (e.candidate) {
                channel.postMessage({
                  type: "webrtc-candidate",
                  from: myId,
                  to: msg.peerId,
                  candidate: e.candidate,
                });
              }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            channel.postMessage({
              type: "webrtc-offer",
              from: myId,
              fromName: myName,
              to: msg.peerId,
              offer,
            });
          } catch (e) {
            console.warn("WebRTC offer initiation error:", e);
          }
        } else if (msg.type === "webrtc-offer" && msg.to === myId) {
          // Received offer from peer; respond with answer
          try {
            const pc = new RTCPeerConnection({ iceServers: [] });
            peerConnectionsRef.current.set(msg.from, pc);

            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
            }

            pc.ontrack = (trackEvent) => {
              const remoteStream = trackEvent.streams[0] ?? new MediaStream([trackEvent.track]);
              setRemotePeers((prev) => {
                const existing = prev.filter((p) => p.id !== msg.from);
                return [...existing, { id: msg.from, name: msg.fromName, stream: remoteStream }];
              });
            };

            pc.onicecandidate = (e) => {
              if (e.candidate) {
                channel.postMessage({
                  type: "webrtc-candidate",
                  from: myId,
                  to: msg.from,
                  candidate: e.candidate,
                });
              }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            channel.postMessage({
              type: "webrtc-answer",
              from: myId,
              to: msg.from,
              answer,
            });
          } catch (e) {
            console.warn("WebRTC answer error:", e);
          }
        } else if (msg.type === "webrtc-answer" && msg.to === myId) {
          const pc = peerConnectionsRef.current.get(msg.from);
          if (pc && pc.signalingState !== "closed") {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer)).catch(() => {});
          }
        } else if (msg.type === "webrtc-candidate" && msg.to === myId) {
          const pc = peerConnectionsRef.current.get(msg.from);
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
          }
        } else if (msg.type === "peer-left") {
          const pc = peerConnectionsRef.current.get(msg.peerId);
          pc?.close();
          peerConnectionsRef.current.delete(msg.peerId);
          setRemotePeers((prev) => prev.filter((p) => p.id !== msg.peerId));
        } else if (msg.type === "class-ended") {
          window.alert("The instructor has ended this live session.");
          onClose();
        } else if (msg.type === "tab-chat") {
          setLocalMessages((prev) => [
            ...prev,
            { sender: msg.sender, text: msg.text, time: msg.time },
          ]);
        }
      };

      return () => {
        cancelled = true;
        channel.postMessage({ type: "peer-left", peerId: myId });
        channel.close();
        peerConnectionsRef.current.forEach((pc) => pc.close());
        peerConnectionsRef.current.clear();
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
          localStreamRef.current = null;
        }
      };
    }

    // Cloud LiveKit Mode
    let room: import("livekit-client").Room | undefined;
    const connectLiveKit = async () => {
      try {
        const { Room, RoomEvent, Track } = await import("livekit-client");
        if (cancelled) return;
        room = new Room({ adaptiveStream: true, dynacast: true });
        livekitRoomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          if (track.kind === Track.Kind.Audio) {
            const audio = track.attach();
            audio.autoplay = true;
            audio.dataset.participant = participant.identity;
            document.body.appendChild(audio);
          } else if (track.kind === Track.Kind.Video) {
            const stream = new MediaStream([track.mediaStreamTrack]);
            setRemotePeers((prev) => [
              ...prev.filter((p) => p.id !== participant.identity),
              { id: participant.identity, name: participant.name || participant.identity, stream },
            ]);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
          if (track.kind === Track.Kind.Video) {
            setRemotePeers((prev) => prev.filter((p) => p.id !== participant.identity));
          }
        });

        room.on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const message = JSON.parse(new TextDecoder().decode(payload)) as { text: string };
            setLocalMessages((current) => [
              ...current,
              {
                sender: participant?.name || "Classmate",
                text: message.text,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
          } catch {
            /* ignore */
          }
        });

        await room.connect(url, token);
        setConnected(true);
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setCameraEnabled(true);
      } catch (reason) {
        setError(friendlyError(reason));
      }
    };

    void connectLiveKit();

    return () => {
      cancelled = true;
      livekitRoomRef.current = undefined;
      room?.removeAllListeners();
      room?.disconnect();
      document.querySelectorAll("audio[data-participant]").forEach((audio) => audio.remove());
    };
  }, [url, token, isLocalMode, sessionId, currentUser?.id, currentUser?.name, onClose]);

  // Audio Toggle
  const toggleAudio = async () => {
    const next = !micOn;
    setMicOn(next);
    if (isLocalMode && localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
    } else if (livekitRoomRef.current) {
      await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(next);
    }
  };

  // Video Toggle
  const toggleVideo = async () => {
    const next = !cameraOn;
    setCameraOn(next);
    if (isLocalMode && localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
    } else if (livekitRoomRef.current) {
      await livekitRoomRef.current.localParticipant.setCameraEnabled(next);
    }
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (screenSharing) {
      setScreenSharing(false);
      if (isLocalMode && localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenSharing(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
      }
      displayStream.getVideoTracks()[0]!.onended = () => {
        setScreenSharing(false);
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      };
    } catch {
      /* Screen share cancelled */
    }
  };

  // Send Chat Message
  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = chatText.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const sender = currentUser?.name ?? "You";

    setChatText("");

    // Broadcast across tabs
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: "tab-chat",
        sender,
        text,
        time,
      });
    }

    // Persist to database if sessionId is available
    if (sessionId) {
      void sendServerMessage({ sessionId, text }).catch(() => {});
    }

    // Also send via LiveKit data packet if in cloud mode
    if (livekitRoomRef.current) {
      try {
        await livekitRoomRef.current.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify({ text })),
          { reliable: true, topic: "chat" }
        );
      } catch {
        /* fallback handled */
      }
    }

    setLocalMessages((current) => [...current, { sender: "You", text, time }]);
  };

  // End Class Action for Instructors
  const handleEndClass = async () => {
    if (!sessionId) {
      onClose();
      return;
    }
    const confirmed = window.confirm("Are you sure you want to conclude this live class for all participants?");
    if (!confirmed) return;

    try {
      await endLiveClass(sessionId).unwrap();
      if (channelRef.current) {
        channelRef.current.postMessage({ type: "class-ended" });
      }
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  // Merge server messages with local messages
  const displayMessages = [
    ...localMessages,
    ...(serverChat?.messages ?? []).map((m) => ({
      sender: m.senderId === currentUser?.id ? "You" : m.senderName,
      text: m.text,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })),
  ].filter((msg, idx, self) => self.findIndex((m) => m.text === msg.text && m.sender === msg.sender) === idx);

  return (
    <div className="live-overlay">
      <div className="live-room">
        <header>
          <div>
            <span className="live-dot" />
            <div>
              <strong>{title}</strong>
              <small>
                {connected
                  ? isLocalMode
                    ? `LIVE STUDIO · WEBRTC CONNECTED (${1 + remotePeers.length} active)`
                    : "LIVE CLASS · LIVEKIT CONNECTED"
                  : "CONNECTING TO LIVE CLASS…"}
              </small>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                background: "rgba(49, 91, 74, 0.15)",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              {isLocalMode ? "Local WebRTC Mesh" : "LiveKit Cloud"}
            </span>
            <button className="icon-button" onClick={onClose} aria-label="Close live class">
              <X size={19} />
            </button>
          </div>
        </header>

        {error && <ErrorPanel message={error} compact />}

        <div className="live-main">
          <div
            className="live-video-grid"
            style={{
              display: "grid",
              gridTemplateColumns: remotePeers.length > 0 ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
              gap: "12px",
              padding: "12px",
              overflowY: "auto",
            }}
          >
            {/* Local Presenter / User Tile */}
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: "320px",
                background: "#121b18",
                borderRadius: "8px",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: cameraOn || screenSharing ? "block" : "none",
                }}
              />
              {!cameraOn && !screenSharing && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#9fb8ab",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <VideoOff size={32} />
                  <span>Your camera is turned off</span>
                </div>
              )}
              <span
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "14px",
                  padding: "3px 8px",
                  background: "rgba(0,0,0,0.65)",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {screenSharing
                  ? "Your Screen"
                  : `${currentUser?.name ?? "You"} (${isInstructor ? "Presenter" : "Learner"})`}
              </span>
            </div>

            {/* Remote WebRTC Peer Tiles */}
            {remotePeers.map((peer) => (
              <div
                key={peer.id}
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: "320px",
                  background: "#121b18",
                  borderRadius: "8px",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <video
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && el.srcObject !== peer.stream) {
                      el.srcObject = peer.stream;
                    }
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "14px",
                    padding: "3px 8px",
                    background: "rgba(0,0,0,0.65)",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {peer.name}
                </span>
              </div>
            ))}

            {remotePeers.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  padding: "6px 12px",
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: "20px",
                  color: "#9fb8ab",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  pointerEvents: "none",
                }}
              >
                <Users size={14} />
                <span>Waiting for classmates to join…</span>
              </div>
            )}
          </div>

          <aside className="live-chat">
            <div>
              <MessageCircle size={16} />
              <strong>Classroom Chat</strong>
            </div>
            <div className="chat-messages">
              {displayMessages.map((message, index) => (
                <p key={index}>
                  <strong>{message.sender}</strong>
                  <span>{message.text}</span>
                  <small style={{ fontSize: "9px", opacity: 0.6, marginLeft: "6px" }}>
                    {message.time}
                  </small>
                </p>
              ))}
            </div>
            <form onSubmit={sendMessage}>
              <input
                value={chatText}
                onChange={(event) => setChatText(event.target.value)}
                placeholder="Write a message to the classroom…"
              />
              <button aria-label="Send message" disabled={!chatText.trim()}>
                <ArrowRight size={15} />
              </button>
            </form>
          </aside>
        </div>

        <div className="live-controls">
          <button onClick={toggleAudio}>
            {micOn ? <Mic size={17} /> : <MicOff size={17} />}
            {micOn ? "Mute" : "Unmute"}
          </button>
          <button onClick={toggleVideo}>
            {cameraOn ? <Video size={17} /> : <VideoOff size={17} />}
            {cameraOn ? "Stop video" : "Start video"}
          </button>
          <button onClick={toggleScreenShare}>
            <Monitor size={17} />
            {screenSharing ? "Stop sharing" : "Share screen"}
          </button>
          {isInstructor && sessionId && (
            <button
              onClick={handleEndClass}
              disabled={endState.isLoading}
              style={{
                background: "#7f1d1d",
                color: "#fee2e2",
                borderColor: "#991b1b",
              }}
            >
              <PhoneOff size={16} /> End Class
            </button>
          )}
          <button className="leave-class" onClick={onClose}>
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
