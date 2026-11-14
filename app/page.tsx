"use client";

import dynamic from "next/dynamic";
import GiftExperience from "../components/gift/experience";

const TulipBackground = dynamic(() => import("../components/gift/TulipBackground"), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return (
    <div className="relative isolate min-h-[100dvh]">
      <TulipBackground />
      <GiftExperience />
    </div>
  );
}
