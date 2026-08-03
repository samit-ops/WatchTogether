import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MessageSquare, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import commentService from '@/services/comment.service';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';
import { toast } from '@/utils/toast';
import { Loader } from '@/components/ui/Loader';

// Helper to insert or replace comments cleanly without duplicates
function upsertCommentInTree(tree, newComment, tempIdToReplace = null) {
  if (!newComment) return tree;
  const newId = (newComment.id || newComment._id).toString();

  const isMatch = (item) => {
    const itemId = (item.id || item._id).toString();
    if (itemId === newId) return true;
    if (tempIdToReplace && itemId === tempIdToReplace.toString()) return true;
    if (itemId.startsWith('temp-') && 
        (item.user?.id || item.user?._id) === (newComment.user?.id || newComment.user?._id) && 
        item.text === newComment.text) {
      return true;
    }
    return false;
  };

  const existsInTree = (items) => {
    return items.some(item => isMatch(item) || (item.replies && existsInTree(item.replies)));
  };

  if (existsInTree(tree)) {
    const replaceInTree = (items) => {
      return items.map(item => {
        if (isMatch(item)) {
          return {
            ...newComment,
            replies: (item.replies && item.replies.length > 0) ? item.replies : (newComment.replies || [])
          };
        }
        if (item.replies && item.replies.length > 0) {
          return { ...item, replies: replaceInTree(item.replies) };
        }
        return item;
      });
    };
    return replaceInTree(tree);
  }

  // Not present -> Insert new comment
  if (!newComment.parentComment) {
    return [newComment, ...tree];
  } else {
    const parentId = newComment.parentComment.toString();
    const insertReply = (items) => {
      return items.map(item => {
        const itemId = (item.id || item._id).toString();
        if (itemId === parentId) {
          const replies = item.replies || [];
          const replyExists = replies.some(r => (r.id || r._id).toString() === newId);
          if (replyExists) return item;
          return { ...item, replies: [...replies, newComment] };
        }
        if (item.replies && item.replies.length > 0) {
          return { ...item, replies: insertReply(item.replies) };
        }
        return item;
      });
    };
    return insertReply(tree);
  }
}

