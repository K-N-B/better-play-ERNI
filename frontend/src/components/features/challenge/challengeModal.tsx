import React, { useState, useEffect, useCallback } from 'react';
import { searchUsers, sendChallenge } from '../../../api/challengeService';
import type { UserProfile, CreateChallengeData } from '../../../types';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import { X, Send, Search, UserCheck } from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number;
}

function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({ isOpen, onClose, submissionId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Pick<UserProfile, 'id' | 'username' | 'email'>[]>([]);
  const [selectedUser, setSelectedUser] = useState<Pick<UserProfile, 'id' | 'username' | 'email'> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim() || term.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      setError('');
      try {
        const results = await searchUsers(term);
        setSearchResults(results);
      } catch (err) {
        setError('Failed to search users.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    setSelectedUser(null);
    setSuccessMessage('');
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

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
      setSearchResults([]);
      
      // Close modal after a short delay
      setTimeout(onClose, 2500);
    } catch (err) {
      console.error('[ChallengeModal] Error sending challenge:', err);
      
      // ✅ Better error handling - check error type
      if (err instanceof Error) {
        // Extract the actual error message
        const errorMessage = err.message;
        
        // Check if it's a validation error with details
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
      setSearchResults([]);
      setSelectedUser(null);
      setIsSearching(false);
      setIsSending(false);
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md relative mx-4" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Challenge a Colleague</h2>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email (min 2 chars)..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary pl-10"
            disabled={isSending || !!successMessage}
          />
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner />
            </div>
          )}
        </div>

        <div className="mb-4 min-h-[6rem]">
          {!isSearching && !selectedUser && searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto border rounded-md bg-gray-50">
              <ul className="divide-y divide-gray-200">
                {searchResults.map(user => (
                  <li key={user.id}>
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex justify-between items-center transition-colors"
                      disabled={isSending || !!successMessage}
                    >
                      <div>
                        <span className="font-medium">{user.username}</span>
                        <span className="text-xs text-gray-500 block">{user.email}</span>
                      </div>
                      <span className="text-xs text-primary font-medium">Select</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {!isSearching && !selectedUser && searchTerm.length >= 2 && searchResults.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No users found matching "{searchTerm}".</p>
          )}

          {selectedUser && !successMessage && (
            <div className="bg-blue-50 p-3 rounded-md flex justify-between items-center border border-blue-100">
              <div>
                <p className="text-sm font-medium text-blue-800 flex items-center gap-1">
                  <UserCheck size={16} />
                  Challenging: {selectedUser.username}
                </p>
                <p className="text-xs text-blue-600 ml-5">{selectedUser.email}</p>
              </div>
              <button
                onClick={handleSendChallenge}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-1"
                disabled={isSending}
              >
                {isSending ? <LoadingSpinner /> : <Send size={16} />}
                <span>{isSending ? 'Sending...' : 'Send Challenge'}</span>
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 mt-2 text-center font-medium">{successMessage}</p>}
      </div>
    </div>
  );
};