// src/components/features/challenge/challengeItem.tsx - FIXED WINNER LOGIC

import React from 'react';
import { Link } from 'react-router-dom';
import type { Challenge } from '../../../types/challenge';
import { Swords, CheckCircle, Hourglass, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../../hooks/authContext';

interface ChallengeItemProps {
    challenge: Challenge;
    onPlayClick?: () => Promise<void>;
}

export const ChallengeItem: React.FC<ChallengeItemProps> = ({ challenge, onPlayClick }) => {
    const { user } = useAuth();  // ✅ Get current user
    const isPending = challenge.status === 'PENDING';

    // ✅ FIXED: Determine if current user won/lost
    const isChallenger = user?.id === challenge.challenger?.id;
    const isRecipient = user?.id === challenge.recipient?.id;
    
    // ✅ Win/loss logic based on who is viewing
    let won = false;
    let lost = false;
    
    if (!isPending && challenge.winner) {
        if (isChallenger) {
            // If I'm the challenger
            won = challenge.winner.id === challenge.challenger.id;
            lost = challenge.winner.id === challenge.recipient.id;
        } else if (isRecipient) {
            // If I'm the recipient
            won = challenge.winner.id === challenge.recipient.id;
            lost = challenge.winner.id === challenge.challenger.id;
        }
    }
    
    const isTie = !isPending && !challenge.winner;

    // ✅ Determine opponent based on who is viewing
    const opponent = isChallenger ? challenge.recipient : challenge.challenger;
    
    // ✅ Determine "my score" and "opponent's score"
    const myScore = isChallenger 
        ? challenge.challenger_submission?.points_awarded 
        : challenge.recipient_submission?.points_awarded;
    
    const opponentScore = isChallenger
        ? challenge.recipient_submission?.points_awarded
        : challenge.challenger_submission?.points_awarded;

    const handlePlayClick = async (e: React.MouseEvent) => {
        console.log('[ChallengeItem] ========== PLAY NOW CLICKED ==========');
        console.log('[ChallengeItem] challenge.id:', challenge.id);
        console.log('[ChallengeItem] challenge.puzzle_type:', challenge.puzzle_type);
        console.log('[ChallengeItem] URL will be:', `/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`);
        
        if (onPlayClick) {
            e.preventDefault();
            await onPlayClick();
            window.location.href = `/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`;
        }
    };

    return (
        <div className={clsx(
            "p-4 rounded-lg shadow flex items-center space-x-4 transition-shadow hover:shadow-md",
            isPending && "bg-yellow-50",
            won && "bg-green-50",
            lost && "bg-red-50",
            isTie && "bg-gray-50"
        )}>
            {/* Icon based on status */}
            <div className="flex-shrink-0">
                {isPending ? <Hourglass className="text-yellow-500" /> :
                    won ? <CheckCircle className="text-green-500" /> :
                        lost ? <X className="text-red-500" /> :
                            <Swords className="text-gray-500" />}
            </div>

            {/* Challenge Details */}
            <div className="flex-grow">
                <p className="text-sm">
                    Challenge {isPending ? 'from' : 'vs'} <strong className="font-medium">{opponent?.username}</strong> on{' '}
                    <strong className="font-medium capitalize">{challenge.puzzle_type}</strong>
                </p>
                
                {/* Show opponent's score for pending challenges */}
                {isPending && (
                    <p className="text-xs text-black">
                        {opponent?.username}'s Score: {opponentScore} pts
                    </p>
                )}
                
                {/* Show both scores for completed challenges */}
                {!isPending && (
                    <div className="mt-1">
                        <p className="text-xs text-black">
                            Your Score: <strong>{myScore ?? 0}</strong> pts
                        </p>
                        <p className="text-xs text-black">
                            {opponent?.username}'s Score: <strong>{opponentScore ?? 0}</strong> pts
                        </p>
                        
                        {/* Result Badge */}
                        <div className="mt-1">
                            {won && (
                                <span className="inline-block px-2 py-0.5 rounded bg-green-200 text-green-800 text-[10px] font-semibold">
                                    You Won! 🎉
                                </span>
                            )}
                            {lost && (
                                <span className="inline-block px-2 py-0.5 rounded bg-red-200 text-red-800 text-[10px] font-semibold">
                                    You Lost
                                </span>
                            )}
                            {isTie && (
                                <span className="inline-block px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-semibold">
                                    Tie
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Play Now Button */}
            {isPending && isRecipient && (
                <div className="flex-shrink-0 ml-auto">
                    <Link
                        to={`/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`}
                        onClick={handlePlayClick}
                        className="inline-block px-3 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-primary-dark shadow-sm transition-colors"
                    >
                        Play Now
                    </Link>
                </div>
            )}
        </div>
    );
};