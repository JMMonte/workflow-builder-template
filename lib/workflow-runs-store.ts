import { atom } from "jotai";
import type { WorkflowRun } from "./workflow-run";

/**
 * Centralized workflow runs state management
 */

// Current workflow runs (persists across component unmounts)
export const currentWorkflowRunsAtom = atom<WorkflowRun[]>([]);

// Loading state for runs
export const runsLoadingAtom = atom(false);

// Track last loaded workflow ID to prevent unnecessary reloads
export const lastLoadedWorkflowIdAtom = atom<string | null>(null);

// Polling enabled/disabled
export const runsPollingEnabledAtom = atom(false);
