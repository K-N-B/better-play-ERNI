import { ChallengeItem } from './challengeItem';
import { Clock, AlertCircle } from 'lucide-react';
import type { Challenge } from '../../../types/challenge';
import type { UserProfile } from '../../../types/user'; // adjust if your user type is elsewhere

interface PendingChallengesProps {
    user: UserProfile;
    activePending: Challenge[];
    expiredPending: Challenge[];
    refreshChallenges: () => Promise<void>;
}

export const PendingChallenges = ({
    user,
    activePending,
    expiredPending,
    refreshChallenges,
}: PendingChallengesProps) => {
    
    const toYou = activePending.filter(
        (c: Challenge) => c.recipient.id === user.id
    );

    const fromYou = activePending.filter(
        (c: Challenge) => c.challenger.id === user.id
    );

    return (
        <div className="space-y-3">

            {/* Active sections */}
            {activePending.length > 0 && (
                <>
                    {/* Challenges for You */}
                    {toYou.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                                Challenges for You
                            </h3>
                            <div className="space-y-3">
                                {toYou.map((c: Challenge) => (
                                    <ChallengeItem
                                        key={`toyou-${c.id}`}
                                        challenge={c}
                                        onPlayClick={refreshChallenges}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Challenges You Sent */}
                    {fromYou.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                                Challenges You Sent
                            </h3>
                            <div className="space-y-3">
                                {fromYou.map((c: Challenge) => (
                                    <ChallengeItem
                                        key={`fromyou-${c.id}`}
                                        challenge={c}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Expired */}
            {expiredPending.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3 text-orange-600">
                        <AlertCircle size={18} />
                        <h3 className="font-semibold">Expired Challenges</h3>
                    </div>
                    <div className="space-y-3">
                        {expiredPending.map((c: Challenge) => (
                            <ChallengeItem key={`expired-${c.id}`} challenge={c} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {activePending.length === 0 && expiredPending.length === 0 && (
                <div className="text-center py-16">
                    <Clock className="mx-auto text-gray-300 mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Pending Challenges
                    </h3>
                    <p className="text-gray-500">
                        You're all caught up! Check back later for new challenges.
                    </p>
                </div>
            )}
        </div>
    );
};
