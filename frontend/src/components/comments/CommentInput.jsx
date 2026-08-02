import React, { useState } from 'react';
import { Send, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CommentInput({
  user,
  placeholder = "Add a comment...",
  submitLabel = "Comment",
  onSubmit,
  onCancel,
  autoFocus = false,
  isReply = false
}) {
  const [text, setText] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const maxLength = 1000;
  const remaining = maxLength - text.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!text.trim()) {
      setErrorMsg('Comment cannot be empty.');
      return;
    }

    if (text.length > maxLength) {
      setErrorMsg(`Comment exceeds maximum limit of ${maxLength} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ text: text.trim(), showLocation });
      setText('');
      setShowLocation(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to post comment.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const userLocationStr = user?.city ? `📍 ${user.city}` : '📍 Your location';

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full">
      {/* User Avatar */}
      <div className="flex-shrink-0">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || 'User'}
            className="w-10 h-10 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center border border-primary/30 text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="relative">
          <textarea
            autoFocus={autoFocus}
            rows={isReply ? 2 : 3}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={submitting}
            className="w-full bg-surface border border-border rounded-xl p-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-all resize-y min-h-[70px]"
          />
          <span className={`absolute right-3 bottom-2 text-[10px] font-mono ${remaining < 50 ? 'text-red-400 font-bold' : 'text-muted'}`}>
            {text.length}/{maxLength}
          </span>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 font-medium px-1 animate-in fade-in">
            ⚠️ {errorMsg}
          </p>
        )}

        {/* Controls & Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Optional Location Privacy Checkbox */}
          {user?.city && (
            <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer hover:text-text transition-colors">
              <input
                type="checkbox"
                checked={showLocation}
                onChange={(e) => setShowLocation(e.target.checked)}
                className="rounded border-border bg-background text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Show my location ({userLocationStr})</span>
            </label>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-text hover:bg-surface-light transition-colors"
              >
                Cancel
              </button>
            )}

            <Button
              type="submit"
              disabled={submitting || !text.trim()}
              className="h-8 px-4 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitLabel}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CommentInput;
