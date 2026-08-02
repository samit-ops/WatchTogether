import React, { useState } from 'react';
import { KeyRound, Mail, Lock, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/services/api';
import { toast } from '@/utils/toast';

export function ForgotPasswordModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Identifier, 2: OTP, 3: New Password
  const [identifier, setIdentifier] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP to email/phone
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your registered email or phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/v1/auth/forgot-password', {
        identifier: identifier.trim()
      });
      setUserEmail(response.data?.email || identifier);
      toast.success(response.message || 'OTP verification code sent!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No account found with this identifier');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      await api.post('/v1/auth/verify-otp', {
        email: userEmail,
        otpCode,
        purpose: 'FORGOT_PASSWORD'
      });
      toast.success('OTP verified! Please set your new password.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password and Login Automatically
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/v1/auth/reset-password-with-otp', {
        email: userEmail,
        otpCode,
        newPassword
      });

      toast.success('Password reset successfully! Logging you in...');
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl text-text">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted hover:text-text p-1 rounded-full hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
            {step === 1 ? <KeyRound className="w-7 h-7" /> : step === 2 ? <ShieldCheck className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl font-bold">
            {step === 1 ? 'Forgot Password?' : step === 2 ? 'Enter Security OTP' : 'Reset Password'}
          </h2>
          <p className="text-xs text-muted mt-1 max-w-xs">
            {step === 1
              ? 'Enter your registered email address or phone number to receive a 6-digit OTP code.'
              : step === 2
              ? `We sent a 6-digit OTP code to ${userEmail}.`
              : 'Choose a new strong password for your Watch Together account.'}
          </p>
        </div>

        {/* Step 1: Identifier Input */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted">Email or Mobile Number</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                <Input
                  type="text"
                  placeholder="name@example.com or mobile"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted">6-Digit OTP Code</label>
              <Input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="text-center font-mono text-xl tracking-widest font-bold"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify OTP Code'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted">New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted">Confirm New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Resetting Password...' : 'Save New Password & Login'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
