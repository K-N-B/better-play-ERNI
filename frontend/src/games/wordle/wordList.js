const API_URL = 'https://api.datamuse.com/words?sp=?????&max=1000'
const ADMIN_FILE_PATH = '/adminwordsforwordle.txt'
const WORD_LENGTH = 5

const FALLBACK_WORDS = [
  'OTHER',
  'WHICH',
  'APPLE',
  'ROUTE',
  'GREEN',
  'CRANE',
  'SLATE',
  'CHAIR',
  'SMILE',
  'BRAIN',
  'TRUST',
  'MONEY',
  'LIGHT',
  'STORM',
  'PLANT',
  'POWER',
  'BRAVE',
  'CLOUD',
  'FRAME',
]

const splitByDifficulty = (words) => {
  const easyCount = Math.max(1, Math.ceil(words.length * 0.6))
  return {
    easyWords: words.slice(0, easyCount),
    hardWords: words.slice(easyCount),
  }
}

const normaliseWords = (entries) => {
  const seen = new Set()

  return entries.reduce((acc, entry) => {
    const candidate = typeof entry.word === 'string' ? entry.word.toUpperCase() : ''

    if (
      candidate &&
      candidate.length === WORD_LENGTH &&
      /^[A-Z]+$/.test(candidate) &&
      !seen.has(candidate)
    ) {
      seen.add(candidate)
      acc.push(candidate)
    }
    return acc
  }, [])
}

const parseAdminWordList = (text) => {
  const seen = new Set()
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().toUpperCase())
    .filter((word) => {
      if (
        word &&
        word.length === WORD_LENGTH &&
        /^[A-Z]+$/.test(word) &&
        !seen.has(word)
      ) {
        seen.add(word)
        return true
      }
      return false
    })
}

const fetchAdminWords = async () => {
  if (typeof fetch !== 'function') return []

  try {
    const response = await fetch(ADMIN_FILE_PATH, { cache: 'no-store' })
    if (!response.ok) return []
    const text = await response.text()
    return parseAdminWordList(text)
  } catch (error) {
    console.warn('Unable to load admin word list, falling back to API.', error)
    return []
  }
}

export const FALLBACK_POOLS = splitByDifficulty([...FALLBACK_WORDS])

export const fetchWordPools = async () => {
  const adminWords = await fetchAdminWords()
  if (adminWords.length) {
    return splitByDifficulty(adminWords)
  }

  if (typeof fetch !== 'function') {
    throw new Error('Fetch API is not available in this environment.')
  }

  const response = await fetch(API_URL)
  if (!response.ok) {
    throw new Error(`Word source responded with status ${response.status}.`)
  }

  const payload = await response.json()
  const sortedEntries = [...payload].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0)
  )
  const words = normaliseWords(sortedEntries)

  if (!words.length) {
    throw new Error('Word source returned no usable entries.')
  }

  return splitByDifficulty(words)
}

export { FALLBACK_WORDS }
