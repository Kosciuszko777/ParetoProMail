import { useCallback, useSyncExternalStore } from 'react';
import type { PlanId } from '@/lib/pricing';

/**
 * Lightweight plan-selection store backed by localStorage.
 *
 * - `pareto:plan:<pubkey>` — the plan the user has chosen (per account)
 * - `pareto:needs-plan`    — set right after a *new* keypair is created, so the
 *                            app can force a visit to the pricing page once.
 *
 * This is purely client-side state (no backend). It drives the mandatory
 * "choose your plan" redirect after signup and the billing dashboard.
 */

const PLAN_PREFIX = 'pareto:plan:';
const NEEDS_PLAN_KEY = 'pareto:needs-plan';

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore
  }
  emit();
}

/** Mark that a freshly created account still needs to choose a plan. */
export function markNeedsPlan() {
  write(NEEDS_PLAN_KEY, '1');
}

export function usePlan(pubkey: string | undefined) {
  const planKey = pubkey ? `${PLAN_PREFIX}${pubkey}` : '';

  const selectedPlan = useSyncExternalStore(
    subscribe,
    () => (planKey ? read(planKey) : null),
    () => null,
  ) as PlanId | null;

  const needsPlan = useSyncExternalStore(
    subscribe,
    () => read(NEEDS_PLAN_KEY) === '1',
    () => false,
  );

  const choosePlan = useCallback(
    (plan: PlanId) => {
      if (planKey) write(planKey, plan);
      write(NEEDS_PLAN_KEY, null); // clear the "needs plan" gate
    },
    [planKey],
  );

  const clearNeedsPlan = useCallback(() => write(NEEDS_PLAN_KEY, null), []);

  return { selectedPlan, needsPlan, choosePlan, clearNeedsPlan };
}
