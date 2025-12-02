interface PhraseDisplayProps {
  solutionPhrase: string;
  guessedLetters: string[];
}

export const PhraseDisplay = ({
  solutionPhrase,
  guessedLetters,
}: PhraseDisplayProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mb-4 md:mb-8 w-full px-1">
      {solutionPhrase.split(" ").map((word, wordIndex) => (
        // WORD CONTAINER (The "Bubble")
        // We add padding (p-1.5), a border, and a background.
        // This visual box tells the user: "Everything inside here is one word"
        <div
          key={wordIndex}
          className="flex flex-wrap justify-center gap-0.5 p-1.5 rounded-xl bg-sky-100"
        >
          {word.split("").map((char, charIndex) => (
            <div
              key={charIndex}
              className="flex items-center justify-center 
                         h-6 w-4 
                         sm:h-12 sm:w-10 
                         md:h-14 md:w-12 
                         bg-white border-b-2 md:border-b-4 border-primary shadow-sm rounded-sm"
            >
              <span className="text-sm sm:text-2xl md:text-3xl font-bold uppercase select-none text-primary-900">
                {guessedLetters.includes(char.toUpperCase()) ? char : ""}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};