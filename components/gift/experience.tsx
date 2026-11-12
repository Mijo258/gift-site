"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useIsPresent,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Image as ImageIcon,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";
import PolaroidStage from "./polaroid-stage";
import { ActionButton } from "./ui";

const FlowerFinale = dynamic(() => import("./flower-finale"), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 grid place-items-center"
      role="status"
      aria-label="لحظة صغيرة، وردتك جاية"
    >
      <Heart
        aria-hidden="true"
        className="size-12 fill-[#ECCCD2] text-[#D9ADB7]"
        strokeWidth={1}
      />
    </div>
  ),
});

type PlaybackStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "ended"
  | "error";

const STAGE_LABELS = [
  "أهلا بالسكر",
  "رسالة ليك",
  "دعوة للاستماع",
  "الصوت",
  "الصورة والرسالة",
  "ذكرياتك",
  "وردتك",
];

function useVoicePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef(0);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const attachAudio = useCallback((node: HTMLAudioElement | null) => {
    // Pause before React detaches the element, including route unmounts.
    if (node === null) {
      ++requestRef.current;
      audioRef.current?.pause();
    }
    audioRef.current = node;
  }, []);

  const play = useCallback((restart = false) => {
    const audio = audioRef.current;
    if (!audio) return;

    const request = ++requestRef.current;

    if (restart) {
      audio.pause();
      audio.currentTime = 0;
      setCurrentTime(0);
    }

    setError(null);
    setStatus("loading");

    // Called synchronously from the invitation/replay click.
    // This same mounted audio element retains browser playback permission.
    void audio.play().catch((cause: unknown) => {
      if (request !== requestRef.current) return;

      if (cause instanceof DOMException && cause.name === "AbortError") {
        setStatus("paused");
        return;
      }

      setStatus("error");
      setError(
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "اضغطي تشغيل مرة كمان يا سكرة 🤍"
          : "الصوت مش راضي يشتغل دلوقتي. جربي مرة كمان يا سكرة 🤍",
      );
    });
  }, []);

  const pause = useCallback(() => {
    ++requestRef.current;
    audioRef.current?.pause();
    setStatus((previous) =>
      previous === "playing" || previous === "loading" ? "paused" : previous,
    );
  }, []);

  return {
    audioRef,
    attachAudio,
    status,
    error,
    currentTime,
    duration,
    play,
    pause,
    events: {
      onPlaying: () => {
        setError(null);
        setStatus("playing");
      },
      onWaiting: () => {
        setStatus((previous) =>
          previous === "playing" ? "loading" : previous,
        );
      },
      onPause: () => {
        setStatus((previous) =>
          previous === "playing" || previous === "loading"
            ? "paused"
            : previous,
        );
      },
      onEnded: () => {
        ++requestRef.current;
        setStatus("ended");
        const audio = audioRef.current;
        if (audio) setCurrentTime(audio.currentTime);
      },
      onError: () => {
        ++requestRef.current;
        setStatus("error");
        setError("الصوت مش متاح دلوقتي، بس باقي الحلو مستنيك 🤍");
      },
      onLoadedMetadata: () => {
        const value = audioRef.current?.duration ?? 0;
        setDuration(Number.isFinite(value) ? value : 0);
      },
      onDurationChange: () => {
        const value = audioRef.current?.duration ?? 0;
        setDuration(Number.isFinite(value) ? value : 0);
      },
      onTimeUpdate: () => {
        setCurrentTime(audioRef.current?.currentTime ?? 0);
      },
    },
  };
}

