// interface Team { id: number; name: string; }, interface UserProfile { id: number; username: string; email: string; team: Team | null; profile_complete: boolean; total_points_alltime: number; streak_count: number; }.

//Department object
export interface Department {
  id: number;
  name: string;
}

// User Profile object
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  department: Department | null;
  profile_complete: boolean;
  total_points_alltime: number;
  current_points: number;
  current_streak_count: number; // Renamed from streak_count
  max_streak_count: number; // New
  challenges_made_count: number; // New
  profile_picture_url: string | null;
  email_notifications: boolean; // New
}
