// src/components/features/challenge/challengeModal.tsx - WITH AUTO-DISPLAYED USERS
import React, { useState, useEffect } from 'react';
import { listAllUsers, sendChallenge } from '../../../api/challengeService';
import { checkUserSubmissionExists } from '../../../api/gameService';
import type { UserProfile, CreateChallengeData } from '../../../types';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import { X, Send, Search, UserCheck, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number;
  puzzleType: string;
  puzzleId: number;
  dailyPuzzleDate: string;
}

interface ColleagueWithStatus extends Pick<UserProfile, 'id' | 'username' | 'email'> {
  hasCompleted: boolean;
  isChecking: boolean;
}

interface ColleagueWithStatus extends Pick<UserProfile, 'id' | 'username' | 'email'> {
  hasCompleted: boolean;
  isChecking: boolean;
}

// function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
//   let timeoutId: ReturnType<typeof setTimeout> | null = null;
//   return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
//     timeoutId = setTimeout(() => {
//       func.apply(this, args);
//     }, wait);
//   };
// }

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  submissionId,
  puzzleType,
  puzzleId,
  dailyPuzzleDate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<ColleagueWithStatus[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ColleagueWithStatus[]>([]);
  const [selectedUser, setSelectedUser] = useState<ColleagueWithStatus | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchAllUsers = async () => {
      console.log('[ChallengeModal] Fetching all users...');
      setIsLoadingUsers(true);
      setError('');

      try {
        // Use a wildcard search to get all users (adjust based on your backend)
        // You might want to create a dedicated endpoint for this
        const users = await listAllUsers(); // Gets users with 'a' in name/email

        console.log('[ChallengeModal] Found users:', users.length);

        // Initialize with loading status
        const usersWithStatus: ColleagueWithStatus[] = users.map(user => ({
          ...user,
          hasCompleted: false,
          isChecking: true,
        }));

        setAllUsers(usersWithStatus);
        setFilteredUsers(usersWithStatus);

        // Check completion status for each user
        console.log('[ChallengeModal] Checking completion status...');

        const statusChecks = users.map(async (user, index) => {
          try {
            const result = await checkUserSubmissionExists(
              user.id,
              puzzleType,
              dailyPuzzleDate,
              puzzleId
            );

            return {
              index,
              hasCompleted: result.hasSubmitted,
            };
          } catch (err) {
            console.error(`[ChallengeModal] Error checking user ${user.username}:`, err);
            return {
              index,
              hasCompleted: false,
            };
          }
        });

        const results = await Promise.all(statusChecks);

        // Update users with completion status
        setAllUsers(prev => {
          const updated = [...prev];
          results.forEach(({ index, hasCompleted }) => {
            if (updated[index]) {
              updated[index] = {
                ...updated[index],
                hasCompleted,
                isChecking: false,
              };
            }
          });
          return updated;
        });

        setFilteredUsers(prev => {
          const updated = [...prev];
          results.forEach(({ index, hasCompleted }) => {
            if (updated[index]) {
              updated[index] = {
                ...updated[index],
                hasCompleted,
                isChecking: false,
              };
            }
          });
          return updated;
        });

      } catch (err) {
        console.error('[ChallengeModal] Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        setAllUsers([]);
        setFilteredUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchAllUsers();
  }, [isOpen, puzzleType, puzzleId, dailyPuzzleDate]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(allUsers);
      return;
    }

    const lowerSearch = searchTerm.toLowerCase();
    const filtered = allUsers.filter(user =>
      user.username.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch)
    );

    setFilteredUsers(filtered);
  }, [searchTerm, allUsers]);

  const handleSendChallenge = async () => {
    if (!selectedUser || !submissionId) return;

    setIsSending(true);
    setError('');
    setSuccessMessage('');

    try {
      const challengeData: CreateChallengeData = {
        recipient_id: selectedUser.id,
        submission_id: submissionId
      };

      console.log('[ChallengeModal] Sending challenge:', challengeData);

      const result = await sendChallenge(challengeData);

      console.log('[ChallengeModal] Challenge sent successfully:', result);

      setSuccessMessage(`Challenge sent to ${selectedUser.username}!`);
      setSelectedUser(null);
      setSearchTerm('');

      setTimeout(onClose, 2500);
    } catch (err) {
      console.error('[ChallengeModal] Error sending challenge:', err);

      if (err instanceof Error) {
        const errorMessage = err.message;

        if (errorMessage.includes('Validation failed')) {
          setError('Unable to send challenge. Please check your selection and try again.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Failed to send challenge. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setAllUsers([]);
      setFilteredUsers([]);
      setSelectedUser(null);
      setIsLoadingUsers(false);
      setIsSending(false);
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md relative mx-4" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">Challenge a Colleague</h2>

        {/* Search Input */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary pl-10"
            disabled={isSending || !!successMessage || isLoadingUsers}
          />
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          {isLoadingUsers && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner />
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="mb-4 min-h-48">
          {isLoadingUsers ? (
            <div className="text-center py-8 text-gray-500">
              <LoadingSpinner />
              <p className="text-sm mt-2">Loading users...</p>
            </div>
          ) : !selectedUser && filteredUsers.length > 0 ? (
            <div className="max-h-64 overflow-y-auto border rounded-md bg-gray-50">
              <ul className="divide-y divide-gray-200">
                {filteredUsers.map(user => {
                  const isDisabled = user.hasCompleted || user.isChecking;

                  return (
                    <li key={user.id}>
                      <button
                        onClick={() => !isDisabled && setSelectedUser(user)}
                        disabled={isDisabled || isSending || !!successMessage}
                        className={`w-full text-left px-3 py-3 flex justify-between items-center transition-colors ${isDisabled
                            ? 'opacity-50 cursor-not-allowed bg-gray-100'
                            : 'hover:bg-gray-100 cursor-pointer'
                          }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{user.username}</span>
                            {user.isChecking && (
                              <span className="text-xs text-gray-400">(checking...)</span>
                            )}
                            {user.hasCompleted && !user.isChecking && (
                              <CheckCircle size={16} className="text-green-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 block truncate">{user.email}</span>
                        </div>

                        <div className="ml-2 shrink-0">
                          {user.isChecking ? (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock size={14} />
                              <span>Checking...</span>
                            </div>
                          ) : user.hasCompleted ? (
                            <span className="text-xs text-gray-500 font-medium">Completed</span>
                          ) : (
                            <span className="text-xs text-primary font-medium">Challenge</span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : !selectedUser && searchTerm && filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No colleagues found matching "{searchTerm}".</p>
            </div>
          ) : !selectedUser && !searchTerm && filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Search size={48} className="mx-auto mb-2" />
              <p className="text-sm">No users available to challenge</p>
            </div>
          ) : null}

          {/* Selected User Display */}
          {selectedUser && !successMessage && (
            <div className="bg-blue-50 p-3 rounded-md flex justify-between items-center border border-blue-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-800 flex items-center gap-1">
                  <UserCheck size={16} className="shrink-0" />
                  <span className="truncate">Challenging: {selectedUser.username}</span>
                </p>
                <p className="text-xs text-blue-600 ml-5 truncate">{selectedUser.email}</p>
              </div>
              <button
                onClick={handleSendChallenge}
                className="ml-2 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-1 shrink-0"
                disabled={isSending}
              >
                {isSending ? <LoadingSpinner /> : <Send size={16} />}
                <span>{isSending ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600 text-center">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-600 text-center font-medium">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};