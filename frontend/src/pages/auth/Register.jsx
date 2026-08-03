import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OtpVerificationModal } from '@/components/auth/OtpVerificationModal';
import { toast } from '@/utils/toast';
import { MapPin, Phone, Mail, Lock, User as UserIcon, Send, CheckCircle, AlertCircle } from 'lucide-react';

// ─── Live India Post Pincode API Lookup (covers ALL 30,000+ Indian pincodes) ─
// API: https://api.postalpincode.in/pincode/{pincode}
// Returns district (city) and state for any valid Indian pincode — free, no API key needed.
async function lookupPincode(pincode) {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (data?.[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return { valid: true, city: po.District, state: po.State, message: `✓ ${po.District}, ${po.State}` };
    }
    return { valid: false, city: null, state: null, message: 'Invalid pincode — not found in India Post database' };
  } catch {
    // Network error fallback — allow submission but don't auto-fill
    return { valid: true, city: null, state: null, message: '⚠ Could not verify pincode (offline)' };
  }
}

// ─── Validation Helpers ──────────────────────────────────────────────────────
const VALID_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_PHONE_REGEX = /^\+?[1-9]\d{1,2}\s?\d{6,12}$/;
const VALID_CITY_REGEX = /^[a-zA-Z][a-zA-Z\s\-'.]{1,49}$/;

function validateEmail(email) {
  if (!email) return { valid: false, message: '' };
  if (!VALID_EMAIL_REGEX.test(email)) return { valid: false, message: 'Enter a valid email (e.g. name@gmail.com)' };
  return { valid: true, message: '✓ Valid email address' };
}

function validatePhone(phone) {
  if (!phone) return { valid: true, message: '' };
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length < 10) return { valid: false, message: 'Phone number too short (min 10 digits)' };
  if (cleaned.length > 15) return { valid: false, message: 'Phone number too long (max 15 digits)' };
  if (!VALID_PHONE_REGEX.test(phone)) return { valid: false, message: 'Enter a valid phone (e.g. +91 9876543210)' };
  return { valid: true, message: '✓ Valid phone number' };
}

