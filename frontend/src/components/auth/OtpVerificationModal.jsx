import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, Smartphone, ArrowRight, RefreshCw, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';
import { toast } from '@/utils/toast';

export function OtpVerificationModal({ email, phoneNumber, purpose = 'LOGIN_NEW_DEVICE', initialChannel = 'email', city, state, otpPreview: initialOtpPreview, onSuccess, onClose }) {
  const [otpPreview, setOtpPreview] = useState(initialOtpPreview);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState(initialChannel);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs[5].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/v1/auth/verify-otp', {
        email,
        otpCode,
        purpose
      });

      toast.success(response.message || 'OTP verified successfully!');
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (channelOverride) => {
    let targetChannel = channelOverride || activeChannel;
    if (targetChannel === 'sms') {
      toast.info('Mobile SMS service requires Firebase Blaze Plan. Delivering 6-digit OTP code to your Gmail inbox.');
      targetChannel = 'email';
    }
    setResendLoading(true);

    try {
      const response = await api.post('/v1/auth/resend-otp', {
        email,
        otpChannel: 'email',
        purpose
      });

      setActiveChannel('email');
      toast.success(response.message || 'A new 6-digit OTP code has been sent to your Gmail inbox!');
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl text-text">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-muted hover:text-text p-1 rounded-full hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Security Verification</h2>
          <p className="text-xs text-muted mt-1 max-w-xs">
            {purpose === 'SIGNUP_VERIFICATION'
              ? 'Enter the 6-digit OTP code to verify and activate your Watch Together account.'
              : `New login location detected (${city || 'New Location'}). Enter the 6-digit OTP code.`}
          </p>
        </div>

        {/* Channel Indicator */}
        <div className="flex items-center justify-between mb-6 py-2.5 px-3.5 bg-background border border-border rounded-xl text-xs">
          <span className="flex items-center gap-2 font-medium text-text">
            {activeChannel === 'sms' ? (
              <Smartphone className="w-4 h-4 text-emerald-500" />
            ) : (
              <Mail className="w-4 h-4 text-primary" />
            )}
            {activeChannel === 'sms' ? `Mobile SMS (${phoneNumber || 'Mobile'})` : `Email (${email})`}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
            {activeChannel === 'sms' ? 'SMS Active' : 'Email Active'}
        </div>

        {otpPreview && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl text-center">
            <p className="text-xs text-primary font-bold">🔑 Test Mode OTP Code:</p>
            <p className="text-xl font-mono font-extrabold tracking-widest text-emerald-400 mt-1">{otpPreview}</p>
            <p className="text-[10px] text-muted mt-1">Add SMTP_USER & SMTP_PASS in Render env for direct Gmail delivery.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-background border-2 border-border focus:border-primary focus:outline-none rounded-xl transition-all shadow-inner"
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full py-3.5 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify OTP & Complete'}
            <ArrowRight className="w-4 h-4" />
          </Button>

          {/* Delivery Method Switcher & Resend Options */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Send via alternate channel:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={() => handleResendOtp('email')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                    activeChannel === 'email'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-background hover:bg-surface-light border border-border text-muted'
                  }`}
                >
                  <Mail className="w-3 h-3" /> Email
                </button>
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={() => handleResendOtp('sms')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                    activeChannel === 'sms'
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      : 'bg-background hover:bg-surface-light border border-border text-muted'
                  }`}
                >
                  <Smartphone className="w-3 h-3" /> Mobile SMS
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <span>Didn't receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={() => handleResendOtp(activeChannel)}
                  className="text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </button>
              ) : (
                <span className="font-mono text-muted/80">Resend in {resendTimer}s</span>
              )}
            </div>
          </div>
        </form>
        <div id="modal-recaptcha-container"></div>
      </div>
    </div>
  );
}
