// import { useState, useEffect } from "react";
// import {
//   puzzle,
//   sudoku,
//   wordle,
//   ernigram,
//   crossword,
//   connections,
// } from "../assets/icons/icons";
// import GameButton from "../components/GameButton";

// interface LeaderboardEntry {
//   rank: number;
//   username: string;
//   display_name: string;
//   total_points: number;
//   is_current_user: boolean;
// }

// interface DashboardData {
//   user: {
//     username: string;
//     display_name: string;
//     total_points: number;
//   };
//   today: {
//     puzzles_completed: number;
//     total_score: number;
//     is_complete: boolean;
//     puzzles: Array<{
//       game_type: string;
//       difficulty: string;
//       completed: boolean;
//       score: number;
//       puzzle_id: number;
//     }>;
//   };
//   streak: {
//     current: number;
//     longest: number;
//     last_completion: string;
//   };
// }

// const games = [
//   {
//     title: "Games",
//     subtitle: "Choose your poison for today or experience all of them!",
//     color: "bg-slate-50 text-black shadow-slate-50",
//     icon: puzzle,
//     path: "/",
//   },
//   {
//     title: "Sudoku",
//     subtitle: "Sharpen your logic — fill the grid without repeating numbers.",
//     color: "bg-pink-400 text-slate-50 shadow-[0_5px_0_0] shadow-pink-800",
//     icon: sudoku,
//     path: "/sudoku",
//   },
//   {
//     title: "Wordle",
//     subtitle: "Guess the hidden word in six tries or less.",
//     color: "bg-emerald-500 text-slate-50 shadow-emerald-900",
//     icon: wordle,
//     path: "/wordle",
//   },
//   {
//     title: "ERNIgram",
//     subtitle: "Save the stickman — reveal the word before time runs out.",
//     color: "bg-sky-500 text-slate-50 shadow-[0_5px_0_0] shadow-sky-800",
//     icon: ernigram,
//     path: "/ernigram",
//   },
//   {
//     title: "Crossword",
//     subtitle: "Test your vocabulary and wit by solving the daily word clues.",
//     color: "bg-amber-500 text-slate-50 shadow-amber-800",
//     icon: crossword,
//     path: "/crossword",
//   },
//   {
//     title: "Connections",
//     subtitle: "Group words into four hidden categories and find the link.",
//     color: "bg-purple-500 text-slate-50 shadow-purple-900",
//     icon: connections,
//     path: "/connections",
//   },
// ];

// export default function Home() {
//   const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
//   const [dashboard, setDashboard] = useState<DashboardData | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       // Fetch all-time leaderboard for sidebar
//       const leaderboardResponse = await fetch('http://localhost:8000/api/leaderboards/all_time/', {
//         credentials: 'include'
//       });
//       const leaderboardData = await leaderboardResponse.json();
//       setLeaderboard(leaderboardData.leaderboard?.slice(0, 10) || []);

//       // Fetch user dashboard data
//       const dashboardResponse = await fetch('http://localhost:8000/api/user/dashboard/', {
//         credentials: 'include'
//       });
//       const dashboardData = await dashboardResponse.json();
//       setDashboard(dashboardData);

//     } catch (error) {
//       console.error('Failed to fetch data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex h-full gap-8">
//       {/* Left leaderboard column */}
//       <aside className="w-1/4 h-full bg-slate-50 rounded-2xl p-6 shadow-md sticky self-start">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-xl font-bold">Leaderboards</h2>
//           <button className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
//             All-time
//           </button>
//         </div>

//         {loading ? (
//           <div className="animate-pulse space-y-3">
//             {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
//               <div key={n} className="h-8 bg-slate-200 rounded"></div>
//             ))}
//           </div>
//         ) : leaderboard.length > 0 ? (
//           <ol className="space-y-3">
//             {leaderboard.map((player) => (
//               <li
//                 key={player.rank}
//                 className={`flex items-center justify-between ${
//                   player.is_current_user ? 'bg-blue-50 p-2 rounded' : ''
//                 }`}
//               >
//                 <div className="flex items-center gap-3">
//                   <div className={`w-6 text-base font-semibold ${
//                     player.rank === 1 ? 'text-yellow-500' :
//                     player.rank === 2 ? 'text-gray-500' :
//                     player.rank === 3 ? 'text-amber-700' :
//                     'text-sky-600'
//                   }`}>
//                     {player.rank}
//                   </div>
//                   <div className="text-base truncate">
//                     {player.display_name}
//                     {player.is_current_user && (
//                       <span className="ml-1 text-xs text-blue-600">(You)</span>
//                     )}
//                   </div>
//                 </div>
//                 <div className="text-base text-slate-500">
//                   {player.total_points} pts
//                 </div>
//               </li>
//             ))}
//           </ol>
//         ) : (
//           <div className="text-center text-gray-400 py-10">
//             No leaderboard data yet
//           </div>
//         )}

