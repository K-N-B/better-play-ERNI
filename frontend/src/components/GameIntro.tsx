import DifficultyToggle from "./DifficultyToggle";

interface PuzzleIntroProps {
  title: string; // e.g. "ERNIgram"
  description: string; // Intro text (the first block)
  howToPlay: string; // Instruction content
  pointsInfo: string; // Main points description
  hintInfo: string; // Hint/bonus info
  onStart: () => void; // Function when "Start" button is clicked
  onDifficultyChange: (difficulty: "easy" | "hard") => void; // Callback when toggled
  color?: string; // Tailwind color for the toggle knob, e.g. "bg-sky-500"
}

export default function GameIntro({
  title,
  description,
  howToPlay,
  pointsInfo,
  hintInfo,
  onStart,
  onDifficultyChange,
  color = "bg-sky-500", // default color
}: PuzzleIntroProps) {
  return (
    <div className="h-full text-center grid grid-cols-2">
      {/* LEFT SIDE */}
      <div className="place-content-center p-20 text-2xl leading-6 bg-white h-full rounded-3xl">
        <div className="font-medium">{description}</div>
        <div className="font-semibold mt-8">How to play:</div>
        <div className="mt-2">{howToPlay}</div>
      </div>

      {/* RIGHT SIDE */}
      <div className="place-content-center p-20 text-xl leading-5">
        <div className="text-5xl font-bold">{title}</div>

        <div className="mt-10 font-medium">
          <div dangerouslySetInnerHTML={{ __html: pointsInfo }} />
          <div className="mt-10" dangerouslySetInnerHTML={{ __html: hintInfo }} />
        </div>

        <div className="mt-6 text-xl">
          <div className="font-semibold text-black mb-4">Choose a difficulty:</div>

          <DifficultyToggle
            onToggle={(isHard) => onDifficultyChange(isHard ? "hard" : "easy")}
            color={color}
          />

          <div className="difficulty-buttons mt-10">
            <button
              onClick={onStart}
              className="font-semibold text-primary text-4xl leading-none px-6 py-4 rounded-2xl bg-sky-400 text-slate-50 shadow-[0_5px_0_0] shadow-sky-800"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
