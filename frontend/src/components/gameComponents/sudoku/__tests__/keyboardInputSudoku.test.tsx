import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { keyboardInputSudoku } from '../keyboardInputsSudoku';

// Mock Sound Hook
const mockPlaySound = vi.fn();
vi.mock('../../../../hooks/useSound', () => ({
    useSound: () => mockPlaySound
}));

describe('keyboardInputSudoku Hook', () => {
    const mockSetSelectedCell = vi.fn();
    const mockSetIsNoteMode = vi.fn();
    const mockHandleInputCore = vi.fn();

    const defaultProps = {
        grid: [], // Not actually used by the hook logic directly for key handling
        selectedCell: { row: 4, col: 4 },
        isGameOver: false,
        isNoteMode: false,
        alreadyCompleted: null,
        setSelectedCell: mockSetSelectedCell,
        setIsNoteMode: mockSetIsNoteMode,
        handleInputCore: mockHandleInputCore
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Helper to trigger key event
    const triggerKey = (key: string) => {
        const event = new KeyboardEvent('keydown', { key });
        document.dispatchEvent(event);
    };

    it('calls handleInputCore when number keys (1-9) are pressed', () => {
        renderHook(() => keyboardInputSudoku(defaultProps));

        triggerKey('5');
        expect(mockHandleInputCore).toHaveBeenCalledWith(5);
        expect(mockPlaySound).toHaveBeenCalled();
    });

    it('calls handleInputCore with null when Delete/Backspace is pressed', () => {
        renderHook(() => keyboardInputSudoku(defaultProps));

        triggerKey('Backspace');
        expect(mockHandleInputCore).toHaveBeenCalledWith(null);

        triggerKey('Delete');
        expect(mockHandleInputCore).toHaveBeenCalledWith(null);
    });

    it('toggles note mode when "N" is pressed', () => {
        renderHook(() => keyboardInputSudoku(defaultProps));

        triggerKey('n');
        expect(mockSetIsNoteMode).toHaveBeenCalled();
    });

    it('moves selection with Arrow Keys', () => {
        renderHook(() => keyboardInputSudoku(defaultProps));

        // Up
        triggerKey('ArrowUp');
        expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 3, col: 4 });

        // Down
        triggerKey('ArrowDown');
        expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 5, col: 4 });

        // Left
        triggerKey('ArrowLeft');
        expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 4, col: 3 });

        // Right
        triggerKey('ArrowRight');
        expect(mockSetSelectedCell).toHaveBeenCalledWith({ row: 4, col: 5 });
    });

    it('does nothing if game is over', () => {
        renderHook(() => keyboardInputSudoku({ ...defaultProps, isGameOver: true }));

        triggerKey('5');
        expect(mockHandleInputCore).not.toHaveBeenCalled();
    });

    it('does nothing if no cell is selected', () => {
        renderHook(() => keyboardInputSudoku({ ...defaultProps, selectedCell: null }));

        triggerKey('5');
        expect(mockHandleInputCore).not.toHaveBeenCalled();
    });
});