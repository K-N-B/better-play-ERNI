import { gameCardData } from "../../../data/gameCardData";
import { Link } from "react-router-dom";

export const GamesStrip: React.FC = () => {
    return (
        <div className="mt-4 flex w-full overflow-visible shadow-md">
            {gameCardData.map((game, index) => {
                // Determine which corners to round
                let roundedClass = "";
                if (index === 0) roundedClass = "rounded-l-2xl";
                else if (index === gameCardData.length - 1) roundedClass = "rounded-r-2xl";

                return (
                    <div key={game.title} className="flex-1 overflow-visible">
                        <Link
                            to={game.path}
                            className={`
                flex flex-col items-center justify-center gap-2 p-4
                ${game.bgColor} ${game.shadowColor} text-white
                ${roundedClass}
                shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0]
                hover:translate-y-1 active:translate-y-2 transition-all
              `}
                            style={{ willChange: "transform, box-shadow" }}
                        >
                            <game.IconComponent className="size-8" strokeWidth={2.5} />
                            <span className="text-sm font-semibold text-center">{game.title}</span>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
};
