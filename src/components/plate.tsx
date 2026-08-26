import type { Shot } from "@/lib/types";

const SRC: Record<Shot["plate"], string> = {
  black: "/plates/plate-black.png",
  landfill: "/plates/plate-landfill.png",
  hand: "/plates/plate-hand.png",
  cut: "/plates/plate-cut.png",
  laugh: "/plates/plate-laugh.png",
  proof: "/plates/plate-proof.png",
  face: "/plates/plate-face.png",
  card: "/plates/plate-card.png",
  insert: "/plates/plate-insert.png",
};

export function Plate({
  shot,
  playing,
  compact = false,
}: {
  shot: Shot;
  playing: boolean;
  compact?: boolean;
}) {
  return (
    <div className="plate" data-playing={playing}>
      <img src={SRC[shot.plate] ?? SRC.insert} alt="" />
      {shot.caption && !compact ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-5 py-4">
          <p className="max-w-[24ch] text-[15px] font-medium leading-5 text-white">{shot.caption}</p>
        </div>
      ) : null}
    </div>
  );
}
