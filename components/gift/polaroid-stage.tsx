"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, RotateCcw } from "lucide-react";
import { ActionButton } from "./ui";

type EnvelopeStep = "ask" | "envelope" | "open";

export default function PolaroidStage({
  initiallyOpen = false,
  onFinish,
}: {
  initiallyOpen?: boolean;
  onFinish: () => void;
}) {
  const [step, setStep] = useState<EnvelopeStep>(
    initiallyOpen ? "open" : "ask",
  );
  const [flipped, setFlipped] = useState(false);
  const [ready, setReady] = useState(initiallyOpen);
  const [imageUnavailable, setImageUnavailable] = useState(false);

  const open = step === "open";

  if (step === "ask") {
    return (
      <div className="flex justify-center">
        <ActionButton
          onClick={() => setStep("envelope")}
          className="px-7 py-4 text-base"
        >
          كمان مرة عيني في واحدة كمان
          <Heart aria-hidden="true" className="size-4" strokeWidth={1.5} />
        </ActionButton>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 font-romance text-3xl text-[#956773]"
      >
        حاجة تفضّل معاك
      </motion.h2>

      <motion.div
        className="relative w-full"
        initial={false}
        animate={{ height: open ? 460 : 240 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      >
        <motion.button
          type="button"
          aria-label="افتحي سكرة"
          aria-hidden={open}
          disabled={open}
          tabIndex={open ? -1 : 0}
          onClick={() => setStep("open")}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: open ? 0 : 1, y: open ? 75 : 0 }}
          transition={{
            opacity: { delay: open ? 1.4 : 0, duration: 0.5 },
            y: { delay: open ? 1.4 : 0, duration: 0.6 },
          }}
          className="absolute bottom-0 left-1/2 h-48 w-[min(20rem,calc(100vw-3rem))] -translate-x-1/2 rounded-b-xl text-[#956773] shadow-[0_16px_40px_rgba(165,138,100,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B77985] focus-visible:ring-offset-4 disabled:pointer-events-none"
          style={{ perspective: 1000 }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl border border-[#DDCCB1] bg-[#EADBC3]"
          />

          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ rotateX: open ? 180 : 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-x-0 top-0 h-[58%] bg-[#F4E9D7]"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              transformOrigin: "50% 0%",
              zIndex: open ? 2 : 30,
            }}
          />

          <span
            aria-hidden="true"
            className="absolute inset-0 z-20 rounded-b-xl bg-[#F0E3CE]"
            style={{
              clipPath: "polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%)",
            }}
          />

          <span className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 pt-7">
            <span className="grid size-11 place-items-center rounded-full border border-[#D0A2A9] bg-[#DBB2B8] shadow-sm">
              <Heart
                aria-hidden="true"
                className="size-5 fill-[#F8E9E7] text-[#F8E9E7]"
                strokeWidth={1}
              />
            </span>
            <span className="font-note text-lg">افتحي سكرة</span>
          </span>
        </motion.button>

        {open && (
          <motion.div
            className="polaroid-perspective absolute left-1/2 top-0 z-10 h-[25rem] w-[min(18rem,calc(100vw-3rem))]"
            initial={{
              x: "-50%",
              y: initiallyOpen ? 16 : 155,
              opacity: 0,
              scale: initiallyOpen ? 0.98 : 0.82,
              rotate: -7,
            }}
            animate={{
              x: "-50%",
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: -3,
            }}
            transition={{
              delay: initiallyOpen ? 0 : 0.55,
              type: "spring",
              stiffness: 85,
              damping: 19,
            }}
            onAnimationComplete={() => setReady(true)}
            style={{ willChange: "transform" }}
          >
            <button
              type="button"
              disabled={!ready}
              onClick={() => setFlipped((value) => !value)}
              aria-label={flipped ? "ارجعي للصورة" : "اقلبي الصورة واقري الرسالة"}
              aria-pressed={flipped}
              data-flipped={flipped}
              className="polaroid-card text-[#705B50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B77985] focus-visible:ring-offset-8"
            >
              <span
                aria-hidden={flipped}
                className="polaroid-face polaroid-front"
              >
                <span className="relative block min-h-0 flex-1 overflow-hidden bg-[#F3ECE2]">
                  {imageUnavailable ? (
                    <span className="flex h-full flex-col items-center justify-center gap-4 px-5">
                      <Heart
                        className="size-12 fill-[#E9C9D0] text-[#C294A0]"
                        strokeWidth={1}
                      />
                      <span className="font-note text-sm leading-relaxed">
                        الصورة مش ظاهرة دلوقتي، بس الرسالة هنا 🤍
                      </span>
                    </span>
                  ) : (
                    // Public files are served from the URL root.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/image1.jpg"
                      width={800}
                      height={1000}
                      alt="صورتك الحلوة في ذكرى صغيرة ليك"
                      decoding="async"
                      onError={() => setImageUnavailable(true)}
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>

                <span className="flex h-16 shrink-0 items-center justify-center gap-2 font-note text-sm text-[#A17B80]">
                  الوجه القمر 🤍
                </span>
              </span>

              <span
                aria-hidden={!flipped}
                className="polaroid-face polaroid-back items-center justify-center"
              >
                <span className="block font-note text-[0.98rem] leading-8">
                  الوجه القمر ده ما يليق بيه إلا أنه يكون مبسوط و فرحان مهما
                  كان و للمرة الثانية يا لبى اللي يبسط و يفرح دنيتي و يا رب
                  تكون تجربة حلوة ستي و فرقت عليك و لو شوي بس
                </span>

                <bdi
                  lang="en"
                  dir="ltr"
                  className="mt-5 block font-romance text-xl leading-relaxed text-[#A2727F]"
                >
                  Love you from deep inside 🤍
                </bdi>
              </span>
            </button>
          </motion.div>
        )}
      </motion.div>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          className="flex flex-col items-center gap-5"
        >
          <p className="flex items-center gap-2 font-note text-xs text-[#A58B7E]">
            <RotateCcw aria-hidden="true" className="size-3.5" />
            اضغطي على الصورة واقلبيها 🤍
          </p>

          <ActionButton disabled={!ready} onClick={onFinish}>
            إنهاء
            <ArrowLeft aria-hidden="true" className="size-4" />
          </ActionButton>
        </motion.div>
      )}
    </div>
  );
}
