// Takes the solutionPhrase and guessedLetters as props. It renders the phrase, showing _ for unguessed letters and the correct letter where guessed.

interface PhraseDisplayProps {
  solutionPhrase: string;
  guessedLetters: string[];
}

export const PhraseDisplay = ({ solutionPhrase, guessedLetters }: PhraseDisplayProps) => {
  return (
    <div className="flex justify-center flex-wrap gap-2 mb-6">
      {solutionPhrase.split(' ').map((word, wordIndex) => (
        <div key={wordIndex} className="flex gap-1.5">
          {word.split('').map((char, charIndex) => (
            <div
              key={charIndex}
              className="flex items-center justify-center h-12 w-10 sm:h-14 sm:w-12 
                        bg-white border-b-4 border-primary"
            >
              <span className="text-3xl font-bold uppercase">
                {guessedLetters.includes(char.toUpperCase()) ? char : ''}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};