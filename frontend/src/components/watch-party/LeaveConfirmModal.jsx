import React from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function LeaveConfirmModal({ isOpen, onClose, onConfirm, isHost }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6 relative transform transition-all scale-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-text p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Leave Watch Party?</h3>
            <p className="text-sm text-muted mt-0.5">
              {isHost
                ? "You are the host. Leaving will transfer host permissions to another participant or end the party."
                : "Are you sure you want to leave this session? You will be disconnected from all participants."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-5 h-11 border-border text-text hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="px-5 h-11 bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}
