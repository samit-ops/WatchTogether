import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { usePrefersReducedMotion } from '@/components/motion';

const PLAN_RANKS = {
  Free: 0,
  Bronze: 1,
  Silver: 2,
  Gold: 3
};

const PLAN_ICONS = {
  Free: Zap,
  Bronze: Shield,
  Silver: Sparkles,
  Gold: Crown
};

export function SubscriptionCard({ plan, currentPlan, onSelect, loadingPlan }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const currentRank = PLAN_RANKS[currentPlan || 'Free'] || 0;
  const cardRank = PLAN_RANKS[plan.name] || 0;

  const isCurrent = currentPlan === plan.name;
  const isLower = cardRank < currentRank;
  const Icon = PLAN_ICONS[plan.name] || Sparkles;

  const isPopular = plan.name === 'Silver';

  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div;
  const motionProps = prefersReducedMotion ? {} : {
    whileHover: { scale: 1.015, y: -3 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.3, ease: [0.25, 0.4, 0, 1] },
  };

  return (
    <MotionWrapper
      {...motionProps}
      className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 card-hover ${
        isPopular
          ? 'glass-card border-2 border-primary shadow-2xl z-10 glow-primary'
          : 'glass-card border border-border shadow-lg'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Most Popular
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCurrent ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-primary'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text">{plan.name}</h3>
              <span className="text-xs text-muted font-medium">{plan.quality || 'Standard'}</span>
            </div>
          </div>

          {isCurrent && (
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
              Active Plan
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="mb-6 pb-6 border-b border-border/60">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-text">₹{plan.price}</span>
            <span className="text-muted text-sm font-medium">/month</span>
          </div>
          <p className="text-xs text-muted mt-1">
            {plan.price === 0 ? 'Forever Free' : 'Billed monthly. Cancel anytime.'}
          </p>
        </div>

        {/* Features List */}
        <ul className="space-y-3 mb-8 text-sm">
          {plan.features?.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-text/90">
              <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center mt-0.5 shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <div>
        {isCurrent ? (
          <button
            disabled
            className="w-full py-3 bg-surface-light border border-border text-muted font-semibold text-sm rounded-xl cursor-default opacity-80"
          >
            Current Plan
          </button>
        ) : isLower ? (
          <button
            disabled
            className="w-full py-3 bg-surface-light border border-border text-muted/60 font-semibold text-xs rounded-xl cursor-not-allowed"
            title="Your current subscription is higher"
          >
            Current plan is higher
          </button>
        ) : (
          <MagneticButton
            as="button"
            onClick={() => onSelect(plan)}
            disabled={loadingPlan === plan.name}
            className="w-full py-3 btn-gradient font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            strength={0.1}
          >
            <span>{loadingPlan === plan.name ? 'Processing...' : `Upgrade to ${plan.name}`}</span>
          </MagneticButton>
        )}
      </div>
    </MotionWrapper>
  );
}
