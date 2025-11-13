// import type { UserProfile, Department } from "../types/user";
// // import type { DailyPuzzleResponse } from "../types/game";
// import type {
//   IndividualScoreEntry,
//   DepartmentScoreEntry,
// } from "../types/leaderboard"; // Updated type name
// import type { ActivityHubResponse, OnlineUser } from "../types/activity";
// // import type { Submission } from "../types/game";
// import type { Challenge } from "../types/challenge";
// import type { RewardItem, ClaimedReward } from "../types";

// import stickerImage from "../assets/images/stickers.jpg"; // Adjust path/filename
// import mugImage from "../assets/images/mug.jpg";
// import pinImage from "../assets/images/pin.png";
// import ballerImage from "../assets/images/baller.jpg";

// // Mock Departments
// export const MOCK_DEPARTMENTS: Department[] = [
//   { id: 1, name: "Backend & Cloud" },
//   { id: 2, name: "Data & AI" },
//   { id: 3, name: "Web Dev 1" },
//   { id: 4, name: "Web Dev 2" },
//   { id: 5, name: "Sales" },
//   { id: 6, name: "HR & Admin" },
// ];

// // Mock user 1 with a department
// export const MOCK_USER_MAIN: UserProfile = {
//   id: 1,
//   username: "forondayna",
//   email: "forondayna1214@gmail.com",
//   department: MOCK_DEPARTMENTS[1],
//   profile_complete: true,
//   total_points_alltime: 1250,
//   current_points: 1250,
//   current_streak_count: 3,
//   max_streak_count: 5,
//   challenges_made_count: 10,
//   profile_picture_url: null,
// };

// // Mock user 2 with no department yet
// export const MOCK_USER_NEW: UserProfile = {
//   id: 2,
//   username: "new_user",
//   email: "new.user@erni.com",
//   department: null,
//   profile_complete: false,
//   total_points_alltime: 0,
//   current_points: 0,
//   current_streak_count: 0,
//   max_streak_count: 0,
//   challenges_made_count: 0,
//   profile_picture_url: null,
// };

// // export const MOCK_PUZZLES: DailyPuzzleResponse = {
// //   date: '2025-10-20',
// //   wordle: {
// //     id: 101,
// //     solution_word: 'REACT', // The solution for our test
// //   },
// //   sudoku: {
// //     id: 201,
// //     puzzle_string: '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
// //     solution_string: '483921657967345821251876493548132976729564138136798245372689514814253769695417382',
// //     difficulty: 'EASY',
// //   },
// //   ernigram: {
// //     id: 301,
// //     solution_phrase: 'CONTINUOUS LEARNING',
// //     clue: 'A core company value',
// //   },
// // };

// // export const MOCK_ONLINE_USERS: OnlineUser[] = [
// //   { id: 1, username: "gavin_cii" }, // Example user
// //   { id: 3, username: "jerome_B" }, // Example user
// //   { id: 5, username: "alex_m" }, // Example user
// // ];

// export const MOCK_ACTIVITY_HUB: ActivityHubResponse = {
//   recent_activity: [
//     {
//       id: 105,
//       user: { id: 2, username: "Dayniel Caadiang" },
//       puzzle_name: "Sudoku",
//       difficulty: "easy",
//       time_in_minutes: "4:98",
//       created_at: new Date(Date.now() - 60000 * 2).toISOString(), // 2 mins ago
//     },
//     {
//       id: 104,
//       user: { id: 1, username: "gavin_cii" },
//       puzzle_name: "Wordle",
//       difficulty: "hard",
//       time_in_minutes: "1:32",
//       created_at: new Date(Date.now() - 60000 * 5).toISOString(), // 5 mins ago
//     },
//     {
//       id: 103,
//       user: { id: 3, username: "jerome_B" },
//       puzzle_name: "ERNIgram",
//       difficulty: "easy",
//       time_in_minutes: "2:15",
//       created_at: new Date(Date.now() - 60000 * 10).toISOString(), // 10 mins ago
//     },
//     // ... add more as needed
//   ],
//   online_users: [
//     { id: 1, username: "gavin_cii" },
//     { id: 3, username: "jerome_B" },
//     { id: 2, username: "Dayniel Caadiang" },
//   ],
// };

