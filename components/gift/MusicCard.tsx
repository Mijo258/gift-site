"use client";

import { useCallback, useId, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, LoaderCircle, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { ActionButton } from "./ui";

export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

function formatTime(value: number) {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// The experience mounts one audio element outside the animated stages. Starting
// it from the invitation click preserves playback permission on mobile Safari.
export function useVoicePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef(0);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  const attachAudio = useCallback((node: HTMLAudioElement | null) => {
    if (node === null) {
      ++requestRef.current;
      audioRef.current?.pause();
    }
    audioRef.current = node;
  }, []);

  const syncTiming = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
    setCurrentTime(Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0);
  }, []);

  const play = useCallback((restart = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    const request = ++requestRef.current;

    if (audio.error) audio.load();

    if (restart || audio.ended) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // An unloaded element may not yet have a seekable timeline.
        audio.load();
      }
      setCurrentTime(0);
      setHasEnded(false);
    }

    setError(null);
    setStatus("loading");

    void audio.play().catch((cause: unknown) => {
      if (request !== requestRef.current) return;
      if (cause instanceof DOMException && cause.name === "AbortError") {
        setStatus("paused");
        return;
      }
      setStatus("error");
      setError(cause instanceof DOMException && cause.name === "NotAllowedError"
        ? "اضغطي تشغيل مرة كمان يا سكرة 🤍"
        : "الصوت مش راضي يشتغل دلوقتي. جربي مرة كمان يا سكرة 🤍");
    });
  }, []);

  const pause = useCallback(() => {
    ++requestRef.current;
    audioRef.current?.pause();
    setStatus((previous) => previous === "playing" || previous === "loading" ? "paused" : previous);
  }, []);

  const seek = useCallback((value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value) || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const target = Math.min(audio.duration, Math.max(0, value));

    try {
      // Assign on every slider change: mouse, touch and keyboard all scrub.
      // Seeking preserves the element's existing playing/paused state.
      audio.currentTime = target;
      setError(null);
      setCurrentTime(target);
      setStatus((previous) => previous === "ended" && target < audio.duration ? "paused" : previous);
    } catch {
      setError("لسه الصوت بيحمّل، جربي تحركي المؤشر كمان لحظة 🤍");
    }
  }, []);

  return {
    audioRef, attachAudio, status, error, currentTime, duration, hasEnded, play, pause, seek,
    events: {
      onPlaying: () => { setError(null); setStatus("playing"); },
      onWaiting: () => {
        setStatus((previous) => previous === "playing" ? "loading" : previous);
      },
      onPause: () => {
        if (audioRef.current?.ended) return;
        setStatus((previous) => previous === "playing" || previous === "loading" ? "paused" : previous);
      },
      onEnded: () => {
        ++requestRef.current;
        setStatus("ended");
        setHasEnded(true);
        syncTiming();
      },
      onError: () => {
        ++requestRef.current;
        setStatus("error");
        setError("الصوت مش متاح دلوقتي، بس باقي الحلو مستنيك 🤍");
      },
      onLoadedMetadata: syncTiming,
      onDurationChange: syncTiming,
      onTimeUpdate: syncTiming,
      onSeeked: syncTiming,
    },
  };
}

export type VoicePlayer = ReturnType<typeof useVoicePlayer>;

type MusicCardProps = {
  player: VoicePlayer;
  onContinue: () => void;
  onReturn?: () => void;
};

