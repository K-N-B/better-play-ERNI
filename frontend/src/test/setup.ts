import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Clean up after each test case
afterEach(() => {
  cleanup()
})

// 1. Mock Canvas Confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// 2. Mock Audio (The Fix)
// We define the mock first...
const AudioMock = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
}));

// ...and then use stubGlobal to attach it
vi.stubGlobal('Audio', AudioMock);