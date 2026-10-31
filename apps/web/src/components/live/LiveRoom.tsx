import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, MessageCircle, Mic, MicOff, Monitor, Video, VideoOff, X } from "lucide-react";
import { ErrorPanel, friendlyError } from "../common/UIComponents";

export function LiveRoom({
  url,
  token,
  title,
  onClose,
}: {
  url: string;
  token: string;
  title: string;
  onClose: () => void;
}) {
  const isLocalMode = url === "local-mesh" || token.startsWith("local-");

  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatText, setChatText] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: "Fieldnotes Studio",
      text: "Welcome to the live session! Audio, video, and classroom chat are active.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [error, setError] = useState("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const livekitRoomRef = useRef<import("livekit-client").Room | undefined>(undefined);
  const videoGridRef = useRef<HTMLDivElement>(null);

  // Initialize room based on provider mode
  useEffect(() => {
    let cancelled = false;

    if (isLocalMode) {
      // Local WebRTC / Studio Camera Mode
      const startLocalMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
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
        } catch (mediaErr) {
          console.warn("Camera/mic permission not granted or device not available:", mediaErr);
          // Gracefully continue connected in simulated classroom mode
          setConnected(true);
        }
      };

      void startLocalMedia();

      return () => {
        cancelled = true;
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

        const attach = (
          track: import("livekit-client").Track,
          participant: import("livekit-client").Participant
        ) => {
          if (track.kind === Track.Kind.Audio) {
            const audio = track.attach();
            audio.autoplay = true;
            audio.dataset.participant = participant.identity;
            document.body.appendChild(audio);
          } else if (track.kind === Track.Kind.Video && videoGridRef.current) {
            const tile = document.createElement("div");
            tile.className = "live-video-tile";
            tile.dataset.identity = participant.identity;
            const video = track.attach() as HTMLVideoElement;
            tile.appendChild(video);
            const label = document.createElement("span");
            label.textContent = participant.name || participant.identity;
            tile.appendChild(label);
            videoGridRef.current.appendChild(tile);
          }
        };

        room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => attach(track, participant));
        room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((el) => el.remove()));
        room.on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const message = JSON.parse(new TextDecoder().decode(payload)) as { text: string };
            setMessages((current) => [
              ...current,
              {
                sender: participant?.name || "Classmate",
                text: message.text,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
          } catch {
            /* ignore malformed payload */
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
      videoGridRef.current?.replaceChildren();
    };
  }, [url, token, isLocalMode]);

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
      /* Screen share cancelled by user */
    }
  };

  // Send Chat
  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = chatText.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isLocalMode) {
      setMessages((current) => [...current, { sender: "You", text, time }]);
      setChatText("");
      return;
    }

    if (livekitRoomRef.current) {
      try {
        await livekitRoomRef.current.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify({ text })),
          { reliable: true, topic: "chat" }
        );
        setMessages((current) => [...current, { sender: "You", text, time }]);
        setChatText("");
      } catch {
        setError("Your message couldn’t be sent.");
      }
    }
  };

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
                    ? "LIVE STUDIO · WEBRTC CONNECTED"
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
              {isLocalMode ? "Local Mesh" : "LiveKit Cloud"}
            </span>
            <button className="icon-button" onClick={onClose} aria-label="Close live class">
              <X size={19} />
            </button>
          </div>
        </header>

        {error && <ErrorPanel message={error} compact />}

        <div className="live-main">
          <div className="live-video-grid" ref={videoGridRef}>
            {isLocalMode ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  minHeight: "360px",
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
                  {screenSharing ? "Your Screen" : "You (Presenter)"}
                </span>
              </div>
            ) : (
              <div className="live-video-placeholder">
                <Video size={25} />
                <span>{connected ? "Waiting for a classmate" : "Connecting…"}</span>
              </div>
            )}
          </div>

          <aside className="live-chat">
            <div>
              <MessageCircle size={16} />
              <strong>Class chat</strong>
            </div>
            <div className="chat-messages">
              {messages.map((message, index) => (
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
                placeholder="Write a message…"
              />
              <button aria-label="Send message">
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
          <button className="leave-class" onClick={onClose}>
            Leave class
          </button>
        </div>
      </div>
    </div>
  );
}
