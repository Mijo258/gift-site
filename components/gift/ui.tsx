"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type ActionButtonProps = HTMLMotionProps<"button"> & {
  tone?: "rose" | "paper";
};

export function ActionButton({
  children,
  className = "",
  tone = "rose",
  ...props
}: ActionButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      {...props}
      className={[
        "inline-flex min-h-12 items-center justify-center gap-3",
        "rounded-2xl border px-6 py-3 font-ui text-sm font-semibold",
        "shadow-[0_8px_24px_rgba(180,160,130,0.14)]",
        "transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#B77985] focus-visible:ring-offset-4",
        "focus-visible:ring-offset-[#FFFDF7]",
        "disabled:pointer-events-none disabled:opacity-40",
        tone === "rose"
          ? "border-[#DCB8BC] bg-[#ECD0D2] text-[#754C57] hover:bg-[#E6C3C7]"
          : "border-[#E9DFCE] bg-[#FCF9F2] text-[#705B50] hover:bg-[#F4ECDF]",
        className,
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}
