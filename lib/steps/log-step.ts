/**
 * Logging step for workflow execution tracking
 * Uses regular fetch to send logs to API endpoint
 */
import "server-only";

import type { LogEntryInput } from "@/lib/workflow-run";
import { redactSensitiveData } from "../utils/redact";

// Trim only input payloads aggressively (e.g. huge data URIs) to keep log writes quick
function sanitizeInputPayload(value: unknown, depth = 0): unknown {
  if (depth > 5) {
    return "[TRUNCATED_DEPTH]";
  }

  if (typeof value === "string") {
    const isDataUri = value.startsWith("data:image");
    const isHuge = value.length > 5000;
    if (isDataUri || isHuge) {
      return `[TRUNCATED_STRING length=${value.length}]`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInputPayload(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeInputPayload(val, depth + 1);
    }
    return sanitized;
  }

  return value;
}

// Outputs keep rich data (base64 images) unless astronomically large
function sanitizeOutputPayload(value: unknown, depth = 0): unknown {
  if (depth > 5) {
    return "[TRUNCATED_DEPTH]";
  }

  if (typeof value === "string") {
    if (value.length > 5_000_000) {
      return `[TRUNCATED_STRING length=${value.length}]`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeOutputPayload(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeOutputPayload(val, depth + 1);
    }
    return sanitized;
  }

  return value;
}

export type LogStepInput = LogEntryInput;

export async function logStep(input: LogStepInput): Promise<{
  logId?: string;
  startTime?: number;
  success: boolean;
}> {
  "use step";

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  try {
    // Redact sensitive data from input and output before logging
    const redactedInput = sanitizeInputPayload(
      redactSensitiveData(input.nodeInput)
    );
    const redactedOutput = sanitizeOutputPayload(
      redactSensitiveData(input.output)
    );

    const response = await fetch(`${apiBaseUrl}/api/workflow-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: input.action,
        data: {
          executionId: input.executionId,
          nodeId: input.nodeId,
          nodeName: input.nodeName,
          nodeType: input.nodeType,
          input: redactedInput,
          logId: input.logId,
          startTime: input.startTime,
          status: input.status,
          output: redactedOutput,
          error: input.error,
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return { ...result, success: true };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to log:", error);
    return { success: true };
  }
}
