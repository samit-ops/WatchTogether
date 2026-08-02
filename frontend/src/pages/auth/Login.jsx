import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OtpVerificationModal } from '@/components/auth/OtpVerificationModal';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { toast } from '@/utils/toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification state for New Location / Device Security
  const [otpData, setOtpData] = useState(null); // { email, phoneNumber, purpose, city, state }
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { login, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect') || location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);

      // Check if new device/location OTP verification is required
      if (data?.requireOtp) {
        toast.info(data.message || 'New location detected. Security OTP verification required.');
        setOtpData({
          email: data.email || email,
          phoneNumber: data.phoneNumber,
          purpose: 'LOGIN_NEW_DEVICE',
          city: data.city,
          state: data.state
        });
      } else {
        toast.success('Login successful!');
        navigate(redirectTarget, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = (res) => {
    const token = res.data?.token;
    const userData = res.data?.user;
    if (token && userData) {
      setAuthSession(token, userData);
      toast.success('Device verified! Welcome to Watch Together.');
      setOtpData(null);
      navigate(redirectTarget, { replace: true });
    }
  };

  const handleForgotPasswordSuccess = (res) => {
    const token = res.token;
    const userData = res.user;
    if (token && userData) {
      setAuthSession(token, userData);
      toast.success('Welcome back!');
      setShowForgotPassword(false);
      navigate(redirectTarget, { replace: true });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-surface/50 p-8 shadow-xl backdrop-blur-sm transition-all">
        <div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-text">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Sign in to continue watching
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-500/10 p-4 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-background/50 focus:bg-background transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-muted">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-medium text-primary hover:text-blue-400 transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full h-12 text-lg" isLoading={loading}>
              Sign in
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted">
          New to Watch Together?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-blue-400 transition-colors">
            Sign up now
          </Link>
        </p>
      </div>

      {/* New Location/Device Security OTP Modal */}
      {otpData && (
        <OtpVerificationModal
          email={otpData.email}
          phoneNumber={otpData.phoneNumber}
          purpose={otpData.purpose}
          city={otpData.city}
          state={otpData.state}
          onSuccess={handleOtpSuccess}
          onClose={() => setOtpData(null)}
        />
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
          onSuccess={handleForgotPasswordSuccess}
        />
      )}
    </div>
  );
}
