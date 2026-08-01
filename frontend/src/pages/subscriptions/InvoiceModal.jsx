import React from 'react';
import { X, Printer, CheckCircle, Download, Sparkles, ShieldCheck } from 'lucide-react';

export function InvoiceModal({ payment, user, onClose }) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg">
              WT
            </div>
            <div>
              <h3 className="text-xl font-bold text-text">Subscription Invoice</h3>
              <p className="text-xs text-muted">Watch Together Streaming Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background border border-border text-muted hover:text-text flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <div>
                <div className="text-sm font-bold text-green-500">Payment Successful</div>
                <div className="text-xs text-muted">Transaction verified via Razorpay</div>
              </div>
            </div>
            <span className="text-lg font-black text-text">₹{payment.amount} INR</span>
          </div>

          {/* Details Table */}
          <div className="bg-background/50 border border-border rounded-2xl p-5 space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Customer Name:</span>
              <span className="font-semibold text-text">{user?.name || 'Customer'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Email Address:</span>
              <span className="font-semibold text-text">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Subscription Plan:</span>
              <span className="font-bold text-primary">{payment.plan} Plan</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Plan Upgrade:</span>
              <span className="font-mono text-xs text-text">
                {payment.metadata?.previousPlan || 'Free'} → {payment.plan}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Transaction ID:</span>
              <span className="font-mono text-xs text-text">{payment.razorpayPaymentId || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Order ID:</span>
              <span className="font-mono text-xs text-text">{payment.razorpayOrderId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Receipt Number:</span>
              <span className="font-mono text-xs text-text">{payment.receipt || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Payment Date:</span>
              <span className="font-medium text-text">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-6 border-t border-border mt-6">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-background hover:bg-surface-light border border-border text-text font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-primary hover:bg-blue-600 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Close Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
