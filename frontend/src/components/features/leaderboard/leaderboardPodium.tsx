import type { IndividualScoreEntry, DepartmentScoreEntry, LeaderboardType } from '../../../types/leaderboard';

// Define a union type for the entries
type LeaderboardEntry = IndividualScoreEntry | DepartmentScoreEntry;

interface LeaderboardPodiumProps {
  topThree: LeaderboardEntry[];
  type: LeaderboardType;
}

// Helper component for a single podium item (flag)
const PodiumItem: React.FC<{
  entry: LeaderboardEntry;
  rank: number;
  type: LeaderboardType;
  color: string;
  shadowColor: string;
  textColor: string;
  sizeClass: string;
  topClass: string;
  numTopClass: string;
}> = ({ entry, rank, type, color, shadowColor, textColor, sizeClass, topClass, numTopClass }) => {
  
  console.log(`[PodiumItem] Rank ${rank}, Type: ${type}, Entry:`, entry);
  
  let name = 'Unknown';
  let id = rank;
  let profileImageUrl: string | null = null;
  
  // Extract user/department data and profile picture
  if (type === 'department') {
    if ('department' in entry && entry.department) {
      name = entry.department.name || 'Unknown Dept';
      id = entry.department.id || rank;
      console.log(`[PodiumItem] Extracted department name: ${name}`);
    } else {
      console.error(`[PodiumItem] Department type but no department data:`, entry);
    }
  } else if (type === 'individual') {
    if ('user' in entry && entry.user) {
      name = entry.user.username || 'Unknown User';
      id = entry.user.id || rank;
      profileImageUrl = entry.user.profile_picture_url || null;
      console.log(`[PodiumItem] Extracted username: ${name}, Profile URL: ${profileImageUrl}`);
    } else {
      console.error(`[PodiumItem] Individual type but no user data:`, entry);
    }
  }
  
  const score = entry.score || 0;
  const rankSuffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : 'rd';
  const userInitial = name.charAt(0).toUpperCase();

  console.log(`[PodiumItem] Final display - Rank: ${rank}, Name: ${name}, Score: ${score}`);

  return (
    <div className={`col-span-1 flex justify-center ${rank === 1 ? 'mt-0' : 'mt-4'}`}>
      <div id={`flag-${rank}`} className={`relative flex justify-center ${sizeClass}`}>
        {/* Base SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 169 236"
          fill="none"
          className={`w-full h-auto drop-shadow-[0_8px_0_${shadowColor}]`}
        >
          <path
            d="M0.118652 5.29646e-05H168.882V182.37C168.882 186.74 166.406 190.734 162.49 192.677L89.6162 228.847C86.3931 230.447 82.6073 230.447 79.3843 228.847L6.51001 192.677C2.59489 190.734 0.118652 186.74 0.118652 182.37V5.29646e-05Z"
            fill={color}
          />
        </svg>

        {/* Rank Circle */}
        <div className={`absolute z-30 w-8 h-8 ${numTopClass} rounded-full flex items-center justify-center`} style={{ backgroundColor: shadowColor }}>
          <p className="text-white text-sm font-extrabold leading-none">
            {rank}<sup className="pt-1 font-semibold">{rankSuffix}</sup>
          </p>
        </div>

        {/* Avatar Circle - Updated with profile picture */}
        <div className={`absolute z-20 rounded-full w-20 h-20 overflow-hidden ${topClass}`}>
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={`${name} profile picture`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-sky-400 flex items-center justify-center text-white text-2xl font-bold">
              {userInitial}
            </div>
          )}
        </div>

        {/* Text */}
        <div className={`absolute z-20 ${rank === 1 ? 'top-32' : 'top-28'} text-center w-full px-2`}>
          <p className={`text-sm font-semibold m-0 p-0 leading-tight ${textColor} truncate`}>{name}</p>
          <p className={`text-xs m-0 p-0 leading-tight ${textColor}`}>{score} pts</p>
        </div>

        {/* Bottom SVG (decorative) */}
        <div className="absolute bottom-5 z-20 w-full h-auto px-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 169 51" fill="none">
            <path d="M-3.90869 4.46594L1.0779 10.3198C2.15197 11.5806 3.48557 12.5948 4.98758 13.2929L79.6561 47.998C82.6759 49.4016 86.1558 49.4281 89.1967 48.0707L163.79 14.7749C166.221 13.6896 168.201 11.7947 169.392 9.41315L173.304 1.58911" stroke="#F1ECE6" strokeWidth="2.87682" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};


export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({ topThree, type }) => {
  console.log(`[LeaderboardPodium] Received topThree array, length: ${topThree.length}, type: ${type}`);
  console.log(`[LeaderboardPodium] TopThree data:`, topThree);
  
  // Ensure we have exactly 3 entries, adding placeholders if needed
  const podiumEntries = [...topThree, null, null, null].slice(0, 3);

  const podiumConfig = [
    { rank: 2, color: "#AFADAD", shadow: "#5E5F5F", text: "text-neutral-900", size: "w-[150px]", top: "top-6", numTop: "top-6 left-6" },
    { rank: 1, color: "#FFC200", shadow: "#A65E15", text: "text-yellow-800", size: "w-[168px]", top: "top-8", numTop: "top-8 left-8" },
    { rank: 3, color: "#C18F5D", shadow: "#724212", text: "text-amber-900", size: "w-[150px]", top: "top-6", numTop: "top-6 left-6" },
  ];

  return (
    <div className="flex flex-row justify-center items-end gap-4 md:gap-8 pb-4">
      {podiumConfig.map((config) => {
        const entry = podiumEntries[config.rank - 1];
        console.log(`[LeaderboardPodium] Rendering config for rank ${config.rank}, has entry:`, !!entry);
        
        return entry ? (
          <PodiumItem
            key={`podium-${config.rank}-${type}`}
            entry={entry}
            rank={config.rank}
            type={type}
            color={config.color}
            shadowColor={config.shadow}
            textColor={config.text}
            sizeClass={config.size}
            topClass={config.top}
            numTopClass={config.numTop}
          />
        ) : (
          // Render placeholder if fewer than 3 players
          <div key={`placeholder-${config.rank}`} className={`col-span-1 ${config.size}`}>
             <div className="h-[236px] flex items-center justify-center text-gray-400">
               ({config.rank}{config.rank === 1 ? 'st' : config.rank === 2 ? 'nd' : 'rd'})
             </div>
          </div>
        );
      })}
    </div>
  );
};