//         {/* User Stats Section */}
//         {dashboard && (
//           <div className="mt-6 pt-6 border-t border-slate-200">
//             <h3 className="text-lg font-bold mb-3">Your Progress</h3>
//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-slate-600">Today's Puzzles:</span>
//                 <span className="font-semibold">
//                   {dashboard.today.puzzles_completed}/3
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-600">Today's Score:</span>
//                 <span className="font-semibold">
//                   {dashboard.today.total_score} pts
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-600">Current Streak:</span>
//                 <span className="font-semibold text-orange-600">
//                   🔥 {dashboard.streak.current} days
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-600">Longest Streak:</span>
//                 <span className="font-semibold">
//                   {dashboard.streak.longest} days
//                 </span>
//               </div>
//             </div>

//             {/* Daily Progress Bar */}
//             <div className="mt-4">
//               <div className="flex justify-between text-xs mb-1">
//                 <span className="text-slate-600">Daily Progress</span>
//                 <span className="text-slate-600">
//                   {Math.round((dashboard.today.puzzles_completed / 3) * 100)}%
//                 </span>
//               </div>
//               <div className="w-full bg-slate-200 rounded-full h-2">
//                 <div
//                   className={`h-2 rounded-full transition-all ${
//                     dashboard.today.is_complete
//                       ? 'bg-green-500'
//                       : 'bg-blue-500'
//                   }`}
//                   style={{
//                     width: `${(dashboard.today.puzzles_completed / 3) * 100}%`
//                   }}
//                 ></div>
//               </div>
//               {dashboard.today.is_complete && (
//                 <div className="mt-2 text-center text-xs text-green-600 font-semibold">
//                   ✓ All puzzles completed! +20 bonus pts
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </aside>

//       {/* Center content: cards grid */}
//       <section className="flex-1 h-full">
//         <div className="bg-slate-50 rounded-3xl p-6 shadow-md h-full">
//           {/* Welcome Message */}
//           {dashboard && (
//             <div className="mb-6">
//               <h1 className="text-3xl font-bold text-gray-900">
//                 Welcome back, {dashboard.user.display_name}! 👋
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 You have {3 - dashboard.today.puzzles_completed} puzzle{3 - dashboard.today.puzzles_completed !== 1 ? 's' : ''} left today.
//                 {dashboard.today.puzzles_completed === 0 && ' Start your daily challenge!'}
//                 {dashboard.today.puzzles_completed > 0 && dashboard.today.puzzles_completed < 3 && ' Keep going!'}
//                 {dashboard.today.is_complete && ' Amazing work! 🎉'}
//               </p>
//             </div>
//           )}

//           <div className="grid h-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
//             {games.map((g) => {
//               // Check if this game is completed today
//               const gameCompleted = dashboard?.today.puzzles.some(
//                 p => p.game_type.toLowerCase() === g.title.toLowerCase() && p.completed
//               );

//               return (
//                 <div key={g.title} className="relative">
//                   <GameButton
//                     title={g.title}
//                     subtitle={g.subtitle}
//                     color={g.color}
//                     icon={g.icon}
//                     path={g.path}
//                   />
//                   {gameCompleted && (
//                     <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
//                       ✓ Done
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }
// The main dashboard. It renders GameSuite and CommunityHub.

import { useAuth } from "../hooks/authContext";
import { GameSuite } from "../components/features/gameSuite";
import { CommunityHub } from "../components/features/communityHub";

export const HomePage = () => {
  const { user } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome, {user?.username}!</h1>
      <p>Your team: {user?.department?.name || "Not set"}</p>

      <GameSuite />

      <div className="mt-8">
        {" "}
        {/* Add some margin */}
        <CommunityHub /> {/* <-- ADD THE HUB */}
      </div>
    </div>
  );
};
