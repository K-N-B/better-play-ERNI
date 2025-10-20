// The modal for new users. It's triggered by the Layout component. It fetches authService.getTeams() to populate a dropdown. The "Save" button calls authService.completeProfile() and then closes.

import { useState, useEffect } from 'react';
import { completeProfile, getDepartments } from '../../api/authService';
import { useAuth } from '../../hooks/authContext';
import type { Department } from '../../types/user';
import { LoadingSpinner } from './loadingSpinner';

export const FirstTimeSetupModal = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { refreshProfile } = useAuth(); // Get the refresh function

  useEffect(() => {
    // Fetch teams on mount
    getDepartments().then(data => {
      setDepartments(data);
      setIsLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTeam) return;

      setIsLoading(true);
      // This is the change: pass the teamId to refreshProfile
      await refreshProfile(Number(selectedTeam)); 
      // The modal will close automatically when the profile is complete
  };

  return (
    // Full-screen modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-75">
      <div className="bg-white p-8 rounded-3xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Welcome to ERNI Puzzles!</h2>
        <p className="mb-6 text-gray-600">
          To get started, please select your team. This is required for the team leaderboards.
        </p>
        
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
                Your Team
              </label>
              <select
                id="team"
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="" disabled>Select your team...</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!selectedTeam || isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Save and Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
};