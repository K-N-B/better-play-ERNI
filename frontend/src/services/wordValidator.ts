// src/services/wordValidator.ts
type WordListsMap = Record<number, string[]>;

// A cache to store loaded word lists
const wordLists: WordListsMap = {};

// Dynamically import the JSON file for a given word length
const loadWordList = async (length: number): Promise<string[]> => {
  if (wordLists[length]) {
    return wordLists[length];
  }

  try {
    const listModule = await import(`../wordLists/words_${length}.json`);
    const list = listModule.default || listModule;
    wordLists[length] = list.map((w: string) => w.toUpperCase());
    return wordLists[length];
  } catch (err) {
    console.error(`Failed to load words of length ${length}:`, err);
    return [];
  }
};

/**
 * Check if a word is valid
 * @param word - The word to validate
 * @returns true if valid, false otherwise
 */
export const isValidWord = async (word: string): Promise<boolean> => {
  const upperWord = word.toUpperCase();
  const length = upperWord.length;

  if (length < 5 || length > 10) return false;

  const list = await loadWordList(length);
  return list.includes(upperWord);
};
