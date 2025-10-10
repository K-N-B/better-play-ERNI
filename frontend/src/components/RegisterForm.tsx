import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useEmailValidation } from '../hooks/useEmailValidation';
import type { RegisterData } from '../types/auth';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const { validateEmail, isValidating, validationError, clearValidation } = useEmailValidation();
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    username: '',
    password: '',
    password2: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailValidated, setEmailValidated] = useState(false);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Real-time email validation with debounce
  useEffect(() => {
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    if (formData.email && formData.email.includes('@')) {
      const timeout = setTimeout(async () => {
        const isValid = await validateEmail(formData.email);
        setEmailValidated(isValid);
      }, 800); // Wait 800ms after user stops typing

      setEmailCheckTimeout(timeout);
    } else {
      setEmailValidated(false);
      clearValidation();
    }

    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
    };
  }, [formData.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (name === 'email') {
      setEmailValidated(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.username) newErrors.username = 'Username is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailValidated) {
      newErrors.email = validationError || 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (error: any) {
      const errorData = error.response?.data;
      const newErrors: Record<string, string> = {};

      if (errorData) {
        Object.keys(errorData).forEach((key) => {
          newErrors[key] = Array.isArray(errorData[key]) 
            ? errorData[key][0] 
            : errorData[key];
        });
      } else {
        newErrors.general = 'Registration failed. Please try again.';
      }

      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  const EmailValidationIcon = () => {
    if (!formData.email || !formData.email.includes('@')) return null;
    
    if (isValidating) {
      return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    
    if (emailValidated) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    if (validationError) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    
    return null;
  };

  return (
    <div className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.firstName && (
            <div className="flex items-center mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.firstName}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.lastName && (
            <div className="flex items-center mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.lastName}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="johndoe"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.username && (
          <div className="flex items-center mt-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.username}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.name@betterask.erni"
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.email || validationError ? 'border-red-500' : 
              emailValidated ? 'border-green-500' : 'border-gray-300'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <EmailValidationIcon />
          </div>
        </div>
        {(errors.email || validationError) && (
          <div className="flex items-center mt-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.email || validationError}
          </div>
        )}
        {emailValidated && !errors.email && (
          <div className="flex items-center mt-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Email verified successfully
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <div className="flex items-center mt-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.password}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          name="password2"
          value={formData.password2}
          onChange={handleChange}
          placeholder="Confirm your password"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            errors.password2 ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.password2 && (
          <div className="flex items-center mt-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.password2}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !emailValidated || isValidating}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </div>
  );
};