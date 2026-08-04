import React, { useState } from 'react';
import { 
  ThumbsUp, ThumbsDown, MessageSquare, Edit3, Trash2, 
  Globe, Flag, MapPin, Check, X, Loader2 
} from 'lucide-react';
import { AuthorBadge } from './AuthorBadge';
import { CommentInput } from './CommentInput';
import { cn } from '@/utils/cn';

// Relative time formatter helper
function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function CommentItem({
  comment,
  videoUploaderId,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onDislike,
  onReport
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Translation state
  const [translatedText, setTranslatedText] = useState(null);
  const [targetLang, setTargetLang] = useState('en');
  const [translating, setTranslating] = useState(false);

  const commentUserId = comment?.user?.id || comment?.user?._id || comment?.user;
  const currentUserId = currentUser?.id || currentUser?._id || currentUser;

  const isCreator = Boolean(
    videoUploaderId && commentUserId && String(commentUserId) === String(videoUploaderId)
  );

  const isAuthor = Boolean(
    currentUserId && commentUserId && String(currentUserId) === String(commentUserId)
  );

  const isVideoCreator = Boolean(
    currentUserId && videoUploaderId && String(currentUserId) === String(videoUploaderId)
  );

  const canDelete = isAuthor || isVideoCreator;

  // Handle Translate into chosen language using free translation service API
  const handleTranslate = async (langInput = 'en') => {
    const lang = typeof langInput === 'string' ? langInput : 'en';
    setTargetLang(lang);
    setTranslating(true);
    try {
      const encodedText = encodeURIComponent(comment.text);
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=autodetect|${lang}`);
      const data = await res.json();
      
      if (data?.responseData?.translatedText) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        setTranslatedText('Translation unavailable.');
      }
    } catch (e) {
      setTranslatedText('Could not connect to translation server.');
    } finally {
      setTranslating(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editText.trim()) {
      setEditError('Comment cannot be empty.');
      return;
    }

    setEditSubmitting(true);
    try {
      await onEdit(comment.id || comment._id, editText.trim());
      setIsEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Failed to edit comment.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete(comment.id || comment._id);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full py-3 border-b border-border/40 last:border-b-0">
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user?.avatar ? (
            <img
              src={comment.user.avatar}
              alt={comment.user.name || 'User'}
              className="w-9 h-9 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-surface-light text-text font-semibold flex items-center justify-center text-xs border border-border">
              {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>

        {/* Comment Content Body */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {/* Author Line */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-text hover:underline cursor-pointer">
              {comment.user?.name || 'User'}
            </span>

            <AuthorBadge isCreator={isCreator} />

            {comment.showLocation && (
              <span className="text-[11px] font-medium text-primary flex items-center gap-0.5 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                <MapPin className="w-3 h-3" />
                {comment.location || comment.user?.city || 'Location Shared'}
              </span>
            )}

            {comment.isReported && (
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Flag className="w-3 h-3 text-amber-400 fill-amber-400" />
                Flagged for Review {comment.reportCount > 1 ? `(${comment.reportCount})` : ''}
              </span>
            )}

            <span className="text-muted text-[11px]">
              {formatTimeAgo(comment.createdAt)}
            </span>

            {comment.isEdited && (
              <span className="text-muted/70 text-[10px] italic">
                (edited)
              </span>
            )}
          </div>

          {/* Comment Text or Edit Input */}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="mt-1 flex flex-col gap-2">
              <textarea
                rows={2}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-background border border-primary/50 rounded-xl p-2.5 text-sm text-text focus:outline-none"
              />
              {editError && <p className="text-xs text-red-400">{editError}</p>}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-xs text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-3 py-1 bg-primary text-white font-semibold text-xs rounded-lg flex items-center gap-1"
                >
                  {editSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-text whitespace-pre-wrap leading-relaxed break-words">
                {comment.text}
              </p>

              {/* Translated Text Box with Preferred Language Selector */}
              {translatedText && (
                <div className="mt-1 p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs text-text flex flex-col gap-1">
                  <div className="flex items-center justify-between font-bold text-primary text-[11px]">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      Translation ({(typeof targetLang === 'string' ? targetLang : 'en').toUpperCase()}):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={typeof targetLang === 'string' ? targetLang : 'en'}
                        onChange={(e) => handleTranslate(e.target.value)}
                        className="bg-surface text-text border border-border rounded px-2 py-0.5 text-[10px] focus:outline-none font-medium cursor-pointer"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="es">Spanish (Español)</option>
                        <option value="fr">French (Français)</option>
                        <option value="de">German (Deutsch)</option>
                        <option value="ja">Japanese (日本語)</option>
                      </select>
                      <button
                        onClick={() => setTranslatedText(null)}
                        className="text-muted hover:text-text p-0.5"
                        title="Close translation"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="leading-relaxed">{translatedText}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          {!isEditing && (
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted">
              {/* Like Button */}
              <button
                onClick={() => onLike(comment.id || comment._id)}
                className={cn(
                  "flex items-center gap-1 hover:text-text transition-colors py-0.5 px-1.5 rounded-md hover:bg-surface-light",
                  comment.isLiked && "text-primary font-bold"
                )}
                title="Like comment"
              >
                <ThumbsUp className={cn("w-3.5 h-3.5", comment.isLiked && "fill-primary")} />
                <span>{comment.likesCount || 0}</span>
              </button>

              {/* Dislike Button */}
              <button
                onClick={() => onDislike(comment.id || comment._id)}
                className={cn(
                  "flex items-center gap-1 hover:text-text transition-colors py-0.5 px-1.5 rounded-md hover:bg-surface-light",
                  comment.isDisliked && "text-red-400 font-bold"
                )}
                title="Dislike comment"
              >
                <ThumbsDown className={cn("w-3.5 h-3.5", comment.isDisliked && "fill-red-400")} />
                <span>{comment.dislikesCount || 0}</span>
              </button>

              {/* Reply Button */}
              <button
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="flex items-center gap-1 hover:text-text transition-colors py-0.5 px-1.5 rounded-md hover:bg-surface-light font-medium"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>

              {/* Translate Button */}
              <button
                onClick={() => {
                  if (translatedText) {
                    setTranslatedText(null);
                  } else {
                    handleTranslate(typeof targetLang === 'string' ? targetLang : 'en');
                  }
                }}
                disabled={translating}
                className="flex items-center gap-1 hover:text-primary transition-colors py-0.5 px-1.5 rounded-md hover:bg-surface-light text-[11px]"
                title="Translate comment"
              >
                <Globe className="w-3 h-3" />
                <span>{translating ? 'Translating...' : translatedText ? 'Show Original' : 'Translate'}</span>
              </button>

              {/* Edit (Author Only) */}
              {isAuthor && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 hover:text-text transition-colors py-0.5 px-1.5 rounded-md hover:bg-surface-light"
                  title="Edit comment"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              {/* Delete (Author OR Video Creator) */}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 text-muted hover:text-red-400 transition-colors py-0.5 px-1.5 rounded-md hover:bg-red-500/10"
                  title={isVideoCreator && !isAuthor ? 'Delete (as Video Creator)' : 'Delete comment'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              )}

              {/* Report Button */}
              {!isAuthor && (
                <button
                  onClick={() => onReport(comment.id || comment._id)}
                  className={cn(
                    "flex items-center gap-1 hover:text-amber-400 transition-colors py-0.5 px-1.5 rounded-md hover:bg-amber-500/10 ml-auto",
                    comment.isReported && "text-amber-400 font-bold"
                  )}
                  title="Report comment"
                >
                  <Flag className="w-3 h-3" />
                  <span className="text-[11px]">{comment.isReported ? 'Reported' : 'Report'}</span>
                </button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyBox && (
            <div className="mt-3 pl-2">
              <CommentInput
                user={currentUser}
                placeholder={`Replying to @${comment.user?.name || 'user'}...`}
                submitLabel="Reply"
                autoFocus
                isReply
                onCancel={() => setShowReplyBox(false)}
                onSubmit={async ({ text, showLocation }) => {
                  await onReply(comment.id || comment._id, text, showLocation);
                  setShowReplyBox(false);
                }}
              />
            </div>
          )}

          {/* Nested Child Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 border-l-2 border-border/60 pl-3 flex flex-col gap-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id || reply._id}
                  comment={reply}
                  videoUploaderId={videoUploaderId}
                  currentUser={currentUser}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  onDislike={onDislike}
                  onReport={onReport}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
