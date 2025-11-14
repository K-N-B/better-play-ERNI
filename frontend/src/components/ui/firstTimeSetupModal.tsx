// The modal for new users. It's triggered by the Layout component. It fetches authService.getTeams() to populate a dropdown. The "Save" button calls authService.completeProfile() and then closes.

import { useState, useEffect } from "react";
import { completeProfile, getDepartments } from "../../api/authService";
import { useAuth } from "../../hooks/authContext";
import type { Department } from "../../types/user";
import { LoadingSpinner } from "./loadingSpinner";

export const FirstTimeSetupModal = () => {
  const [departments, setDepartments] = useState<Department[]>([]); // Use Department type
  const [selectedDepartment, setSelectedDepartment] = useState<string>(''); // Store ID as string
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state
  // --- Use the renamed function from context ---
  const { submitProfileCompletion } = useAuth();

  useEffect(() => {
    setIsLoading(true);
    getDepartments() // Use getDepartments if renamed
      .then(data => {
        setDepartments(data);
      })
      .catch(err => console.error("Failed to fetch departments", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;

    setIsSubmitting(true);
    // Call the function from context
    await submitProfileCompletion(Number(selectedDepartment));
    // No need to call refreshProfile here, submitProfileCompletion updates context
    setIsSubmitting(false);
    // Modal will close automatically when AuthContext re-renders Layout
  };

  return (
    // Full-screen modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Welcome to ERNI Puzzles!</h2>
        <p className="mb-6 text-gray-600">
          To get started, please select your department. This is required for the leaderboards.
        </p>

        {isLoading ? (
          <div className="text-center"><LoadingSpinner /></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Your Department
              </label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting} // Disable while submitting
              >
                <option value="" disabled>Select your department...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!selectedDepartment || isLoading || isSubmitting} // Disable conditions
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex justify-center items-center"
            >
              {isSubmitting ? <LoadingSpinner /> : 'Save and Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
