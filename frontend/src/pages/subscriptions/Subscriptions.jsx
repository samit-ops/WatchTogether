import React, { useEffect, useState } from 'react';
import subscriptionService from '@/services/subscription.service';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/ui/Loader';
import { toast } from '@/utils/toast';
import { SubscriptionCard } from './SubscriptionCard';
import { PaymentHistory } from './PaymentHistory';
import { InvoiceModal } from './InvoiceModal';
import { Sparkles, Shield, Crown, Zap, RefreshCw } from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Subscriptions() {
  const { user, login, updateUserSubscription, refreshUser } = useAuth();
  
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, currentRes, historyRes] = await Promise.all([
        subscriptionService.getPlans(),
        user ? subscriptionService.getCurrentSubscription() : Promise.resolve(null),
        user ? subscriptionService.getPaymentHistory() : Promise.resolve(null)
      ]);

      if (plansRes.plans) {
        setPlans(plansRes.plans);
      }

      if (currentRes && currentRes.success) {
        setCurrentSub(currentRes);
      }

      if (historyRes && historyRes.payments) {
        setPayments(historyRes.payments);
      }
    } catch (err) {
      console.error('Error loading subscription data:', err);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    loadRazorpayScript();
  }, [user]);

  const handleSelectPlan = async (plan) => {
    if (!user) {
      toast.info('Please log in to upgrade your subscription.');
      return;
    }

    setLoadingPlan(plan.name);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay checkout SDK. Check your network connection.');
        setLoadingPlan(null);
        return;
      }

      // Step 1: Create Order
      const res = await subscriptionService.createOrder(plan.name);

      if (!res.success) {
        toast.error(res.message || 'Could not initiate upgrade order.');
        setLoadingPlan(null);
        return;
      }

      // Step 2: Open Razorpay Test Checkout
      const options = {
        key: res.key,
        amount: res.amount * 100,
        currency: res.currency || 'INR',
        name: 'Watch Together',
        description: `${plan.name} Subscription Upgrade`,
        order_id: res.orderId,
        handler: async function (response) {
          try {
            toast.info('Verifying payment signature...');
            const verifyRes = await subscriptionService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.name
            });

            if (verifyRes.success) {
              toast.success(verifyRes.message || `Upgraded to ${plan.name} Plan!`);
              if (updateUserSubscription) updateUserSubscription(plan.name);
              if (refreshUser) refreshUser();
              fetchData();
            } else {
              toast.error(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err) {
            console.error('Verification error:', err);
            const msg = err.response?.data?.message || err.message || 'Error verifying payment signature.';
            toast.error(msg);
          } finally {
            setLoadingPlan(null);
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment cancelled.');
            setLoadingPlan(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Order Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Order creation failed');
      setLoadingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader size={48} />
      </div>
    );
  }

  const activePlanName = user?.subscription || currentSub?.plan || 'Free';

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl min-h-screen">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-widest mb-4 border border-primary/20">
          <Sparkles className="w-4 h-4" /> Subscription Plans
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-text tracking-tight mb-4">
          Upgrade Your Streaming Experience
        </h1>
        <p className="text-muted text-base sm:text-lg leading-relaxed">
          Unlock higher daily downloads, 4K Ultra HD quality, and ad-free playback with our flexible plans.
        </p>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 items-stretch">
        {plans.map((plan) => (
          <SubscriptionCard
            key={plan.name}
            plan={plan}
            currentPlan={activePlanName}
            onSelect={handleSelectPlan}
            loadingPlan={loadingPlan}
          />
        ))}
      </div>

      {/* Payment History Section */}
      {user && (
        <div className="mt-16">
          <PaymentHistory
            payments={payments}
            onViewInvoice={(payment) => setSelectedInvoice(payment)}
          />
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <InvoiceModal
          payment={selectedInvoice}
          user={user}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
