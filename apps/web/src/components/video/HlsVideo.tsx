import { useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import { Gauge } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { setPlaybackRate, toggleMute } from "../../slices/playerSlice";

export function HlsVideo({
  mediaId,
  initialPosition,
  seekTo,
  onProgress,
  onTimeUpdate,
}: {
  mediaId: string;
  initialPosition: number;
  seekTo?: number;
  onProgress: (position: number, playing: boolean) => void;
  onTimeUpdate?: (currentTime: number) => void;
}) {
  const dispatch = useAppDispatch();
  const playbackRate = useAppSelector((state) => state.player.playbackRate);
  const muted = useAppSelector((state) => state.player.muted);
  const volume = useAppSelector((state) => state.player.volume);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | undefined>(undefined);
  const initialPositionRef = useRef(initialPosition);
  const [playbackError, setPlaybackError] = useState("");
  const [levels, setLevels] = useState<Array<{ id: number; label: string }>>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);

  // Handle external seek requests
  useEffect(() => {
    if (typeof seekTo === "number" && videoRef.current && Number.isFinite(seekTo)) {
      videoRef.current.currentTime = seekTo;
      void videoRef.current.play().catch(() => {});
    }
  }, [seekTo]);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const manifest = `/api/v1/media/${mediaId}/playlist`;
    let cancelled = false;

    const restorePosition = () => {
      if (initialPositionRef.current && initialPositionRef.current > 0) {
        video.currentTime = initialPositionRef.current;
      }
    };

    setPlaybackError("");
    void import("hls.js")
      .then(({ default: HlsLibrary }) => {
        if (cancelled) return;
        if (HlsLibrary.isSupported()) {
          const hls = new HlsLibrary({
            enableWorker: true,
            lowLatencyMode: false,
            xhrSetup: (xhr, url) => {
              if (new URL(url, window.location.href).hostname === window.location.hostname) {
                xhr.withCredentials = true;
              }
            },
          });
          hlsRef.current = hls;
          hls.loadSource(manifest);
          hls.attachMedia(video);

          hls.on(HlsLibrary.Events.MANIFEST_PARSED, (_event, data) => {
            restorePosition();
            if (data.levels && data.levels.length > 1) {
              const mappedLevels = data.levels.map((lvl, idx) => ({
                id: idx,
                label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
              }));
              setLevels([{ id: -1, label: "Auto" }, ...mappedLevels]);
            }
          });

          hls.on(HlsLibrary.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              setPlaybackError(
                "The HLS stream could not be loaded. Check your enrollment and media processing status."
              );
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = manifest;
          video.addEventListener("loadedmetadata", restorePosition, { once: true });
        } else {
          setPlaybackError("This browser does not support HLS playback.");
        }
      })
      .catch(() => setPlaybackError("The HLS player could not be loaded."));

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = undefined;
      video.removeEventListener("loadedmetadata", restorePosition);
    };
  }, [mediaId]);

  // Sync playback rate & audio settings
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.muted = muted;
      videoRef.current.volume = volume;
    }
  }, [playbackRate, muted, volume]);

  // Track progress heartbeat
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timer = window.setInterval(() => {
      if (!video.paused && !video.ended) {
        onProgress(video.currentTime, true);
      }
    }, 5000);

    const onPause = () => onProgress(video.currentTime, false);
    const onTime = () => onTimeUpdate?.(video.currentTime);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);

    return () => {
      window.clearInterval(timer);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
    };
  }, [onProgress, onTimeUpdate]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      const video = videoRef.current;
      if (!video) return;

      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        if (video.paused) void video.play();
        else video.pause();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        dispatch(toggleMute());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  const handleRateChange = (rate: number) => {
    dispatch(setPlaybackRate(rate));
  };

  const handleLevelChange = (levelId: number) => {
    setCurrentLevel(levelId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
    }
  };

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        controls
        playsInline
        poster="/fieldnotes-poster.svg"
        aria-label="Course lesson video"
      />
      {playbackError && <div className="video-error">{playbackError}</div>}
      <div className="player-caption">
        <span>FIELDNOTES · LESSON PLAYER</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {levels.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
              <span>Quality:</span>
              <select
                value={currentLevel}
                onChange={(e) => handleLevelChange(Number(e.target.value))}
                style={{
                  background: "transparent",
                  color: "inherit",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "3px",
                  padding: "1px 4px",
                  fontSize: "10px",
                }}
              >
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id} style={{ color: "#000" }}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
            <Gauge size={12} />
            <select
              value={playbackRate}
              onChange={(e) => handleRateChange(Number(e.target.value))}
              style={{
                background: "transparent",
                color: "inherit",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "3px",
                padding: "1px 4px",
                fontSize: "10px",
              }}
            >
              <option value={0.75} style={{ color: "#000" }}>0.75x</option>
              <option value={1} style={{ color: "#000" }}>1.0x</option>
              <option value={1.25} style={{ color: "#000" }}>1.25x</option>
              <option value={1.5} style={{ color: "#000" }}>1.5x</option>
              <option value={2} style={{ color: "#000" }}>2.0x</option>
            </select>
          </div>
          <span>HLS STREAM</span>
        </div>
      </div>
    </div>
  );
}
