"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowLeft, Heart, Image as ImageIcon, Volume2 } from "lucide-react";
import MusicCard, { useVoicePlayer } from "./MusicCard";
import PolaroidStage from "./polaroid-stage";
import { ActionButton } from "./ui";

// Preserve this checkout's seven-stage flow; the persistent backdrop lives in
// page.tsx, outside AnimatePresence, and never remounts during stage transitions.
type GiftStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const STAGE_LABELS = [
  "أهلا بالسكر", "رسالة ليك", "دعوة للاستماع", "الصوت",
  "الصورة والرسالة", "ذكرياتك", "وردتك",
];

function StageFrame({ children, label, finale }: {
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
      className={finale
        ? "relative z-10 w-full outline-none"
        : "relative z-10 mx-auto w-full max-w-3xl outline-none"}
    >
      {children}
    </motion.section>
  );
}

function EntryStage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex flex-col items-center gap-9 text-center">
      <Heart aria-hidden="true" className="size-9 fill-[#9b0a15]/20 text-[#9b0a15]" strokeWidth={1} />
      <h1 className="w-full font-romance text-[clamp(1.8rem,6vw,3rem)]">
        <motion.button
          type="button"
          onClick={onEnter}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.98 }}
          className="glass-card relative z-10 min-h-20 max-w-full rounded-[2rem] px-7 py-6 leading-relaxed text-[#6d2630] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b0a15] focus-visible:ring-offset-4 sm:px-12"
        >
          أهلا بالسكر يلا بينا كملي لجوة
        </motion.button>
      </h1>
      <ArrowLeft aria-hidden="true" className="size-5 text-[#9b0a15]/65" />
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
      className="glass-card relative z-10 mx-auto max-w-xl rounded-[2rem] px-6 pb-8 pt-10 sm:px-10"
      aria-labelledby="note-heading"
    >
      <span aria-hidden="true" className="paper-tape absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-3" />
      <Heart aria-hidden="true" className="mx-auto mb-5 size-6 fill-[#E9CAD0] text-[#B77F8A]" strokeWidth={1} />

      <div className="space-y-4 font-note text-[clamp(1rem,3.8vw,1.2rem)] leading-[1.95]">
        <h2 id="note-heading" className="text-[#956773]">منورة موقعك يا ملاك.</h2>
        <p>
          بغض النظر عن أن يومك اليوم ما كان احسن شي أنا جاي بس ارسم الابتسامة
          على الملامح الملائكية دي.
        </p>
        <p>و تذكري سكرة دايما يا لبى اللي يبسط الحلو يا ناس 🤍</p>
        <p>حخلي الجولة تكمل و شوفي اش مخبي ليك خليك هنا و الشاشة بتتحدث براها</p>
      </div>

      <div className="mt-8" role="timer" aria-label="الجولة تكمل تلقائيًا بعد عشرين ثانية">
        <div aria-hidden="true" className="relative h-1 overflow-hidden rounded-full bg-[#EDE4D5]">
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
    <div className="glass-card relative z-10 mx-auto flex w-fit max-w-full flex-col items-center gap-7 rounded-[2rem] p-7 text-center sm:p-10">
      <span aria-hidden="true" className="grid size-16 place-items-center rounded-full border border-[#EADFD0] bg-[#FCF9F2]/80 shadow-[0_8px_24px_rgba(180,160,130,0.12)]">
        <Volume2 className="size-6 text-[#B4868D]" strokeWidth={1.4} />
      </span>
      <ActionButton onClick={onListen} className="px-8 py-4 text-base">
        لو سمحتي ممكن تضغطي هنا{" "}
        <Heart aria-hidden="true" className="size-4" strokeWidth={1.5} />
      </ActionButton>
    </div>
  );
}