function StageFrame({
  children,
  label,
  finale,
}: {
  children: ReactNode;
  label: string;
  finale: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (present) ref.current?.focus({ preventScroll: true });
  }, [present]);

  return (
    <motion.section
      ref={ref}
      tabIndex={-1}
      inert={!present}
      aria-label={label}
      initial={{ opacity: 0, y: reducedMotion || finale ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion || finale ? 0 : -10 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className={
        finale
          ? "relative w-full outline-none"
          : "relative z-10 mx-auto w-full max-w-3xl outline-none"
      }
    >
      {children}
    </motion.section>
  );
}

function Stars() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {Array.from({ length: 28 }, (_, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full bg-white shadow-[0_0_12px_3px_rgba(255,255,255,0.5)]"
          style={{
            left: `${(index * 37 + 8) % 100}%`,
            top: `${(index * 53 + 11) % 100}%`,
            width: 2 + (index % 3),
            height: 2 + (index % 3),
          }}
          initial={{ opacity: 0.4 }}
          animate={
            reducedMotion
              ? { opacity: 0.6 }
              : { opacity: [0.25, 0.9, 0.25], y: [-10, 12, -10] }
          }
          transition={{
            duration: 6 + (index % 6),
            repeat: reducedMotion ? 0 : Infinity,
            delay: (index % 7) * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function EntryStage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex flex-col items-center gap-9 text-center">
      <Heart
        aria-hidden="true"
        className="size-9 fill-white/40 text-white"
        strokeWidth={1}
      />

      <h1 className="w-full font-romance text-[clamp(1.8rem,6vw,3rem)]">
        <motion.button
          type="button"
          onClick={onEnter}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.98 }}
          className="min-h-20 max-w-full rounded-[2rem] border border-white/60 bg-white/25 px-7 py-6 leading-relaxed text-[#476987] shadow-[0_12px_48px_rgba(95,136,177,0.12)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#C5DFFA] sm:px-12"
        >
          أهلا بالسكر يلا بينا كملي لجوة
        </motion.button>
      </h1>

      <ArrowLeft aria-hidden="true" className="size-5 text-[#6688A7]/65" />
    </div>
  );
}

function NoteStage({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 20_000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.article
      initial={{ y: 28, scale: 0.96 }}
      animate={{ y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 130, damping: 22 }}
      className="paper mx-auto max-w-xl rounded-[2rem] border border-[#EDE4D5] px-6 pb-8 pt-10 sm:px-10"
      aria-labelledby="note-heading"
    >
      <span
        aria-hidden="true"
        className="paper-tape absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-3"
      />

      <Heart
        aria-hidden="true"
        className="mx-auto mb-5 size-6 fill-[#E9CAD0] text-[#B77F8A]"
        strokeWidth={1}
      />

      <div className="space-y-4 font-note text-[clamp(1rem,3.8vw,1.2rem)] leading-[1.95]">
        <h2 id="note-heading" className="text-[#956773]">
          منورة موقعك يا ملاك.
        </h2>
        <p>
          بغض النظر عن أن يومك اليوم ما كان احسن شي أنا جاي بس ارسم الابتسامة
          على الملامح الملائكية دي.
        </p>
        <p>و تذكري سكرة دايما يا لبى اللي يبسط الحلو يا ناس 🤍</p>
        <p>
          حخلي الجولة تكمل و شوفي اش مخبي ليك خليك هنا و الشاشة بتتحدث براها
        </p>
      </div>

      <div
        className="mt-8"
        role="timer"
        aria-label="الجولة تكمل تلقائيًا بعد عشرين ثانية"
      >
        <div
          aria-hidden="true"
          className="relative h-1 overflow-hidden rounded-full bg-[#EDE4D5]"
        >
          <motion.div
            className="absolute inset-y-0 right-0 rounded-full bg-[#C99BA5]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 20, ease: "linear" }}
          />
        </div>
      </div>
    </motion.article>
  );
}

function InvitationStage({ onListen }: { onListen: () => void }) {
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <span
        aria-hidden="true"
        className="grid size-16 place-items-center rounded-full border border-[#EADFD0] bg-[#FCF9F2] shadow-[0_8px_24px_rgba(180,160,130,0.12)]"
      >
        <Volume2 className="size-6 text-[#B4868D]" strokeWidth={1.4} />
      </span>

      <ActionButton onClick={onListen} className="px-8 py-4 text-base">
        لو سمحتي ممكن تضغطي هنا{" "}
        <Heart aria-hidden="true" className="size-4" strokeWidth={1.5} />
      </ActionButton>
    </div>
  );
}

function formatTime(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

type AudioStageProps = {
  audioRef: RefObject<HTMLAudioElement | null>;
  status: PlaybackStatus;
  error: string | null;
  currentTime: number;
  duration: number;
  play: (restart?: boolean) => void;
  pause: () => void;
  onContinue: () => void;
  onReturn?: () => void;
};

function AudioStage({
  audioRef,
  status,
  error,
  currentTime,
  duration,
  play,
  pause,
  onContinue,
  onReturn,
}: AudioStageProps) {
  useEffect(() => {
    const audio = audioRef.current;
    if (audio?.paused && !audio.ended) play();
  }, [audioRef, play]);

  const active = status === "playing" || status === "loading";
  const finished = status === "ended";
  const progress =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const statusText =
    status === "loading"
      ? "لحظة صغيرة…"
      : finished
        ? "يا رب تكون وصلت لقلبك 🤍"
        : status === "playing"
          ? "اسمعي براحتك يا سكرة"
          : "خدي وقتك، أنا هنا";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6">
      <motion.article
        initial={{ scale: 0.88, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 19 }}
        className="paper w-full rounded-[2rem] border border-[#EDE4D5] p-6 sm:p-9"
        aria-labelledby="audio-heading"
      >
        <div className="mb-8 flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#F0E1DD]">
            <Volume2
              aria-hidden="true"
              className="size-5 text-[#B17D88]"
              strokeWidth={1.5}
            />
          </span>
          <div>
            <h2 id="audio-heading" className="font-romance text-3xl">
              حاجة حلوة تسمعيها
            </h2>
            <p className="mt-1 text-xs text-[#A48C7C]">دي ليك وحدك 🤍</p>
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
              style={
                {
                  height: `${18 + ((index * 17 + 9) % 58)}px`,
                  "--delay": `${index * -0.09}s`,
                  "--duration": `${1.1 + (index % 5) * 0.17}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="flex justify-center">
          {finished ? (
            <span className="grid size-16 place-items-center rounded-full bg-[#F1E2DF]">
              <Heart
                aria-hidden="true"
                className="size-7 fill-[#D8ADB5] text-[#BD8793]"
                strokeWidth={1}
              />
            </span>
          ) : (
            <motion.button
              type="button"
              onClick={() => (active ? pause() : play())}
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

        <p
          role="status"
          className="mt-5 min-h-6 text-center font-note text-sm text-[#A07D7F]"
        >
          {error ?? statusText}
        </p>

        <div
          role="progressbar"
          aria-label="تقدم الصوت"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="relative mt-7 h-1.5 overflow-hidden rounded-full bg-[#EEE5D9]"
        >
          <motion.div
            className="absolute inset-y-0 right-0 rounded-full bg-[#C5959F]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease: "linear" }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-[#A18D7E]">
          <bdi lang="en">{formatTime(currentTime)}</bdi>
          <bdi lang="en">{formatTime(duration)}</bdi>
        </div>

        <AnimatePresence>
          {(finished || status === "error") && (
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

function ReplayHub({
  onAudio,
  onPhoto,
  onFinale,
}: {
  onAudio: () => void;
  onPhoto: () => void;
  onFinale: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-9 text-center">
        <Heart
          aria-hidden="true"
          className="mx-auto mb-4 size-6 fill-[#E4BEC5] text-[#BC8793]"
          strokeWidth={1}
        />
        <h2 className="font-romance text-4xl sm:text-5xl">كل الحلو هنا ليك</h2>
        <p className="mt-3 font-note text-sm text-[#A58B7E]">
          ارجعي لأي حاجة كل ما قلبك يحب 🤍
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {[
          {
            title: "إعادة الاستماع",
            description: "حاجة تسمعيها مرة كمان",
            icon: Volume2,
            onClick: onAudio,
            color: "bg-[#F0DFDD] text-[#B18089]",
          },
          {
            title: "الصورة والرسالة",
            description: "ذكرى صغيرة لقلبك",
            icon: ImageIcon,
            onClick: onPhoto,
            color: "bg-[#EEE5D4] text-[#B3986F]",
          },
        ].map(({ title, description, icon: Icon, onClick, color }) => (
          <motion.button
            type="button"
            key={title}
            onClick={onClick}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="paper flex min-h-48 flex-col items-start rounded-[1.75rem] border border-[#EDE4D5] p-5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B77985] focus-visible:ring-offset-4 sm:min-h-56 sm:p-7"
          >
            <span
              className={`mb-6 grid size-12 place-items-center rounded-2xl ${color}`}
            >
              <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
            </span>
            <span className="font-romance text-xl sm:text-2xl">{title}</span>
            <span className="mt-2 text-xs leading-relaxed text-[#A58B7E]">
              {description}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <ActionButton onClick={onFinale} className="max-w-full text-center">
          بس كده خلصنا سيا سكرة 🤍
        </ActionButton>
      </div>
    </div>
  );
}

function FinaleStage() {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <div className="vanilla-background relative h-[100dvh] min-h-[100dvh] overflow-hidden">
      <FlowerFinale reducedMotion={reducedMotion} />

      <div className="finale-copy pointer-events-none absolute inset-x-0 top-0 z-10 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="mx-auto max-w-xl font-romance text-[clamp(1.6rem,5.5vw,2.7rem)] leading-relaxed text-[#8A6771]"
        >
          مفتكرة حخليك تطلعي كده و خلاص من غير شي اخير
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1.2 }}
          className="mt-4 font-romance text-3xl italic text-[#B7877C] sm:text-4xl"
        >
          <bdi lang="en" dir="ltr">this is for you</bdi>
        </motion.p>
      </div>
    </div>
  );
}

export default function GiftExperience() {
  const [stage, setStage] = useState<number>(0);
  const [returnToHub, setReturnToHub] = useState(false);
  const [showPhotoDirectly, setShowPhotoDirectly] = useState(false);
  const voice = useVoicePlayer();

  const completeNote = useCallback(() => setStage(2), []);

  useEffect(() => {
    if (stage !== 3) voice.pause();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stage, voice.pause]);

  useEffect(() => {
    if (stage === 5) {
      // Warm the finale's code while she browses the replay hub.
      void import("./flower-finale").catch(() => undefined);
    }
  }, [stage]);

  const openAudio = (fromHub: boolean) => {
    setReturnToHub(fromHub);
    voice.play(true);
    setStage(3);
  };

  const continueFromAudio = () => {
    voice.pause();

    if (returnToHub) {
      setStage(5);
    } else {
      setShowPhotoDirectly(false);
      setStage(4);
    }
  };

  const renderStage = () => {
    switch (stage) {
      case 0:
        return <EntryStage onEnter={() => setStage(1)} />;
      case 1:
        return <NoteStage onComplete={completeNote} />;
      case 2:
        return <InvitationStage onListen={() => openAudio(false)} />;
      case 3:
        return (
          <AudioStage
            audioRef={voice.audioRef}
            status={voice.status}
            error={voice.error}
            currentTime={voice.currentTime}
            duration={voice.duration}
            play={voice.play}
            pause={voice.pause}
            onContinue={continueFromAudio}
            onReturn={returnToHub ? () => setStage(5) : undefined}
          />
        );
      case 4:
        return (
          <PolaroidStage
            initiallyOpen={showPhotoDirectly}
            onFinish={() => setStage(5)}
          />
        );
      case 5:
        return (
          <ReplayHub
            onAudio={() => openAudio(true)}
            onPhoto={() => {
              setShowPhotoDirectly(true);
              setStage(4);
            }}
            onFinale={() => setStage(6)}
          />
        );
      case 6:
        return <FinaleStage />;
      default:
        return null;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <main
        dir="rtl"
        className={[
          "relative isolate min-h-[100dvh] overflow-x-clip font-ui text-[#705B50]",
          stage === 6 ? "" : "gift-padding grid place-items-center",
        ].join(" ")}
      >
        {stage !== 6 && (
          <>
            <div
              aria-hidden="true"
              className="vanilla-background pointer-events-none fixed inset-0 -z-20"
            />
            <motion.div
              aria-hidden="true"
              className="sky-background pointer-events-none fixed inset-0 -z-10"
              initial={false}
              animate={{ opacity: stage === 0 ? 1 : 0 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </>
        )}

        {stage === 0 && <Stars />}

        {stage >= 1 && stage < 6 && (
          <audio
            ref={voice.attachAudio}
            hidden
            preload="auto"
            src="/sound1.mp3"
            {...voice.events}
          />
        )}

        <AnimatePresence mode="wait">
          <StageFrame
            key={stage}
            label={STAGE_LABELS[stage] ?? ""}
            finale={stage === 6}
          >
            {renderStage()}
          </StageFrame>
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
