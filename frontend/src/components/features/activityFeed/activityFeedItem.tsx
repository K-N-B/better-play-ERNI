// src/components/features/activityFeed/activityFeedItem.tsx 
import React from 'react';
import type { ActivityEvent } from '../../../types/activity';
import clsx from 'clsx';
import { formatTimeAgo } from '../../../utils/timeFormat';
import { Swords, Brain, PenTool, TextInitial } from 'lucide-react';

interface ActivityFeedItemProps {
    event: ActivityEvent;
}

// ===== Unified Activity Styles and Icons =====

const activityConfig = {
    puzzles: {
        Sudoku: {
            icon: Brain,
            text: "text-pink-600",
            bg: "bg-pink-100/60",
            avatarBg: "bg-pink-400",
            avatarText: "text-pink-800",
        },
        Wordle: {
            icon: TextInitial,
            text: "text-emerald-600",
            bg: "bg-emerald-100/60",
            avatarBg: "bg-emerald-400",
            avatarText: "text-emerald-800",
        },
        ERNIgram: {
            icon: PenTool,
            text: "text-sky-600",
            bg: "bg-sky-100/60",
            avatarBg: "bg-sky-400",
            avatarText: "text-sky-800",
        },
    },

    challenge: {
        icon: Swords,
        text: "text-orange-600",
        bg: "bg-orange-100/60",
        avatarBg: "bg-orange-400",
        avatarText: "text-orange-900",
    },
};


// Helper: Render avatar with profile picture or initial
const UserAvatar: React.FC<{
    user: { username: string; profile_picture_url: string | null };
    styleClasses: { avatarBg: string; avatarText: string };
}> = ({ user, styleClasses }) => {
    const userInitial = user.username.charAt(0).toUpperCase();

    return (
        <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden shadow-md">
            {user.profile_picture_url ? (
                <img
                    src={user.profile_picture_url}
                    alt={`${user.username} profile picture`}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className={clsx(
                    "w-full h-full flex items-center justify-center text-xl font-bold bg-white",
                    styleClasses.avatarText
                )}>
                    {userInitial}
                </div>
            )}
        </div>
    );
};

const AvatarWithBadge: React.FC<{
    user: { username: string; profile_picture_url: string | null };
    styleClasses: { avatarBg: string; avatarText: string };
    BadgeIcon: React.FC<any>;
    badgeColor: string;
}> = ({ user, styleClasses, BadgeIcon, badgeColor }) => {

    return (
        <div className="relative shrink-0 w-10 h-10">
            <UserAvatar user={user} styleClasses={styleClasses} />

            {/* Badge */}
            <div
                className={clsx(
                    "absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-6 h-6 rounded-full flex items-center justify-center shadow-md",
                    badgeColor
                )}
            >
                <BadgeIcon size={12} className="text-white" />
            </div>

        </div>
    );
};


export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ event }) => {
    const timeAgo = formatTimeAgo(event.created_at);

    // Submission styling
    const puzzleCfg = event.puzzle_name
        ? activityConfig.puzzles[event.puzzle_name]
        : null;

    // Challenge styling (always orange)
    const challengeCfg = activityConfig.challenge;

    console.log("ACTIVITY EVENT:", event);
    console.log("event_type:", event.event_type);
    console.log("puzzle_name:", event.puzzle_name);


    // SUBMISSION EVENT
    if (event.event_type === 'submission' && event.user && puzzleCfg) {
        return (
            <div className={clsx("flex items-start space-x-4 p-3 sm:p-4 rounded-xl relative", puzzleCfg.bg)}>
                <AvatarWithBadge
                    user={event.user}
                    styleClasses={puzzleCfg}
                    BadgeIcon={puzzleCfg.icon}
                    badgeColor={puzzleCfg.avatarBg}
                />

                <div className="flex-1 min-w-0">
                    <div className="text-gray-700 text-sm sm:text-base leading-snug">
                        <strong className="text-gray-900 font-semibold">{event.user.username}</strong>
                        <span> just finished answering today's </span>
                        <strong className={clsx("font-semibold", puzzleCfg.text)}>{event.puzzle_name}</strong>
                        <span> puzzle in </span>
                        <strong className="text-gray-900 font-semibold">{event.difficulty}</strong>
                        <span> mode in just </span>
                        <strong className="text-gray-900 font-semibold">{event.time_in_minutes} minutes!</strong>
                    </div>

                    <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
                </div>
            </div>
        );
    }

    // CHALLENGE SENT EVENT
    if (event.event_type === 'challenge_sent') {
        return (
            <div className={clsx("flex items-start space-x-4 p-3 sm:p-4 rounded-xl relative", challengeCfg.bg)}>
                <AvatarWithBadge
                    user={event.challenger}
                    styleClasses={challengeCfg}
                    BadgeIcon={challengeCfg.icon}
                    badgeColor={challengeCfg.avatarBg}
                />

                <div className="flex-1 min-w-0">
                    <div className="text-gray-700 text-sm sm:text-base leading-snug">
                        <strong className="text-gray-900 font-semibold">{event.challenger.username}</strong>
                        <span> challenged </span>
                        <strong className="text-gray-900 font-semibold">{event.recipient.username}</strong>
                        <span> to beat their </span>
                        <strong className={clsx("font-semibold", challengeCfg.text)}>{event.puzzle_name}</strong>
                        <span> score on </span>
                        <strong className="text-gray-900 font-semibold">{event.difficulty}</strong>
                        <span> difficulty!</span>
                    </div>

                    <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
                </div>
            </div>
        );
    }

    // CHALLENGE COMPLETED
    if (event.event_type === "challenge_completed") {
        let outcomeText;
        if (!event.winner) {
            // Tie
            outcomeText = 'TIED with';
        } else if (event.winner.id === event.recipient.id) {
            outcomeText = 'WON against';
        } else {
            outcomeText = 'LOST to';
        }
        return (
            <div className={clsx("flex items-start space-x-4 p-3 rounded-xl", challengeCfg.bg)}>
                <AvatarWithBadge
                    user={event.recipient}
                    styleClasses={challengeCfg}
                    BadgeIcon={challengeCfg.icon}
                    badgeColor={challengeCfg.avatarBg}
                />

                <div className="flex-1 min-w-0">
                    <div className="text-gray-700 text-sm sm:text-base leading-snug">
                        <strong className="text-gray-900 font-semibold">{event.recipient.username}</strong>
                        <span> completed </span>
                        <strong className="text-gray-900 font-semibold">{event.challenger.username}</strong>
                        <span>'s </span>
                        <strong className={clsx("font-semibold", challengeCfg.text)}>{event.puzzle_name}</strong>
                        <span> challenge and </span>
                        <strong className={clsx("font-bold", challengeCfg.text)}>{outcomeText}</strong>
                        <span> them!</span>
                    </div>

                    <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
                </div>
            </div>
        );
    }
    // FALLBACK
    return (
        
        <div className="flex items-center space-x-4 p-3 sm:p-4 rounded-xl bg-gray-100/60">
            <div className="text-gray-600 text-sm">Unknown activity type</div>
            <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
    );
};