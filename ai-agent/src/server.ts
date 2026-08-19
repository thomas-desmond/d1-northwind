import { routeAgentRequest, type Schedule } from "agents";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import { wrapAISDK } from "agents/observability/ai";
import * as ai from "ai";
import { generateId } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createTools } from "./tools";

const { streamText, convertToModelMessages, stepCountIs } = wrapAISDK(ai, {
  storeMessages: true,
  storeTools: true,
});

function createModel(apiKey: string) {
  const openaiWithProxy = createOpenAI({
    apiKey,
    baseURL:
      "https://gateway.ai.cloudflare.com/v1/d6850012d250c1600028b55d1d879b16/northwind-agent-gateway/openai",
  });
  return openaiWithProxy("gpt-4o-2024-11-20");
}

export class Chat extends AIChatAgent<Env> {
  async onChatMessage(_onFinish: unknown, options?: OnChatMessageOptions) {
    const allTools = {
      ...createTools(this.env),
      ...this.mcp.getAITools(),
    };

    const result = streamText({
      model: createModel(this.env.OPENAI_API_KEY),
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
    const url = new URL(request.url);

    if (url.pathname === "/check-open-ai-key") {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      return Response.json({
        success: hasOpenAIKey,
      });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "OPENAI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
