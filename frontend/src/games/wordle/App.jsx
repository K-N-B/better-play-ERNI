import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import './App.css'
import Grid from './components/Grid'
import Keyboard from './components/Keyboard'
import { fetchWordPools, FALLBACK_POOLS } from './wordList'

const WORD_LENGTH = 5
const EASY_START_POINTS = 100
const HARD_START_POINTS = 200
const HINT_COST = {
  easy: 20,
  hard: 40,
}
const STORAGE_KEY = 'wordle.dailyState'

const createEmptyGuesses = () => Array(6).fill('')

const pickRandomWord = (words) => {
  const pool = words.length ? words : FALLBACK_POOLS.easyWords
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]?.toUpperCase() ?? 'APPLE'
}

function App() {
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const [difficulty, setDifficulty] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [solution, setSolution] = useState('')
  const [guesses, setGuesses] = useState(createEmptyGuesses)
  const [currentGuess, setCurrentGuess] = useState('')
  const [isGameOver, setIsGameOver] = useState(false)
  const [currentRow, setCurrentRow] = useState(0)
  const [points, setPoints] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [hintText, setHintText] = useState('')
  const [hintIndex, setHintIndex] = useState(null)
  const [dailyComplete, setDailyComplete] = useState(false)
  const [wordPools, setWordPools] = useState({
    easy: FALLBACK_POOLS.easyWords,
    hard: FALLBACK_POOLS.hardWords,
  })
  const [isFetchingWords, setIsFetchingWords] = useState(false)
  const [wordFetchError, setWordFetchError] = useState('')
  const [hasHydrated, setHasHydrated] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [activeKey, setActiveKey] = useState(null)
  const activeKeyTimeoutRef = useRef(null)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const initializePuzzle = useCallback((mode, solutionWord, persisted = {}) => {
    const initialGuesses =
      Array.isArray(persisted.guesses) && persisted.guesses.length === 6
        ? persisted.guesses
        : createEmptyGuesses()

    const initialRow =
      typeof persisted.currentRow === 'number' &&
      persisted.currentRow >= 0 &&
      persisted.currentRow < initialGuesses.length
        ? persisted.currentRow
        : 0

    const nextPoints =
      typeof persisted.points === 'number'
        ? persisted.points
        : mode === 'hard'
          ? HARD_START_POINTS
          : EASY_START_POINTS

    const storedCurrentGuess =
      typeof persisted.currentGuess === 'string' ? persisted.currentGuess : ''

    const storedHintText =
      typeof persisted.hintText === 'string' ? persisted.hintText : ''

    const storedHintIndex =
      typeof persisted.hintIndex === 'number' ? persisted.hintIndex : null

    const puzzleCompleted = Boolean(persisted.completed || persisted.isGameOver)

    setDifficulty(mode)
    setSelectedDifficulty(mode)
    setSolution(solutionWord)
    setGuesses(initialGuesses)
    setCurrentGuess(storedCurrentGuess)
    setCurrentRow(initialRow)
    setIsGameOver(puzzleCompleted)
    setDailyComplete(puzzleCompleted)
    setPoints(nextPoints)
    setHintUsed(Boolean(persisted.hintUsed))
    setHintText(storedHintText)
    setHintIndex(storedHintIndex)

    const storedTimer = typeof persisted.timer === 'number' ? persisted.timer : 0
    setTimer(storedTimer)
    const resumeTimer =
      !puzzleCompleted && (persisted.isTimerRunning === undefined ? true : Boolean(persisted.isTimerRunning))
    setIsTimerRunning(resumeTimer)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      setHasHydrated(true)
      return
    }

    let storedState = null
    try {
      storedState = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    } catch (error) {
      console.error('Unable to read stored puzzle state', error)
    }

    if (
      storedState &&
      storedState.date === todayKey &&
      storedState.solution &&
      storedState.difficulty
    ) {
      initializePuzzle(storedState.difficulty, storedState.solution, storedState)
    } else if (storedState) {
      window.localStorage.removeItem(STORAGE_KEY)
    }

    setHasHydrated(true)
  }, [initializePuzzle, todayKey])

  useEffect(() => {
    let isActive = true

    const loadWords = async () => {
      setIsFetchingWords(true)
      try {
        const pools = await fetchWordPools()
        if (isActive) {
          setWordPools({ easy: pools.easyWords, hard: pools.hardWords })
          setWordFetchError('')
        }
      } catch (error) {
        console.error('Failed to fetch word pools', error)
        if (isActive) {
          setWordPools({
            easy: FALLBACK_POOLS.easyWords,
            hard: FALLBACK_POOLS.hardWords,
          })
          setWordFetchError('Unable to load new words. Using fallback list.')
        }
      } finally {
        if (isActive) {
          setIsFetchingWords(false)
        }
      }
    }

    loadWords()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated || !difficulty || !solution || typeof window === 'undefined') {
      return
    }

    const payload = {
      date: todayKey,
      difficulty,
      solution,
      guesses,
      currentGuess,
      currentRow,
      isGameOver,
      points,
      hintUsed,
      hintText,
      hintIndex,
      completed: dailyComplete,
      timer,
      isTimerRunning,
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (error) {
      console.error('Unable to persist puzzle progress', error)
    }
  }, [
    currentGuess,
    currentRow,
    dailyComplete,
    difficulty,
    guesses,
    hasHydrated,
    hintIndex,
    hintText,
    hintUsed,
    isGameOver,
    points,
    solution,
    timer,
    isTimerRunning,
    todayKey,
  ])

  useEffect(() => {
    if (!isTimerRunning) return

    const intervalId = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isTimerRunning])

  useEffect(() => {
    if (isGameOver) {
      setIsTimerRunning(false)
    }
  }, [isGameOver])

  const getPoolForMode = (mode) => {
    if (mode === 'hard') {
      if (wordPools.hard.length) return wordPools.hard
      if (wordPools.easy.length) return wordPools.easy
      return FALLBACK_POOLS.hardWords
    }

    if (wordPools.easy.length) return wordPools.easy
    return FALLBACK_POOLS.easyWords
  }

  const startGame = (mode) => {
    if (!hasHydrated) return
    if (isFetchingWords) {
      alert('Still loading fresh words. Please wait a moment.')
      return
    }

    if (difficulty) {
      return
    }

    const pool = getPoolForMode(mode)
    const selectedWord = pickRandomWord(pool)
    initializePuzzle(mode, selectedWord)
  }

  const handleDifficultySelect = (mode) => {
    if (isFetchingWords || !hasHydrated) return
    setSelectedDifficulty(mode)
    startGame(mode)
  }

  const registerActiveKey = useCallback((key) => {
    if (!key) return
    setActiveKey(key)
    if (activeKeyTimeoutRef.current) {
      clearTimeout(activeKeyTimeoutRef.current)
    }
    activeKeyTimeoutRef.current = setTimeout(() => {
      setActiveKey(null)
      activeKeyTimeoutRef.current = null
    }, 150)
  }, [])

  const validateHardModeGuess = (guess) => {
    if (difficulty !== 'hard') return null

    const lockedPositions = new Map()
    const requiredLetters = new Set()

    guesses
      .slice(0, currentRow)
      .filter((prevGuess) => prevGuess && prevGuess.length === WORD_LENGTH)
      .forEach((prevGuess) => {
        for (let index = 0; index < WORD_LENGTH; index += 1) {
          const letter = prevGuess[index]

          if (!letter) continue

          if (solution[index] === letter) {
            lockedPositions.set(index, letter)
          } else if (solution.includes(letter)) {
            requiredLetters.add(letter)
          }
        }
      })

    for (const [index, letter] of lockedPositions.entries()) {
      if (guess[index] !== letter) {
        return `Hard mode: keep ${letter} locked in position ${index + 1}.`
      }
    }

    for (const letter of requiredLetters.values()) {
      if (!guess.includes(letter)) {
        return `Hard mode: reuse hinted letter ${letter}.`
      }
    }

    return null
  }

  const handleKeyPress = useCallback(
    (key) => {
      registerActiveKey(key)
      if (!difficulty || isGameOver) return

      if (key === 'ENTER') {
        if (currentGuess.length !== WORD_LENGTH) return

        const violation = validateHardModeGuess(currentGuess)
        if (violation) {
          alert(violation)
          return
        }

        const newGuesses = [...guesses]
        newGuesses[currentRow] = currentGuess
        setGuesses(newGuesses)

        if (currentGuess === solution) {
          setIsGameOver(true)
          setDailyComplete(true)
          setCurrentGuess('')
          setTimeout(() => alert('You won!'), 100)
        } else if (currentRow === guesses.length - 1) {
          setIsGameOver(true)
          setDailyComplete(true)
          setCurrentGuess('')
          setTimeout(() => alert(`Game Over! The word was ${solution}`), 100)
        } else {
          setCurrentRow((prev) => prev + 1)
          setCurrentGuess('')
        }
      } else if (key === 'BACKSPACE') {
        setCurrentGuess((prev) => prev.slice(0, -1))
      } else if (currentGuess.length < WORD_LENGTH && /^[A-Z]$/.test(key)) {
        setCurrentGuess((prev) => prev + key)
      }
    },
    [currentGuess, currentRow, difficulty, guesses, isGameOver, registerActiveKey, solution]
  )

  const handleHint = () => {
    if (!difficulty || hintUsed || isGameOver || !solution) return

    const cost = difficulty === 'hard' ? HINT_COST.hard : HINT_COST.easy

    const lockedIndices = new Set()

    guesses.forEach((guess) => {
      if (!guess || guess.length !== WORD_LENGTH) return
      for (let index = 0; index < WORD_LENGTH; index += 1) {
        if (guess[index] === solution[index]) {
          lockedIndices.add(index)
        }
      }
    })

    let indexToReveal = hintIndex
    if (indexToReveal === null) {
      for (let index = 0; index < WORD_LENGTH; index += 1) {
        if (!lockedIndices.has(index)) {
          indexToReveal = index
          break
        }
      }
    }

    if (indexToReveal === null) {
      indexToReveal = 0
    }

    const revealedLetter = solution[indexToReveal]

    setHintUsed(true)
    setHintIndex(indexToReveal)
    setHintText(`Hint: Position ${indexToReveal + 1} contains the letter ${revealedLetter}.`)
    setPoints((prev) => Math.max(0, prev - cost))
  }

  const forfeitPuzzle = useCallback(
    ({ showAlert = true, message } = {}) => {
      if (!difficulty || isGameOver || !solution) return

      setGuesses((prevGuesses) => {
        if (!prevGuesses.length) {
          return prevGuesses
        }
        const updated = [...prevGuesses]
        const targetRow =
          currentRow < updated.length ? currentRow : updated.length - 1
        updated[targetRow] = solution
        return updated
      })

      setPoints(0)
      setIsGameOver(true)
      setDailyComplete(true)
      setHintText(message ?? `Solution revealed: ${solution}.`)
      setCurrentGuess('')
      setIsTimerRunning(false)

      if (showAlert) {
        setTimeout(() => alert(`Puzzle forfeited. The solution was ${solution}.`), 100)
      }
    },
    [currentRow, difficulty, isGameOver, solution]
  )

  const handleSolve = () => {
    forfeitPuzzle()
  }

  useEffect(() => {
    if (!difficulty || isGameOver || timer < 300) {
      return
    }

    forfeitPuzzle({
      showAlert: false,
      message: `Time expired. Solution revealed: ${solution}.`,
    })
  }, [difficulty, forfeitPuzzle, isGameOver, solution, timer])

  const resetToDifficultySelection = useCallback(() => {
    setDifficulty(null)
    setSelectedDifficulty(null)
    setSolution('')
    setGuesses(createEmptyGuesses())
    setCurrentGuess('')
    setCurrentRow(0)
    setIsGameOver(false)
    setDailyComplete(false)
    setPoints(0)
    setHintUsed(false)
    setHintText('')
    setHintIndex(null)
    setTimer(0)
    setIsTimerRunning(false)
    setActiveKey(null)
    if (activeKeyTimeoutRef.current) {
      clearTimeout(activeKeyTimeoutRef.current)
      activeKeyTimeoutRef.current = null
    }
  }, [])

  const handleNewGame = () => {
    if (!hasHydrated) return
    const confirmReset = window.confirm(
      "Start a new puzzle? This will reset today's progress and return to the difficulty selection."
    )
    if (!confirmReset) return

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }

    resetToDifficultySelection()
  }

  useEffect(() => {
    if (!difficulty) return

    const handleKeyDown = (event) => {
      const key = event.key.toUpperCase()
      if (key === 'ENTER' || key === 'BACKSPACE') {
        handleKeyPress(key)
      } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [difficulty, handleKeyPress])

  useEffect(() => {
    return () => {
      if (activeKeyTimeoutRef.current) {
        clearTimeout(activeKeyTimeoutRef.current)
      }
    }
  }, [])

  const hintDisabled = hintUsed || isGameOver
  const solveDisabled = isGameOver
  const hintLabel =
    difficulty === 'hard'
      ? `Hint (-${HINT_COST.hard} pts)`
      : `Hint (-${HINT_COST.easy} pts)`

  const puzzleMessage = dailyComplete
    ? 'Daily puzzle complete. Come back tomorrow for a new challenge.'
    : difficulty
      ? `Playing today's ${difficulty === 'hard' ? 'Hard' : 'Easy'} puzzle.`
      : ''

  return (
    <div className='app'>
      <h1>Wordle</h1>
      {!difficulty ? (
        <>
          <div className='difficulty-status-wrapper'>
            {isFetchingWords && (
              <p className='difficulty-status'>Loading word bank from Datamuse...</p>
            )}
            {wordFetchError && (
              <p className='difficulty-status error'>{wordFetchError}</p>
            )}
          </div>
          <div className='difficulty-selector'>
            <div className='difficulty-card easy'>
              <h2>Easy Mode</h2>
              <p>For casual play and exploration.</p>
              <ul>
                <li>Guesses stay flexible - test any word.</li>
                <li>Hints are optional, not enforced.</li>
                <li>Solution comes from a friendlier word list.</li>
                <li>Accessible extras like free-form retries.</li>
              </ul>
              <button
                type='button'
                className='select-difficulty-button active'
                onClick={() => handleDifficultySelect('easy')}
              >
                {isFetchingWords ? 'Preparing...' : 'Start Easy Mode'}
              </button>
            </div>

            <div className='difficulty-card hard'>
              <h2>Hard Mode</h2>
              <p>For strategic, constraint-driven play.</p>
              <ul>
                <li>Lock in blue letters - they cannot move.</li>
                <li>Reuse every yellow hint on the next guess.</li>
                <li>Draws from trickier solution words.</li>
                <li>No mercy: every guess must count.</li>
              </ul>
              <button
                type='button'
                className='select-difficulty-button active'
                onClick={() => handleDifficultySelect('hard')}
              >
                {isFetchingWords ? 'Preparing...' : 'Start Hard Mode'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className='mode-banner'>
            <div className='player-details'>
              <span className='player-name'>Player Name: John Doe</span>
              <span className='player-points'>
                {`Current Points: ${points}`}
              </span>
              <span className='player-time'>
                {`Time: ${formatTime(timer)}`}
              </span>
            </div>
            <div className='mode-actions'>
              <button
                type='button'
                className='new-game-button'
                onClick={handleNewGame}
              >
                New Game (For Debug Only)
              </button>
              <button
                type='button'
                className='hint-button'
                onClick={handleHint}
                disabled={hintDisabled}
              >
                {hintLabel}
              </button>
              <button
                type='button'
                className='solve-button'
                onClick={handleSolve}
                disabled={solveDisabled}
              >
                Solve Puzzle (Forfeit)
              </button>
            </div>
          </div>
          {puzzleMessage && (
            <p className={`puzzle-message${dailyComplete ? ' complete' : ''}`}>
              {puzzleMessage}
            </p>
          )}
          {wordFetchError && (
            <p className='difficulty-status error'>{wordFetchError}</p>
          )}
          {hintText && <p className='hint-text'>{hintText}</p>}
          <Grid
            guesses={guesses}
            currentGuess={currentGuess}
            currentRow={currentRow}
            solution={solution}
          />
          <Keyboard
            onKeyPress={handleKeyPress}
            guesses={guesses}
            solution={solution}
            activeKey={activeKey}
          />
        </>
      )}
    </div>
  )
}

export default App
