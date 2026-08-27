import { memo } from "react";
import type { Shot } from "@/lib/types";

const FULL: Record<Shot["plate"], string> = {
  black: "/plates/plate-black.webp",
  landfill: "/plates/plate-landfill.webp",
  hand: "/plates/plate-hand.webp",
  cut: "/plates/plate-cut.webp",
  laugh: "/plates/plate-laugh.webp",
  proof: "/plates/plate-proof.webp",
  face: "/plates/plate-face.webp",
  card: "/plates/plate-card.webp",
  insert: "/plates/plate-insert.webp",
};

const THUMB: Record<Shot["plate"], string> = {
  black: "/plates/thumbs/plate-black.webp",
  landfill: "/plates/thumbs/plate-landfill.webp",
  hand: "/plates/thumbs/plate-hand.webp",
  cut: "/plates/thumbs/plate-cut.webp",
  laugh: "/plates/thumbs/plate-laugh.webp",
  proof: "/plates/thumbs/plate-proof.webp",
  face: "/plates/thumbs/plate-face.webp",
  card: "/plates/thumbs/plate-card.webp",
  insert: "/plates/thumbs/plate-insert.webp",
};

export const Plate = memo(function Plate({
  shot,
  playing,
  compact = false,
  thumb = false,
  priority = false,
}: {
  shot: Shot;
  playing: boolean;
  compact?: boolean;
  thumb?: boolean;
  priority?: boolean;
}) {
  const plate = shot.plate in FULL ? shot.plate : "insert";
  const full = FULL[plate];
  const small = THUMB[plate];
  const src = thumb ? small : full;

  return (
    <div className="plate" data-playing={playing}>
      <img
        src={src}
        srcSet={thumb ? undefined : `${small} 400w, ${full} 960w`}
        sizes={thumb ? "280px" : "(max-width: 900px) 100vw, 880px"}
        alt=""
        width={thumb ? 400 : 960}
        height={thumb ? 266 : 640}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        draggable={false}
      />
      {shot.locked && !compact ? <span className="pin-chip">Pin</span> : null}
      {shot.caption && !compact ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-5 py-4">
          <p className="max-w-[24ch] text-[15px] font-medium leading-5 text-white">{shot.caption}</p>
        </div>
      ) : null}
    </div>
  );
});
