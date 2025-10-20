import { useState } from "react";
import clsx from "clsx";

interface DifficultyToggleProps {
  onToggle: (isToggled: boolean) => void;
  color: string;
}

export default function DifficultyToggle({ onToggle, color }: DifficultyToggleProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleToggle = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    onToggle(newState);
  };

  return (
    <>
      <label className="inline-flex items-center cursor-pointer">
        <span className="me-3 text-xl font-medium text-gray-900">Easy</span>

        <input
          type="checkbox"
          className="sr-only peer"
          checked={isChecked}
          onChange={handleToggle}
        />

        <div
          className={clsx(
            "relative w-21 h-11 bg-white rounded-full peer",
            "after:content-[''] after:absolute after:top-[2px] after:start-[2px]",
            "after:rounded-full after:h-10 after:w-10",
            "after:transition-all peer-checked:bg-white"
          )}
        >
          <div
            className={clsx(
              "absolute top-[2px] start-[2px] h-10 w-10 rounded-full transition-transform duration-300",
              color,
              isChecked && "translate-x-full"
            )}
          ></div>
        </div>

        <span className="ms-3 text-xl font-medium text-gray-900">Hard</span>
      </label>
    </>
  );
}