// // export const MOCK_TODAY_SUBMISSIONS: Submission[] = [
// //   // Example: User 1 submitted Wordle
// //   {
// //     id: 501,
// //     user_id: 1, // Matches MOCK_USER_MAIN
// //     puzzle_type: 'wordle',
// //     puzzle_id: 101, // Matches MOCK_PUZZLES.wordle.id
// //     points_awarded: 500,
// //     time_taken_ms: 65000,
// //     tries: 2,
// //     created_at: new Date().toISOString(), // Simulates submission today
// //   },
// // Add more submissions as needed for testing
// // {
// //   id: 502,
// //   user_id: 1,
// //   puzzle_type: 'sudoku',
// //   puzzle_id: 201,
// //   points_awarded: 850,
// //   time_taken_ms: 300000,
// //   tries: 1,
// //   created_at: new Date().toISOString(),
// // },
// // ];

// export const MOCK_USERS_SEARCH: Pick<
//   UserProfile,
//   "id" | "username" | "email"
// >[] = [
//   { id: 1, username: "gavin_cii", email: "gavin@erni.com" },
//   { id: 2, username: "Dayniel Caadiang", email: "dayniel@erni.com" },
//   { id: 3, username: "sarah_b", email: "sarah@erni.com" },
//   { id: 4, username: "mike_t", email: "mike@erni.com" },
// ];

// export const MOCK_PENDING_CHALLENGES: Challenge[] = [
//   {
//     id: 1,
//     challenger: { id: 1, username: "gavin_cii" },
//     recipient: { id: 2, username: "Dayniel Caadiang" }, // Assuming current user is Dayniel
//     puzzle_type: "wordle",
//     puzzle_id: 101, // Matches MOCK_PUZZLES.wordle.id
//     challenger_submission: {
//       id: 501,
//       points_awarded: 500,
//       time_taken_ms: 65000,
//       tries: 2,
//     },
//     recipient_submission: null,
//     status: "PENDING",
//     winner: null,
//     created_at: new Date(Date.now() - 60000 * 30).toISOString(), // 30 mins ago
//   },
//   {
//     id: 2,
//     challenger: { id: 3, username: "sarah_b" },
//     recipient: { id: 2, username: "Dayniel Caadiang" },
//     puzzle_type: "sudoku",
//     puzzle_id: 201, // Matches MOCK_PUZZLES.sudoku.id
//     challenger_submission: {
//       id: 503,
//       points_awarded: 750,
//       time_taken_ms: 250000,
//       tries: 1,
//     },
//     recipient_submission: null,
//     status: "PENDING",
//     winner: null,
//     created_at: new Date(Date.now() - 60000 * 60 * 2).toISOString(), // 2 hours ago
//   },
// ];

// export const MOCK_COMPLETED_CHALLENGES: Challenge[] = [
//   {
//     id: 3,
//     challenger: { id: 2, username: "Dayniel Caadiang" },
//     recipient: { id: 1, username: "gavin_cii" },
//     puzzle_type: "ernigram",
//     puzzle_id: 301,
//     challenger_submission: {
//       id: 504,
//       points_awarded: 400,
//       time_taken_ms: 90000,
//       tries: 3,
//     },
//     recipient_submission: {
//       id: 505,
//       points_awarded: 450,
//       time_taken_ms: 80000,
//       tries: 2,
//     },
//     status: "COMPLETED",
//     winner: { id: 1, username: "gavin_cii" }, // Gavin won
//     created_at: new Date(Date.now() - 60000 * 60 * 24).toISOString(), // 1 day ago
//   },
// ];

// export const MOCK_USER_SARAH: Pick<UserProfile, "id" | "username" | "email"> = {
//   id: 3,
//   username: "sarah_b",
//   email: "sarah@erni.com",
// };
// export const MOCK_USER_MIKE: Pick<UserProfile, "id" | "username" | "email"> = {
//   id: 4,
//   username: "mike_t",
//   email: "mike@erni.com",
// };
// export const MOCK_USER_DAYNIEL: Pick<UserProfile, "id" | "username" | "email"> =
//   { id: 5, username: "Dayniel Caadiang", email: "dayniel@erni.com" }; // Corrected ID from previous example