export default function MusicCard({ player, onContinue, onReturn }: MusicCardProps) {
  const headingId = useId();
  const timeId = useId();
  const scrubbing = useRef(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const { status, error, currentTime, duration, hasEnded, play, pause, seek } = player;
  const active = status === "playing" || status === "loading";
  const finished = status === "ended";
  const displayedTime = Math.min(duration > 0 ? duration : 0, Math.max(0, scrubTime ?? currentTime));
  const progress = duration > 0 ? displayedTime / duration * 100 : 0;
  const canSeek = duration > 0 && status !== "error";
  const finishScrubbing = () => {
    scrubbing.current = false;
    setScrubTime(null);
  };
  const statusText = status === "loading"
    ? "لحظة صغيرة…"
    : finished
      ? "يا رب تكون وصلت لقلبك 🤍"
      : status === "playing"
        ? "اسمعي براحتك يا سكرة"
        : "خدي وقتك، أنا هنا";

  return (
    <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center gap-6">
      <motion.article
        initial={{ scale: 0.88, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 19 }}
        className="glass-card relative z-10 w-full rounded-[2rem] p-6 sm:p-9"
        aria-labelledby={headingId}
      >
        <div className="mb-8 flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#F0E1DD]">
            <Volume2 aria-hidden="true" className="size-5 text-[#B17D88]" strokeWidth={1.5} />
          </span>
          <div>
            <h2 id={headingId} className="font-romance text-3xl">حاجة حلوة تسمعيها</h2>
            <p className="mt-1 text-xs text-[#85695E]">دي ليك وحدك 🤍</p>
          </div>
        </div>

        <div
          aria-hidden="true"
          data-playing={status === "playing"}
          className="mb-7 flex h-20 items-center justify-center gap-1.5"
        >
          {Array.from({ length: 29 }, (_, index) => (
            <span
              key={index}
              className="wave-bar w-1.5 rounded-full bg-gradient-to-t from-[#C5959F] to-[#E9C5CA]"
              style={{
                height: `${18 + ((index * 17 + 9) % 58)}px`,
                "--delay": `${index * -0.09}s`,
                "--duration": `${1.1 + (index % 5) * 0.17}s`,
              } as CSSProperties}
            />
          ))}
        </div>

        <div className="flex justify-center">
          {finished ? (
            <span className="grid size-16 place-items-center rounded-full bg-[#F1E2DF]">
              <Heart aria-hidden="true" className="size-7 fill-[#D8ADB5] text-[#BD8793]" strokeWidth={1} />
            </span>
          ) : (
            <motion.button
              type="button"
              onClick={() => active ? pause() : play()}
              whileTap={{ scale: 0.92 }}
              aria-label={active ? "إيقاف مؤقت" : "تشغيل الصوت"}
              className="grid size-16 place-items-center rounded-full border border-[#DDBBC1] bg-[#ECD0D2] text-[#754C57] shadow-[0_8px_20px_rgba(180,140,150,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B77985] focus-visible:ring-offset-4"
            >
              {status === "loading" ? (
                <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
              ) : active ? (
                <Pause aria-hidden="true" className="size-6" />
              ) : (
                <Play aria-hidden="true" className="size-6" />
              )}
            </motion.button>
          )}
        </div>

        <p role="status" className="mt-5 min-h-6 text-center font-note text-sm text-[#856168]">
          {error ?? statusText}
        </p>

        <div dir="ltr" className="mt-6">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.1}
            value={displayedTime}
            disabled={!canSeek}
            aria-label="موضع تشغيل الصوت"
            aria-describedby={timeId}
            aria-valuetext={`${formatTime(displayedTime)} / ${formatTime(duration)}`}
            className="music-scrubber"
            style={{ "--media-progress": `${progress}%` } as CSSProperties}
            onPointerDown={(event) => {
              scrubbing.current = true;
              setScrubTime(currentTime);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onChange={(event) => {
              const value = event.currentTarget.valueAsNumber;
              if (scrubbing.current) setScrubTime(value);
              seek(value);
            }}
            onPointerUp={finishScrubbing}
            onPointerCancel={finishScrubbing}
            onLostPointerCapture={finishScrubbing}
            onBlur={finishScrubbing}
          />
          <output id={timeId} aria-live="off" className="mt-1 block text-center text-xs tabular-nums text-[#85695E]">
            {formatTime(displayedTime)} / {formatTime(duration)}
          </output>
        </div>

        <AnimatePresence initial={false}>
          {(hasEnded || status === "error") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap justify-center gap-3 pt-7">
                <ActionButton tone="paper" onClick={() => play(true)}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  إعادة الاستماع
                </ActionButton>
                <ActionButton onClick={onContinue}>
                  متابعة
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </ActionButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {onReturn && (
        <ActionButton tone="paper" onClick={onReturn}>
          رجوع لذكرياتك
          <ArrowLeft aria-hidden="true" className="size-4" />
        </ActionButton>
      )}
    </div>
  );
}