function validateCity(city) {
  if (!city) return { valid: false, message: '' };
  if (city.length < 2) return { valid: false, message: 'City name too short' };
  if (/\d/.test(city)) return { valid: false, message: 'City name cannot contain numbers' };
  if (!VALID_CITY_REGEX.test(city)) return { valid: false, message: 'City name contains invalid characters' };
  return { valid: true, message: '✓ Valid city name' };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [cityLocked, setCityLocked] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeResult, setPincodeResult] = useState({ valid: false, message: '', city: null });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpChannel, setOtpChannel] = useState('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpData, setOtpData] = useState(null);

  const { register, setAuthSession } = useAuth();
  const navigate = useNavigate();

  // ─── Real-Time Validation ──────────────────────────────────────────────────
  const emailValidation = useMemo(() => validateEmail(email), [email]);
  const phoneValidation = useMemo(() => validatePhone(phoneNumber), [phoneNumber]);
  const cityValidation = useMemo(() => validateCity(city), [city]);

  const getPasswordStrength = () => {
    if (!password) return { text: '', color: 'bg-transparent' };
    if (password.length < 6) return { text: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (password.length < 10) return { text: 'Fair', color: 'bg-yellow-500', width: 'w-2/3' };
    return { text: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  // Auto-fill & lock city via India Post API when pincode is 6 digits
  const handlePincodeChange = async (value) => {
    const digits = value.replace(/\D/g, '');
    setPincode(digits);

    if (digits.length < 6) {
      setCityLocked(false);
      setPincodeResult({ valid: false, message: digits.length > 0 ? `Enter 6 digits (${digits.length}/6)` : '', city: null });
      return;
    }

    if (!/^\d{6}$/.test(digits)) {
      setPincodeResult({ valid: false, message: 'Pincode must be exactly 6 digits', city: null });
      setCityLocked(false);
      return;
    }

    // Call India Post API
    setPincodeLoading(true);
    setPincodeResult({ valid: false, message: 'Verifying pincode...', city: null });

    const result = await lookupPincode(digits);
    setPincodeLoading(false);
    setPincodeResult(result);

    if (result.valid && result.city) {
      setCity(result.city);
      setCityLocked(true);
    } else {
      setCityLocked(false);
    }
  };

  const handleChannelSelect = (channel) => {
    if (channel === 'sms') {
      toast.info('Mobile SMS service requires Firebase Blaze Plan. Defaulting to Email OTP delivery to your Gmail inbox.');
      setOtpChannel('email');
    } else {
      setOtpChannel(channel);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !city || !pincode) {
      return setError('Please fill in all required fields including City and Pincode.');
    }

    if (!emailValidation.valid) {
      return setError(emailValidation.message || 'Please enter a valid email address.');
    }

    if (phoneNumber && !phoneValidation.valid) {
      return setError(phoneValidation.message || 'Please enter a valid phone number.');
    }

    if (!cityValidation.valid) {
      return setError(cityValidation.message || 'Please enter a valid city name.');
    }

    if (!pincodeResult.valid) {
      return setError(pincodeResult.message || 'Please enter a valid 6-digit pincode.');
    }

    // Cross-validate: if pincode maps to a known city, city MUST match
    if (pincodeResult.city && city.trim().toLowerCase() !== pincodeResult.city.toLowerCase()) {
      return setError(`Pincode ${pincode} belongs to ${pincodeResult.city}, but you entered "${city}". Please correct the city or pincode.`);
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const response = await register(name, email, password, phoneNumber, city.trim(), pincode.trim(), 'email');

      if (response?.requireOtp) {
        if (response?.otpPreview) {
          toast.info(`[Demo Mode OTP]: ${response.otpPreview}`);
        } else {
          toast.success(response.message || '6-digit OTP code sent to your Gmail inbox!');
        }
        setOtpData({
          email: response.email || email,
          phoneNumber: response.phoneNumber || phoneNumber,
          otpChannel: 'email',
          otpPreview: response.otpPreview,
          purpose: 'SIGNUP_VERIFICATION',
          city: city.trim(),
          state: pincode.trim()
        });
      } else {
        toast.success('Registration successful!');
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = (res) => {
    const token = res.data?.token;
    const userData = res.data?.user;
    if (token && userData) {
      setAuthSession(token, userData);
      toast.success('Account created & verified! Welcome to Watch Together.');
      setOtpData(null);
      navigate('/');
    }
  };

  // ─── Inline validation hint component ──────────────────────────────────────
  const ValidationHint = ({ validation }) => {
    if (!validation.message) return null;
    return (
      <p className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${validation.valid ? 'text-green-500' : 'text-red-400'}`}>
        {validation.valid ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
        {validation.message}
      </p>
    );
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 rounded-3xl border border-border bg-surface/50 p-8 shadow-2xl backdrop-blur-sm transition-all">
        <div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-text">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Join Watch Together with real-time security & Email OTP verification
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-red-500 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-muted mb-1 block">Full Name *</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                <Input
                  type="text"
                  required
                  placeholder="SAMIT KUMAR"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 bg-background/50 focus:bg-background"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-semibold text-muted mb-1 block">Email Address (for Gmail OTP) *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 h-11 bg-background/50 focus:bg-background ${email && !emailValidation.valid ? 'border-red-400/60' : email && emailValidation.valid ? 'border-green-500/40' : ''}`}
                />
              </div>
              <ValidationHint validation={emailValidation} />
            </div>

            {/* Mobile Phone Number */}
            <div>
              <label className="text-xs font-semibold text-muted mb-1 block">Mobile Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                <Input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`pl-10 h-11 bg-background/50 focus:bg-background ${phoneNumber && !phoneValidation.valid ? 'border-red-400/60' : phoneNumber && phoneValidation.valid ? 'border-green-500/40' : ''}`}
                />
              </div>
              <ValidationHint validation={phoneValidation} />
            </div>

            {/* OTP Delivery Preference Selector */}
            <div className="p-3 bg-background/60 border border-border rounded-xl">
              <label className="text-xs font-bold text-text mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5 text-primary" /> Receive OTP Code Via:</span>
                <span className="text-[10px] text-muted font-normal">Gmail Inbox Active</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleChannelSelect('email')}
                  className={`py-2 px-2.5 rounded-lg border font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    otpChannel === 'email'
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-surface border-border text-muted hover:text-text'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email (Gmail)
                </button>
                <button
                  type="button"
                  onClick={() => handleChannelSelect('sms')}
                  className="py-2 px-2.5 rounded-lg border font-semibold transition-all flex items-center justify-center gap-1.5 bg-surface/40 border-border/60 text-muted/70 hover:text-muted"
                >
                  <Phone className="w-3.5 h-3.5" /> Mobile SMS (Preview)
                </button>
              </div>
            </div>

            {/* Pincode & City (Pincode first for auto-fill) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Pincode (6-Digit) *</label>
                <Input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="110001"
                  value={pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className={`h-11 font-mono bg-background/50 focus:bg-background ${pincode && !pincodeResult.valid && !pincodeLoading ? 'border-red-400/60' : pincode && pincodeResult.valid ? 'border-green-500/40' : ''}`}
                />
                {pincodeLoading ? (
                  <p className="mt-1 text-[11px] font-medium text-blue-400 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Looking up pincode...
                  </p>
                ) : (
                  <ValidationHint validation={pincodeResult} />
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">
                  City / Location *
                  {cityLocked && <span className="ml-1.5 text-[10px] text-primary font-normal">(auto-filled from pincode)</span>}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                  <Input
                    type="text"
                    required
                    readOnly={cityLocked}
                    placeholder="e.g. New Delhi"
                    value={city}
                    onChange={(e) => {
                      if (cityLocked) return;
                      const val = e.target.value;
                      if (/^[a-zA-Z\s\-'.]*$/.test(val)) setCity(val);
                    }}
                    className={`pl-10 h-11 bg-background/50 focus:bg-background ${cityLocked ? 'opacity-70 cursor-not-allowed' : ''} ${city && !cityValidation.valid ? 'border-red-400/60' : city && cityValidation.valid ? 'border-green-500/40' : ''}`}
                  />
                </div>
                <ValidationHint validation={cityValidation} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-muted mb-1 block">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-background/50 focus:bg-background"
                />
              </div>
            </div>

            {password && (
              <div className="px-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/50">
                  <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 ease-in-out`} />
                </div>
                <p className="mt-1 text-xs text-muted text-right font-medium">{strength.text} password</p>
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-muted mb-1 block">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-11 bg-background/50 focus:bg-background"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-[11px] font-medium text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
              {confirmPassword && password === confirmPassword && confirmPassword.length >= 6 && (
                <p className="mt-1 text-[11px] font-medium text-green-500 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg" isLoading={loading}>
              Sign Up with Gmail OTP Verification
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-blue-400 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      {/* Signup OTP Verification Modal */}
      {otpData && (
        <OtpVerificationModal
          email={otpData.email}
          phoneNumber={otpData.phoneNumber}
          purpose={otpData.purpose}
          initialChannel="email"
          city={otpData.city}
          state={otpData.state}
          otpPreview={otpData.otpPreview}
          onSuccess={handleOtpSuccess}
          onClose={() => setOtpData(null)}
        />
      )}
    </div>
  );
}
