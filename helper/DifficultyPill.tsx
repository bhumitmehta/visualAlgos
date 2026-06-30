type Difficulty = "Easy" | "Medium" | "Hard";

export default function DifficultyPill({ diff }: { diff: Difficulty }) {
  const colors = {
    Easy:   { bg: "rgba(16,185,129,0.1)",  text: "#6EE7B7", dot: "#10B981" },
    Medium: { bg: "rgba(245,158,11,0.1)",  text: "#FCD34D", dot: "#F59E0B" },
    Hard:   { bg: "rgba(239,68,68,0.1)",   text: "#FCA5A5", dot: "#EF4444" },
  }[diff];
  return (
    <span style={{ background: colors.bg, color: colors.text }}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest">
      <span style={{ background: colors.dot }} className="w-1.5 h-1.5 rounded-full" />
      {diff}
    </span>
  );
}
