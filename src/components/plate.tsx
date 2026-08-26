import type { Shot } from "@/lib/types";

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
    <div className="plate" data-playing={playing} data-kind={shot.plate}>
      <div className="plate-move">{renderPlate(shot)}</div>
      <div className="plate-grain" />
      {shot.caption && !compact ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-5 py-4">
          <p className="max-w-[22ch] text-[15px] font-medium leading-5 text-white">{shot.caption}</p>
        </div>
      ) : null}
    </div>
  );
}

function renderPlate(shot: Shot) {
  switch (shot.plate) {
    case "black":
      return (
        <div className="absolute inset-0 bg-[#0c0d10]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1a1d24,transparent_55%)]" />
          <p className="absolute left-1/2 top-[44%] -translate-x-1/2 text-[clamp(1.4rem,4vw,2.6rem)] font-semibold tracking-[0.34em] text-white/90">
            NORTHWIND
          </p>
        </div>
      );
    case "landfill":
      return (
        <div className="absolute inset-0 bg-[#3a3226]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#6a5a3a_0%,#2a241c_70%)]" />
          <div className="absolute left-[8%] top-[18%] h-[28%] w-[36%] rotate-[-8deg] rounded-sm bg-[#c4b089]/80" />
          <div className="absolute right-[12%] top-[22%] h-[34%] w-[28%] rotate-[7deg] rounded-sm bg-[#8a6f45]" />
          <div className="absolute bottom-[16%] left-[16%] h-[22%] w-[62%] rounded-sm bg-[#1d1914]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,180,80,0.18),transparent_40%)]" />
        </div>
      );
    case "hand":
      return (
        <div className="absolute inset-0 bg-[#2a1c14]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_38%_42%,#c48a58,transparent_42%)]" />
          <div className="absolute left-[16%] top-[20%] h-[62%] w-[40%] rounded-[46%_50%_42%_56%] bg-[#d7a57a]" />
          <div className="absolute left-[34%] top-[36%] h-[28%] w-[22%] rounded-full bg-[#f4efe6] shadow-[inset_0_0_0_9px_#1a120e]" />
        </div>
      );
    case "cut":
      return (
        <div className="absolute inset-0 bg-[#ece7de]">
          <div className="absolute left-[18%] top-[12%] h-[76%] w-[1.5px] rotate-[16deg] bg-[#c43b2a]" />
          <div className="absolute left-[22%] top-[28%] text-[clamp(2.4rem,7vw,5rem)] font-semibold leading-none tracking-[-0.06em] text-[#16120e]">
            72
          </div>
        </div>
      );
    case "laugh":
      return (
        <div className="absolute inset-0 bg-[#d27a3a]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,#f0b46a,transparent_50%)]" />
          <div className="absolute right-6 top-6 rotate-[-7deg] rounded-md border border-[#2a160c] px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-[#2a160c]">
            KEEP
          </div>
          <div className="absolute left-[16%] bottom-[24%] h-[28%] w-[38%] rounded-[50%] border-[8px] border-[#2a160c]/25" />
        </div>
      );
    case "proof":
      return (
        <div className="absolute inset-0 bg-[#141922]">
          <div className="absolute inset-8 grid grid-cols-3 gap-2 text-white/90">
            {["1.0×", "0.28×", "same", "ask", "kept", "cut"].map((cell) => (
              <div key={cell} className="flex items-end rounded-md border border-white/12 p-2 text-lg font-medium">
                {cell}
              </div>
            ))}
          </div>
        </div>
      );
    case "face":
      return (
        <div className="absolute inset-0 bg-[#2b221c]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#8a6a4e,transparent_45%)]" />
          <div className="absolute left-1/2 top-[22%] h-[38%] w-[28%] -translate-x-1/2 rounded-[50%_50%_46%_46%] bg-[#c49a78]" />
          <div className="absolute left-1/2 top-[54%] h-[34%] w-[42%] -translate-x-1/2 rounded-[40%] bg-[#1c1612]" />
        </div>
      );
    case "card":
      return (
        <div className="absolute inset-0 bg-[#f3f1ec]">
          <p className="absolute left-8 top-8 text-[10px] uppercase tracking-[0.28em] text-[#6a645c]">End card</p>
          <p className="absolute left-8 top-[38%] text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[#16120e]">
            Slate
          </p>
        </div>
      );
    default:
      return (
        <div className="absolute inset-0 bg-[#2a241c]">
          <p className="absolute left-6 top-6 text-2xl font-semibold text-white">{shot.title}</p>
        </div>
      );
  }
}
