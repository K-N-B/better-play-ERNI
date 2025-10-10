import { useState, useCallback } from 'react';
import { authAPI } from '../services/api';

export const useEmailValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateEmail = useCallback(async (email: string): Promise<boolean> => {
    if (!email) {
      setValidationError(null);
      return false;
    }

    // Basic format check first
    if (!email.endsWith('@betterask.erni')) {
      setValidationError('Only @betterask.erni email addresses are allowed');
      return false;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await authAPI.validateEmail(email);
      
      if (!result.valid) {
        setValidationError(result.error || 'Invalid email address');
        return false;
      }

      setValidationError(null);
      return true;
    } catch (error) {
      setValidationError('Unable to validate email. Please try again.');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationError(null);
    setIsValidating(false);
  }, []);

  return {
    validateEmail,
    isValidating,
    validationError,
    clearValidation,
  };
};