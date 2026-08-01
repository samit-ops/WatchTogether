import React from 'react';
import { CreditCard, Calendar, FileText, CheckCircle2, Clock, XCircle, ArrowUpRight } from 'lucide-react';

export function PaymentHistory({ payments = [], onViewInvoice }) {
  if (!payments || payments.length === 0) {
    return (
      <div className="bg-surface/50 border border-border rounded-3xl p-8 text-center max-w-md mx-auto my-6">
        <CreditCard className="w-12 h-12 text-muted mx-auto mb-3" />
        <h4 className="text-lg font-bold text-text mb-1">No Payment History Yet</h4>
        <p className="text-xs text-muted">Transactions from your plan upgrades will be recorded here.</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted/20 text-muted">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text">Payment History</h3>
            <p className="text-xs text-muted">Past subscription transactions and invoices</p>
          </div>
        </div>
        <span className="text-xs font-mono text-muted bg-background px-3 py-1 rounded-full border border-border">
          {payments.length} Transaction{payments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-background/50 text-muted border-b border-border text-xs uppercase tracking-wider">
              <th className="py-3.5 px-6 font-semibold">Plan & Upgrade</th>
              <th className="py-3.5 px-6 font-semibold">Amount</th>
              <th className="py-3.5 px-6 font-semibold">Status</th>
              <th className="py-3.5 px-6 font-semibold">Transaction ID</th>
              <th className="py-3.5 px-6 font-semibold">Date</th>
              <th className="py-3.5 px-6 font-semibold text-right">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {payments.map((p) => {
              const upgradeText = p.metadata?.previousPlan 
                ? `${p.metadata.previousPlan} → ${p.plan}`
                : `${p.plan} Plan`;

              return (
                <tr key={p._id} className="hover:bg-surface-light/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-text">
                    <div className="font-bold text-sm text-text">{p.plan} Plan</div>
                    <div className="text-xs text-muted">{upgradeText}</div>
                  </td>

                  <td className="py-4 px-6 font-bold text-text">
                    ₹{p.amount} <span className="text-xs text-muted font-normal">INR</span>
                  </td>

                  <td className="py-4 px-6">
                    {getStatusBadge(p.status)}
                  </td>

                  <td className="py-4 px-6 font-mono text-xs text-muted">
                    {p.razorpayPaymentId || p.razorpayOrderId || 'N/A'}
                  </td>

                  <td className="py-4 px-6 text-xs text-muted whitespace-nowrap">
                    {new Date(p.paidAt || p.createdAt).toLocaleDateString()} at {new Date(p.paidAt || p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onViewInvoice(p)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-background hover:bg-surface border border-border text-text hover:text-primary font-medium text-xs rounded-xl transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