// export const MOCK_LEADERBOARD_INDIVIDUAL_WEEKLY: IndividualScoreEntry[] = [
//   {
//     user: { id: MOCK_USER_MAIN.id, username: MOCK_USER_MAIN.username },
//     score: 1250,
//     week_start_date: "2025-10-19",
//   },
//   {
//     user: { id: MOCK_USER_SARAH.id, username: MOCK_USER_SARAH.username },
//     score: 1100,
//     week_start_date: "2025-10-19",
//   },
//   {
//     user: { id: MOCK_USER_MIKE.id, username: MOCK_USER_MIKE.username },
//     score: 980,
//     week_start_date: "2025-10-19",
//   },
//   {
//     user: { id: MOCK_USER_DAYNIEL.id, username: MOCK_USER_DAYNIEL.username },
//     score: 950,
//     week_start_date: "2025-10-19",
//   },
// ];

// export const MOCK_LEADERBOARD_DEPARTMENT_WEEKLY: DepartmentScoreEntry[] = [
//   {
//     department: { id: MOCK_DEPARTMENTS[0].id, name: MOCK_DEPARTMENTS[0].name },
//     score: 2230,
//     week_start_date: "2025-10-19",
//   },
//   {
//     department: { id: MOCK_DEPARTMENTS[1].id, name: MOCK_DEPARTMENTS[1].name },
//     score: 1500,
//     week_start_date: "2025-10-19",
//   },
//   {
//     department: { id: MOCK_DEPARTMENTS[3].id, name: MOCK_DEPARTMENTS[3].name },
//     score: 1100,
//     week_start_date: "2025-10-19",
//   },
//   {
//     department: { id: MOCK_DEPARTMENTS[2].id, name: MOCK_DEPARTMENTS[2].name },
//     score: 900,
//     week_start_date: "2025-10-19",
//   },
// ];

// export const MOCK_REWARDS: RewardItem[] = [
//   {
//     id: "reward-001",
//     name: "Company Sticker Pack",
//     description: "Show your ERNI pride with these cool stickers.",
//     cost: 250,
//     image: stickerImage,
//     max_claims_per_user: 5, // User can claim this 5 times
//   },
//   {
//     id: "reward-002",
//     name: "ERNI Coffee Mug",
//     description: "Enjoy your morning brew in style.",
//     cost: 1000,
//     image: mugImage,
//     max_claims_per_user: 1, // User can only claim this ONCE
//   },
//   {
//     id: "reward-003",
//     name: '"Puzzle Master" Title (Internal)',
//     description: "Get recognized internally as a puzzle whiz for a week!",
//     cost: 5000,
//     image: ballerImage,
//     max_claims_per_user: null, // No limit (infinite claims)
//   },
//   {
//     id: "reward-004",
//     name: "Extra Hint Coupon",
//     description: "Redeem for one free hint on any puzzle.",
//     cost: 150,
//     image: pinImage,
//     max_claims_per_user: 10, // Can claim 10 coupons
//   },
// ];

// // --- ADD MOCK CLAIMED REWARDS ---
// // Simulate that the user has already claimed some items
// export const MOCK_CLAIMED_REWARDS: ClaimedReward[] = [
//   // User has already claimed the mug once
//   {
//     id: 901,
//     user: { id: 1, username: "gavin_cii" }, // Assuming user 1 is logged in
//     reward: MOCK_REWARDS[1], // The ERNI Coffee Mug
//     claimed_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
//     points_spent: 1000,
//     status: "FULFILLED",
//   },
//   // User has claimed stickers twice
//   {
//     id: 902,
//     user: { id: 1, username: "gavin_cii" },
//     reward: MOCK_REWARDS[0], // Sticker Pack
//     claimed_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
//     points_spent: 250,
//     status: "CLAIMED",
//   },
//   {
//     id: 903,
//     user: { id: 1, username: "gavin_cii" },
//     reward: MOCK_REWARDS[0], // Sticker Pack
//     claimed_at: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
//     points_spent: 250,
//     status: "CLAIMED",
//   },
// ];
// // ---
