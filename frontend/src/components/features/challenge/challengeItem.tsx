// src/components/features/challenge/challengeItem.tsx - FIXED
import React from 'react';
import { Link } from 'react-router-dom';
import type { Challenge } from '../../../types/challenge';
import { Swords, CheckCircle, Hourglass, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ChallengeItemProps {
    challenge: Challenge;
    onPlayClick?: () => Promise<void>;
}

export const ChallengeItem: React.FC<ChallengeItemProps> = ({ challenge, onPlayClick }) => {
    const isPending = challenge.status === 'PENDING';
    const won = challenge.winner?.id === challenge.recipient?.id;
    const lost = challenge.winner?.id === challenge.challenger?.id;
    const opponent = challenge.challenger;
    
    // ✅ FIX: Access difficulty from the ChallengeSubmission type
    const difficulty = challenge.challenger_submission?.difficulty || 'easy';

    const handlePlayClick = async (e: React.MouseEvent) => {
        console.log('[ChallengeItem] ========== PLAY NOW CLICKED ==========');
        console.log('[ChallengeItem] challenge.id:', challenge.id);
        console.log('[ChallengeItem] challenge.puzzle_type:', challenge.puzzle_type);
        console.log('[ChallengeItem] challenge difficulty:', difficulty);
        console.log('[ChallengeItem] URL will be:', `/game/${challenge.puzzle_type}?challenge_id=${challenge.id}&difficulty=${difficulty}`);
        console.log('[ChallengeItem] ===========================================');
        
        if (onPlayClick) {
            e.preventDefault();
            await onPlayClick();
            // ✅ Include difficulty in URL
            window.location.href = `/game/${challenge.puzzle_type}?challenge_id=${challenge.id}&difficulty=${difficulty}`;
        }
    };

    return (
        <div className={clsx(
            "bg-white rounded-lg shadow p-4 border transition-all",
            isPending ? "border-blue-200 hover:border-blue-400" : "border-gray-200"
        )}>
            {/* Icon based on status */}
            <div className="flex items-start space-x-3">
                {isPending ? <Hourglass size={24} className="text-blue-500 mt-1" /> :
                    won ? <CheckCircle size={24} className="text-green-500 mt-1" /> :
                        lost ? <X size={24} className="text-red-500 mt-1" /> :
                            <Swords size={24} className="text-gray-400 mt-1" />}

                {/* Challenge Details */}
                <div className="flex-1">
                    <p className="font-medium text-gray-800">
                        Challenge {isPending ? 'from' : 'vs'} {opponent.username} on{' '}
                        <span className="capitalize">{challenge.puzzle_type}</span>
                        {/* ✅ Show difficulty badge */}
                        <span className={clsx(
                            "ml-2 px-2 py-0.5 text-xs rounded font-semibold",
                            difficulty === 'hard' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        )}>
                            {difficulty.toUpperCase()}
                        </span>
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                        {opponent.username}'s Score: {challenge.challenger_submission.points_awarded} pts
                    </p>

                    {challenge.recipient_submission && (
                        <div className="text-sm mt-2">
                            Your Score: {challenge.recipient_submission.points_awarded} pts
                            {won && <span className="ml-2 text-green-600 font-semibold">You Won!</span>}
                            {lost && <span className="ml-2 text-red-600 font-semibold">You Lost</span>}
                            {!isPending && !won && !lost && <span className="ml-2 text-gray-600 font-semibold">Tie</span>}
                        </div>
                    )}
                </div>

                {/* Play Now Button */}
                {isPending && (
                    <div className="ml-auto">
                        <Link
                            to={`/game/${challenge.puzzle_type}?challenge_id=${challenge.id}&difficulty=${difficulty}`}
                            onClick={handlePlayClick}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                            Play Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};