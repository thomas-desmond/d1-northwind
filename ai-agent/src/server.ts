import { routeAgentRequest, type Schedule } from "agents";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import { wrapAISDK } from "agents/observability/ai";
import * as ai from "ai";
import { generateId } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { createTools } from "./tools";

const { streamText, convertToModelMessages, stepCountIs } = wrapAISDK(ai, {
  storeMessages: true,
  storeTools: true,
});

export class Chat extends AIChatAgent<Env> {
  async onChatMessage(_onFinish: unknown, options?: OnChatMessageOptions) {
    const allTools = {
      ...createTools(this.env),
      ...this.mcp.getAITools(),
    };
    const workersai = createWorkersAI({ binding: this.env.AI });

    const result = streamText({
      model: workersai("@cf/moonshotai/kimi-k2.7-code", {
        sessionAffinity: this.sessionAffinity,
      }),
      system: `You are a business assistant for Northwind Traders food company. Use available tools to query inventory. Present results in natural language, not raw data formats. Be professional and helpful.`,
      messages: await convertToModelMessages(this.messages),
      tools: allTools,
      stopWhen: stepCountIs(10),
      abortSignal: options?.abortSignal,
      experimental_telemetry: {
        functionId: "northwind-agent",
        metadata: {
          agentId: "northwind-ai-agent",
          conversationId: this.name,
        },
      },
    });

    return result.toUIMessageStreamResponse();
  }

  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`,
          },
        ],
      },
    ]);
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
