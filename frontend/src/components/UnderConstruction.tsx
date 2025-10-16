import clsx from "clsx";

interface UnderConstructionProps {
  title: string; // e.g. "ERNIgram"
  bg: string; // Tailwind color for the toggle knob, e.g. "bg-sky-500"
  text: string;
}

export default function UnderConstruction({
  title,
  bg,
  text, // default color
}: UnderConstructionProps) {
  return (
    <>
      <div
        className={clsx(
          "h-full w-full rounded-4xl p-20 flex items-center justify-center text-center", 
          bg
        )}
      >
        <div className={text}>
          <div className="text-4xl font-bold mb-2">Oops!</div>
          <div className="text-xl font-semibold">
            You’ve discovered the {title} page still under construction 🏗️ .
          </div>
        </div>
      </div>
    </>
  );
}
