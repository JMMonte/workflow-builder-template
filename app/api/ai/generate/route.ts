import { streamText } from "ai";
import { NextResponse } from "next/server";
import { buildWorkflowSystemPrompt } from "@/lib/ai/workflow-context";
import { auth } from "@/lib/auth";

// Simple type for operations
type Operation = {
  op:
    | "setName"
    | "setDescription"
    | "addNode"
    | "addEdge"
    | "removeNode"
    | "removeEdge"
    | "updateNode"
    | "setAssistantMessage";
  name?: string;
  description?: string;
  node?: unknown;
  edge?: unknown;
  nodeId?: string;
  edgeId?: string;
  message?: string;
  updates?: {
    position?: { x: number; y: number };
    data?: unknown;
  };
};

function encodeMessage(encoder: TextEncoder, message: object): Uint8Array {
  return encoder.encode(`${JSON.stringify(message)}\n`);
}

function shouldSkipLine(line: string): boolean {
  const trimmed = line.trim();
  return !trimmed || trimmed.startsWith("```");
}

function tryParseAndEnqueueOperation(
  line: string,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  operationCount: number
): number {
  const trimmed = line.trim();

  if (shouldSkipLine(line)) {
    return operationCount;
  }

  try {
    const operation = JSON.parse(trimmed) as Operation;
    const newCount = operationCount + 1;

    console.log(`[API] Operation ${newCount}:`, operation.op);

    controller.enqueue(
      encodeMessage(encoder, {
        type: "operation",
        operation,
      })
    );

    return newCount;
  } catch {
    console.warn("[API] Skipping invalid JSON line:", trimmed.substring(0, 50));
    return operationCount;
  }
}

function processBufferLines(
  buffer: string,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  operationCount: number
): { remainingBuffer: string; newOperationCount: number } {
  const lines = buffer.split("\n");
  const remainingBuffer = lines.pop() || "";
  let newOperationCount = operationCount;

  for (const line of lines) {
    newOperationCount = tryParseAndEnqueueOperation(
      line,
      encoder,
      controller,
      newOperationCount
    );
  }

  return { remainingBuffer, newOperationCount };
}

async function processOperationStream(
  textStream: AsyncIterable<string>,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController
): Promise<void> {
  let buffer = "";
  let operationCount = 0;
  let chunkCount = 0;

  for await (const chunk of textStream) {
    chunkCount += 1;
    buffer += chunk;

    const result = processBufferLines(
      buffer,
      encoder,
      controller,
      operationCount
    );
    buffer = result.remainingBuffer;
    operationCount = result.newOperationCount;
  }

  // Process any remaining buffer content
  operationCount = tryParseAndEnqueueOperation(
    buffer,
    encoder,
    controller,
    operationCount
  );

  console.log(
    `[API] Stream complete. Chunks: ${chunkCount}, Operations: ${operationCount}`
  );

  // Send completion
  controller.enqueue(
    encodeMessage(encoder, {
      type: "complete",
    })
  );
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, conversationHistory = [], existingWorkflow } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "AI API key not configured on server. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Build the user prompt
    let userPrompt = prompt;
    if (existingWorkflow) {
      // Identify nodes and their labels for context
      const nodesList = (existingWorkflow.nodes || [])
        .map(
          (n: { id: string; data?: { label?: string } }) =>
            `- ${n.id} (${n.data?.label || "Unlabeled"})`
        )
        .join("\n");

      const edgesList = (existingWorkflow.edges || [])
        .map(
          (e: { id: string; source: string; target: string }) =>
            `- ${e.id}: ${e.source} -> ${e.target}`
        )
        .join("\n");

      userPrompt = `I have an existing workflow. I want you to make ONLY the changes I request.

Current workflow nodes:
${nodesList}

Current workflow edges:
${edgesList}

Full workflow data (DO NOT recreate these, they already exist):
${JSON.stringify(existingWorkflow, null, 2)}

User's request: ${prompt}

Start by outputting {"op": "setAssistantMessage", "message": "Short summary of what you will change or any blockers"} so the user sees your plan.

IMPORTANT: Output ONLY the operations needed to make the requested changes.
- Allowed operations: setAssistantMessage, setName, setDescription, addNode, addEdge, removeNode, removeEdge, updateNode
- If adding new nodes: output "addNode" operations for NEW nodes only, then IMMEDIATELY output "addEdge" operations to connect them to the workflow
- If adding new edges: output "addEdge" operations for NEW edges only  
- If removing nodes: output "removeNode" operations with the nodeId to remove
- If removing edges: output "removeEdge" operations with the edgeId to remove
- If changing name/description: output "setName"/"setDescription" only if changed
- When changing details inside an existing card, use "updateNode" with the FULL data/config payload so required fields stay intact. Keep triggerType/actionType and all existing config keys unless the user explicitly says to remove them. For HTTP Request nodes include httpMethod, endpoint, httpHeaders, and httpBody. For Content Card nodes include cardType, cardPrompt, imageSourceType, and imageUrl/imageBase64 when applicable.
- Preserve template variables like {{NodeLabel.field}} in all configs. Do NOT replace them with static text unless the user explicitly asks.
- CRITICAL: New nodes MUST be connected with edges - always add edges after adding nodes
- When connecting nodes, look at the node IDs in the current workflow list above
- DO NOT output operations for existing nodes/edges unless specifically modifying them
- Keep the existing workflow structure and only add/modify/remove what was requested

Example: If user says "connect node A to node B", output:
{"op": "addEdge", "edge": {"id": "e-new", "source": "A", "target": "B", "type": "default"}}`;
    }

    // Build messages array from conversation history
    const messages = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: userPrompt },
    ];

    const result = streamText({
      model: "gpt-4-turbo",
      system: buildWorkflowSystemPrompt(),
      messages,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await processOperationStream(result.textStream, encoder, controller);
          controller.close();
        } catch (error) {
          controller.enqueue(
            encodeMessage(encoder, {
              type: "error",
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to generate workflow",
            })
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to generate workflow:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate workflow",
      },
      { status: 500 }
    );
  }
}