export function CommentSection({ videoId, videoUploaderId, videoSource = 'platform' }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  if (videoSource === 'watchparty') {
    return (
      <div className="mt-8 p-6 rounded-2xl bg-surface/40 border border-border text-center">
        <MessageSquare className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
        <h3 className="text-base font-semibold text-text mb-1">Comments are disabled for Watch Party videos</h3>
        <p className="text-xs text-muted">Watch Party videos are intended for live group watch sessions with friends.</p>
      </div>
    );
  }

  const roomId = `video_${videoId}`;

  // Fetch comments from API
  const fetchComments = useCallback(async (pageNum = 1, isAppend = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError('');

    try {
      const res = await commentService.getCommentsByVideo(videoId, pageNum, 20);
      const data = res.data || res;
      
      const fetchedComments = data.comments || [];
      setTotalComments(data.totalComments || fetchedComments.length);
      setTotalPages(data.totalPages || 1);

      if (isAppend) {
        setComments(prev => {
          let merged = [...prev];
          fetchedComments.forEach(fc => {
            merged = upsertCommentInTree(merged, fc);
          });
          return merged;
        });
      } else {
        setComments(fetchedComments);
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load comments.';
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [videoId]);

  // Initial Fetch & Socket Setup
  useEffect(() => {
    fetchComments(1, false);
  }, [fetchComments]);

  // Socket room joining and event listeners
  useEffect(() => {
    if (!socket || !videoId) return;

    // Join video room
    socket.emit('join-video', { videoId });

    // Handle socket reconnection
    const handleConnect = () => {
      socket.emit('join-video', { videoId });
    };

    // Real-time Event Handlers
    const handleCommentAdded = ({ comment, videoId: eventVideoId }) => {
      if (eventVideoId.toString() !== videoId.toString()) return;

      setComments(prev => upsertCommentInTree(prev, comment));
    };

    const handleCommentUpdated = ({ comment, videoId: eventVideoId }) => {
      if (eventVideoId.toString() !== videoId.toString()) return;

      setComments(prev => {
        const updateTree = (items) => {
          return items.map(item => {
            const itemId = (item.id || item._id).toString();
            const updatedId = (comment.id || comment._id).toString();
            if (itemId === updatedId) {
              return { ...item, ...comment, replies: item.replies || [] };
            }
            if (item.replies && item.replies.length > 0) {
              return { ...item, replies: updateTree(item.replies) };
            }
            return item;
          });
        };
        return updateTree(prev);
      });
    };

    const handleCommentDeleted = ({ deletedIds, videoId: eventVideoId }) => {
      if (eventVideoId.toString() !== videoId.toString()) return;

      setComments(prev => {
        const removeFromTree = (items) => {
          return items
            .filter(item => !deletedIds.includes((item.id || item._id).toString()))
            .map(item => {
              if (item.replies && item.replies.length > 0) {
                return { ...item, replies: removeFromTree(item.replies) };
              }
              return item;
            });
        };
        return removeFromTree(prev);
      });

      setTotalComments(prev => Math.max(0, prev - (deletedIds?.length || 1)));
    };

    socket.on('connect', handleConnect);
    socket.on('comment-added', handleCommentAdded);
    socket.on('comment-updated', handleCommentUpdated);
    socket.on('comment-deleted', handleCommentDeleted);

    return () => {
      socket.emit('leave-video', { videoId });
      socket.off('connect', handleConnect);
      socket.off('comment-added', handleCommentAdded);
      socket.off('comment-updated', handleCommentUpdated);
      socket.off('comment-deleted', handleCommentDeleted);
    };
  }, [socket, videoId]);

  // Handle Optimistic Top-Level Comment Posting
  const handleCreateTopComment = async ({ text, showLocation }) => {
    if (!user) {
      toast.info('Please log in to post a comment.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempComment = {
      id: tempId,
      _id: tempId,
      video: videoId,
      user: {
        id: user.id || user._id,
        _id: user.id || user._id,
        name: user.name,
        avatar: user.avatar || ''
      },
      text,
      parentComment: null,
      likesCount: 0,
      dislikesCount: 0,
      isLiked: false,
      isDisliked: false,
      showLocation,
      location: showLocation ? (user.city || '') : '',
      isEdited: false,
      createdAt: new Date().toISOString(),
      replies: []
    };

    // 1. Optimistic Update (local state)
    setComments(prev => upsertCommentInTree(prev, tempComment));
    setTotalComments(prev => prev + 1);

    try {
      // 2. Call REST API
      const res = await commentService.createComment(videoId, text, null, showLocation);
      const realComment = res.data?.comment || res.comment;

      // 3. Replace temp comment with server comment cleanly
      setComments(prev => upsertCommentInTree(prev, realComment, tempId));
      toast.success('Comment posted!');
    } catch (err) {
      // Rollback optimistic comment on error
      setComments(prev => prev.filter(c => (c.id || c._id).toString() !== tempId));
      setTotalComments(prev => Math.max(0, prev - 1));
      const msg = err.response?.data?.message || err.message || 'Failed to post comment.';
      toast.error(msg);
    }
  };

  // Handle Posting Reply
  const handleCreateReply = async (parentCommentId, text, showLocation) => {
    if (!user) {
      toast.info('Please log in to reply.');
      return;
    }

    const tempId = `temp-reply-${Date.now()}`;
    const tempReply = {
      id: tempId,
      _id: tempId,
      video: videoId,
      user: {
        id: user.id || user._id,
        _id: user.id || user._id,
        name: user.name,
        avatar: user.avatar || ''
      },
      text,
      parentComment: parentCommentId,
      likesCount: 0,
      dislikesCount: 0,
      isLiked: false,
      isDisliked: false,
      showLocation,
      location: showLocation ? (user.city || '') : '',
      isEdited: false,
      createdAt: new Date().toISOString(),
      replies: []
    };

    // 1. Optimistic local state update (reply renders instantly)
    setComments(prev => upsertCommentInTree(prev, tempReply));
    setTotalComments(prev => prev + 1);

    try {
      // 2. Call backend API
      const res = await commentService.createComment(videoId, text, parentCommentId, showLocation);
      const realReply = res.data?.comment || res.comment || res.data;

      // 3. Replace temp reply with server reply
      if (realReply) {
        setComments(prev => upsertCommentInTree(prev, realReply, tempId));
      }
      toast.success('Reply posted!');
    } catch (err) {
      // Rollback optimistic reply on failure
      setComments(prev => {
        const removeTemp = (items) => items.filter(i => (i.id || i._id).toString() !== tempId).map(i => i.replies ? { ...i, replies: removeTemp(i.replies) } : i);
        return removeTemp(prev);
      });
      setTotalComments(prev => Math.max(0, prev - 1));
      const msg = err.response?.data?.message || err.message || 'Failed to post reply.';
      toast.error(msg);
    }
  };

  // Handle Edit
  const handleEditComment = async (commentId, text) => {
    try {
      await commentService.editComment(commentId, text);
      toast.success('Comment updated!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to edit comment.';
      toast.error(msg);
    }
  };

  // Handle Delete
  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      toast.success('Comment deleted!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete comment.';
      toast.error(msg);
    }
  };

  // Handle Like
  const handleLikeComment = async (commentId) => {
    if (!user) {
      toast.info('Please log in to like comments.');
      return;
    }
    try {
      await commentService.toggleLike(commentId);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Handle Dislike
  const handleDislikeComment = async (commentId) => {
    if (!user) {
      toast.info('Please log in to dislike comments.');
      return;
    }
    try {
      await commentService.toggleDislike(commentId);
    } catch (err) {
      console.error('Dislike error:', err);
    }
  };

  // Handle Report
  const handleReportComment = async (commentId) => {
    if (!user) {
      toast.info('Please log in to report comments.');
      return;
    }
    try {
      await commentService.reportComment(commentId);
      toast.success('Comment reported for review.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to report comment.';
      toast.error(msg);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-border w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-text flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <span>Comments ({totalComments})</span>
        </h3>

        <button
          onClick={() => fetchComments(1, false)}
          className="text-xs text-muted hover:text-text flex items-center gap-1 transition-colors"
          title="Refresh comments"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Comment Input */}
      {user ? (
        <CommentInput
          user={user}
          placeholder="Add a public comment..."
          submitLabel="Comment"
          onSubmit={handleCreateTopComment}
        />
      ) : (
        <div className="p-4 rounded-xl bg-surface border border-border text-center text-sm text-muted">
          <span>Please </span>
          <a href={`/login?redirect=/video/${videoId}`} className="text-primary font-semibold hover:underline">
            Log in
          </a>
          <span> to post comments and join the discussion.</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader size={32} />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-12 text-center text-muted text-sm">
          <p className="font-medium text-text mb-1">No comments yet</p>
          <p>Be the first to share your thoughts on this video!</p>
        </div>
      ) : (
        /* Comment List */
        <div className="flex flex-col">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id || comment._id}
              comment={comment}
              videoUploaderId={videoUploaderId}
              currentUser={user}
              onReply={handleCreateReply}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onLike={handleLikeComment}
              onDislike={handleDislikeComment}
              onReport={handleReportComment}
            />
          ))}

          {/* Load More Pagination Button */}
          {page < totalPages && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchComments(nextPage, true);
                }}
                disabled={loadingMore}
                className="px-5 py-2.5 bg-surface hover:bg-surface-light border border-border text-text text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 mx-auto shadow-sm"
              >
                {loadingMore ? (
                  <Loader size={16} />
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 text-primary" />
                    <span>Load More Comments ({page}/{totalPages})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
