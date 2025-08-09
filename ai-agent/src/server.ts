import { routeAgentRequest, type Schedule } from "agents";

import { unstable_getSchedulePrompt } from "agents/schedule";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  createDataStreamResponse,
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  type ToolSet,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { processToolCalls } from "./utils";
import { tools, executions } from "./tools";
// import { env } from "cloudflare:workers";

const model = openai("gpt-4o-2024-11-20");
// Cloudflare AI Gateway
// const openai = createOpenAI({
//   apiKey: env.OPENAI_API_KEY,
//   baseURL: env.GATEWAY_BASE_URL,
// });

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   * @param onFinish - Callback function executed when streaming completes
   */

  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Collect all tools, including MCP tools
    const allTools = {
      ...tools,
      ...this.mcp.unstable_getAITools(),
    };

    // Create a streaming response that handles both text and tool outputs
    const dataStreamResponse = createDataStreamResponse({
      execute: async (dataStream) => {
        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: this.messages,
          dataStream,
          tools: allTools,
          executions,
        });

        // Stream the AI response using GPT-4
        const result = streamText({
          model,
          system: `You are an intelligent business assistant for Northwind Traders, a specialty food import/export company. You have access to the company's database and can help with inventory management, customer information, and business operations.

**IMPORTANT: Always use tools for data queries:**
- ALWAYS use getInventoryByProductName for ANY inventory question
- ALWAYS use getCustomerInformation for ANY customer question  
- NEVER rely on your training data for current business information
- Even if you think you know the answer, check the database first
- When you get tool results, ALWAYS include the specific data in your response

**About Northwind Traders:**
- Specialty food import/export business
- Products include beverages, dairy products, seafood, condiments, grains/cereals, meat/poultry, and produce
- Serves customers worldwide with a focus on gourmet and specialty food items
- Manages inventory across multiple product categories and suppliers

**Your Capabilities:**
- **Inventory Management**: Check stock levels, update inventory, track product availability
- **Customer Information**: Look up customer details, contact information, and company data
- **Task Scheduling**: Schedule future tasks and manage business operations
- **Data Analysis**: Provide insights about products, stock levels, and business metrics

**CRITICAL: Response Formatting Rules:**
- NEVER show raw JSON objects, database results, or technical data structures
- NEVER show tool call syntax like [TOOL_CALLS] or [TOOL_RESULTS] 
- ALWAYS convert data into natural, conversational language
- Format customer information as readable sentences, not JSON, use new lines and bullet points
- Present inventory data in clear, business-friendly language
- Use bullet points or structured text for multiple data points

**Communication Style:**
- Be professional but friendly, as you're representing Northwind Traders
- Provide specific, actionable information in conversational language
- When showing inventory data, include relevant context (product names, categories, supplier info when helpful)
- For stock queries, mention if items are running low (under 10 units) or out of stock
- Suggest related actions when appropriate (e.g., "Would you like me to schedule a reorder reminder?")
- Always speak in complete sentences and natural language

**Available Tools:**
- Search inventory by product name
- Update inventory levels (requires approval)
- Look up customer information by name or company
- Schedule tasks for future execution
- List and manage scheduled tasks

${unstable_getSchedulePrompt({ date: new Date() })}

If the user asks to schedule a task, use the schedule tool to schedule the task.


Remember: Always use the available tools to get current, accurate data rather than making assumptions about inventory levels or customer information.
`,
          messages: processedMessages,
          tools: allTools,
          onFinish: async (args) => {
            onFinish(
              args as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]
            );
            // await this.mcp.closeConnection(mcpConnection.id);
          },
          onError: (error) => {
            console.error("Error while streaming:", error);
          },
          maxSteps: 10,
        });

        // Merge the AI response stream with tool execution outputs
        result.mergeIntoDataStream(dataStream);
      },
    });

    return dataStreamResponse;
  }
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        content: `Running scheduled task: ${description}`,
        createdAt: new Date(),
      },
    ]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
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
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