function ReplayHub({ onAudio, onPhoto, onFinale }: {
  onAudio: () => void;
  onPhoto: () => void;
  onFinale: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="glass-card mb-7 rounded-[2rem] px-5 py-6 text-center">
        <Heart aria-hidden="true" className="mx-auto mb-4 size-6 fill-[#E4BEC5] text-[#BC8793]" strokeWidth={1} />
        <h2 className="font-romance text-4xl sm:text-5xl">كل الحلو هنا ليك</h2>
        <p className="mt-3 font-note text-sm text-[#85695E]">ارجعي لأي حاجة كل ما قلبك يحب 🤍</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {[
          { title: "إعادة الاستماع", description: "حاجة تسمعيها مرة كمان", icon: Volume2, onClick: onAudio, color: "bg-[#F0DFDD] text-[#B18089]" },
          { title: "الصورة والرسالة", description: "ذكرى صغيرة لقلبك", icon: ImageIcon, onClick: onPhoto, color: "bg-[#EEE5D4] text-[#B3986F]" },
        ].map(({ title, description, icon: Icon, onClick, color }) => (
          <motion.button
            type="button"
            key={title}
            onClick={onClick}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card relative z-10 flex min-h-48 flex-col items-start rounded-[1.75rem] p-5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B77985] focus-visible:ring-offset-4 sm:min-h-56 sm:p-7"
          >
            <span className={`mb-6 grid size-12 place-items-center rounded-2xl ${color}`}>
              <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
            </span>
            <span className="font-romance text-xl sm:text-2xl">{title}</span>
            <span className="mt-2 text-xs leading-relaxed text-[#85695E]">{description}</span>
          </motion.button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <ActionButton onClick={onFinale} className="max-w-full text-center">بس كده خلصنا سيا سكرة 🤍</ActionButton>
      </div>
    </div>
  );
}

function FinaleStage({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="relative min-h-[200dvh]">
      <div className="finale-copy relative z-10 px-6 text-center">
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="glass-card mx-auto max-w-xl rounded-[2rem] p-6 sm:p-8"
        >
          <h1 className="font-romance text-[clamp(1.6rem,5.5vw,2.7rem)] leading-relaxed text-[#8A6771]">
            مفتكرة حخليك تطلعي كده و خلاص من غير شي اخير
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1.2 }}
            className="mt-4 font-romance text-3xl italic text-[#9b0a15] sm:text-4xl"
          >
            <bdi lang="en" dir="ltr">this is for you</bdi>
          </motion.p>
          <p className="mt-6 flex items-center justify-center gap-2 font-note text-sm text-[#85695E]">
            انزلي بهدوء، وشوفي الورد بيتفتح ليك 🤍
            <ArrowDown aria-hidden="true" className="size-4 shrink-0" />
          </p>
        </motion.article>
      </div>

      <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center px-6">
        <ActionButton tone="paper" onClick={onReturn}>
          رجوع لذكرياتك
          <ArrowLeft aria-hidden="true" className="size-4" />
        </ActionButton>
      </div>
    </div>
  );
}

export default function GiftExperience() {
  const [stage, setStage] = useState<GiftStage>(0);
  const [returnToHub, setReturnToHub] = useState(false);
  const [showPhotoDirectly, setShowPhotoDirectly] = useState(false);
  const voice = useVoicePlayer();
  const completeNote = useCallback(() => setStage(2), []);

  useEffect(() => {
    if (stage !== 3) voice.pause();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stage, voice.pause]);

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
      case 0: return <EntryStage onEnter={() => setStage(1)} />;
      case 1: return <NoteStage onComplete={completeNote} />;
      case 2: return <InvitationStage onListen={() => openAudio(false)} />;
      case 3: return (
        <MusicCard
          player={voice}
          onContinue={continueFromAudio}
          onReturn={returnToHub ? () => setStage(5) : undefined}
        />
      );
      case 4: return <PolaroidStage initiallyOpen={showPhotoDirectly} onFinish={() => setStage(5)} />;
      case 5: return (
        <ReplayHub
          onAudio={() => openAudio(true)}
          onPhoto={() => { setShowPhotoDirectly(true); setStage(4); }}
          onFinale={() => setStage(6)}
        />
      );
      case 6: return <FinaleStage onReturn={() => setStage(5)} />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <main
        dir="rtl"
        className={[
          "relative z-10 min-h-[100dvh] overflow-x-clip font-ui text-[#705B50]",
          stage === 6 ? "" : "gift-padding grid place-items-center",
        ].join(" ")}
      >
        {stage >= 1 && stage < 6 && (
          <audio ref={voice.attachAudio} hidden preload="auto" src="/sound1.mp3" {...voice.events} />
        )}
        <AnimatePresence mode="wait">
          <StageFrame key={stage} label={STAGE_LABELS[stage]} finale={stage === 6}>
            {renderStage()}
          </StageFrame>
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
