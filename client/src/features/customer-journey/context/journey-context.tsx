// ── Journey Context ───────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// React context that wraps the Journey Engine and exposes state + actions
// to any component inside JourneyShell.

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  type JourneyStepId,
  type JourneyStepStatus,
  type JourneyContextValue,
  type JourneyState,
} from "../types";
import { JOURNEY_STEPS } from "../constants";
import {
  createInitialJourneyState,
  applyStepTransition,
  applyActiveStepChange,
  serialiseJourneyState,
  deserialiseJourneyState,
  getNextStep,
} from "../engine/journey-engine";

// ── Storage key ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "qirox_journey_v2";

// ── Reducer ───────────────────────────────────────────────────────────────────

type JourneyAction =
  | { type: "SET_STEP_STATUS"; stepId: JourneyStepId; status: JourneyStepStatus; meta?: Record<string, unknown> }
  | { type: "SET_ACTIVE_STEP"; stepId: JourneyStepId }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: JourneyState }
  /**
   * ADVANCE_STEP — atomically completes/skips the given step and advances the
   * active-step pointer to the next available step, computed from the
   * already-transitioned state. Fixes the pre-transition state bug that caused
   * getNextStep() to see unlocked dependants before they were unlocked.
   */
  | { type: "ADVANCE_STEP"; stepId: JourneyStepId; nextStatus: "completed" | "skipped"; meta?: Record<string, unknown> };

function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case "SET_STEP_STATUS":
      return applyStepTransition(state, action.stepId, action.status, action.meta);
    case "SET_ACTIVE_STEP":
      return applyActiveStepChange(state, action.stepId);
    case "ADVANCE_STEP": {
      // 1. Apply the status transition (unlocks dependants inside)
      const transitioned = applyStepTransition(state, action.stepId, action.nextStatus, action.meta);
      // 2. Compute next step from the post-transition state (dependants now unlocked)
      const next = getNextStep(transitioned);
      // 3. Optionally move the active-step pointer
      return next ? applyActiveStepChange(transitioned, next) : transitioned;
    }
    case "RESET":
      return createInitialJourneyState();
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const JourneyContext = createContext<JourneyContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

interface JourneyProviderProps {
  children: ReactNode;
  /** Optional override: provide server-synced state instead of local storage. */
  initialState?: JourneyState;
}

export function JourneyProvider({ children, initialState }: JourneyProviderProps) {
  const [state, dispatch] = useReducer(
    journeyReducer,
    undefined,
    () => {
      // 1. Use server-provided state if given
      if (initialState) return initialState;
      // 2. Try to rehydrate from sessionStorage
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = deserialiseJourneyState(raw);
          if (parsed) return parsed;
        }
      } catch {
        // sessionStorage not available (SSR / private mode) — proceed
      }
      // 3. Start fresh
      return createInitialJourneyState();
    }
  );

  // Persist to sessionStorage on every state change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, serialiseJourneyState(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const setStepStatus = useCallback(
    (stepId: JourneyStepId, status: JourneyStepStatus, meta?: Record<string, unknown>) => {
      dispatch({ type: "SET_STEP_STATUS", stepId, status, meta });
    },
    []
  );

  const setActiveStep = useCallback((stepId: JourneyStepId) => {
    dispatch({ type: "SET_ACTIVE_STEP", stepId });
  }, []);

  /**
   * advanceCurrentStep — single atomic dispatch.
   * Uses the ADVANCE_STEP reducer action which:
   * 1. Applies applyStepTransition (unlocks dependants)
   * 2. Calls getNextStep on the POST-transition state
   * 3. Updates activeStepId in the same reducer pass
   *
   * This avoids the pre-transition state bug that existed when
   * setStepStatus + setActiveStep were called as two separate dispatches.
   */
  const advanceCurrentStep = useCallback(
    (
      stepId: JourneyStepId,
      nextStatus: "completed" | "skipped" = "completed",
      meta?: Record<string, unknown>
    ) => {
      dispatch({ type: "ADVANCE_STEP", stepId, nextStatus, meta });
    },
    []
  );

  const resetJourney = useCallback(() => {
    dispatch({ type: "RESET" });
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const value = useMemo<JourneyContextValue>(
    () => ({
      state,
      steps:              JOURNEY_STEPS,
      setStepStatus,
      setActiveStep,
      advanceCurrentStep,
      resetJourney,
      isLoading:          false,
    }),
    [state, setStepStatus, setActiveStep, advanceCurrentStep, resetJourney]
  );

  return (
    <JourneyContext.Provider value={value}>
      {children}
    </JourneyContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useJourneyContext(): JourneyContextValue {
  const ctx = useContext(JourneyContext);
  if (!ctx) {
    throw new Error(
      "[JourneyContext] useJourneyContext must be used inside <JourneyProvider>. " +
      "Wrap your component tree with <JourneyShell> or <JourneyProvider>."
    );
  }
  return ctx;
}
