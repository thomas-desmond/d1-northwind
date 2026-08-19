import { tool } from "ai";
import { z } from "zod";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { scheduleSchema } from "agents/schedule";

export function createTools(env: Env) {
  const getInventoryByProductName = tool({
    description: "Check product stock levels by name",
    inputSchema: z.object({
      name: z.string(),
    }),
    execute: async ({ name }) => {
      return await env.DB.prepare(
        `SELECT UnitsInStock FROM product WHERE ProductName = ?`
      )
        .bind(name)
        .first();
    },
  });

  const updateInventoryByProductName = tool({
    description: "Update the database inventory by product name",
    inputSchema: z.object({
      name: z.string(),
      unitsInStock: z.number(),
    }),
    needsApproval: true,
    execute: async ({ name, unitsInStock }) => {
      return await env.DB.prepare(
        `Update Product Set UnitsInStock = ? WHERE ProductName = ?`
      )
        .bind(unitsInStock, name)
        .all();
    },
  });

  const scheduleTask = tool({
    description: "A tool to schedule a task to be executed at a later time",
    inputSchema: scheduleSchema,
    execute: async ({ when, description }) => {
      const { agent } = getCurrentAgent<Chat>();
      function throwError(msg: string): string {
        throw new Error(msg);
      }
      if (when.type === "no-schedule") {
        return "Not a valid schedule input";
      }
      const input =
        when.type === "scheduled"
          ? when.date
          : when.type === "delayed"
            ? when.delayInSeconds
            : when.type === "cron"
              ? when.cron
              : throwError("not a valid schedule input");
      try {
        agent!.schedule(input!, "executeTask", description);
      } catch (error) {
        console.error("error scheduling task", error);
        return `Error scheduling task: ${error}`;
      }
      return `Task scheduled for type "${when.type}" : ${input}`;
    },
  });

  const getScheduledTasks = tool({
    description: "List all tasks that have been scheduled",
    inputSchema: z.object({}),
    execute: async () => {
      const { agent } = getCurrentAgent<Chat>();
      try {
        const tasks = agent!.getSchedules();
        if (!tasks || tasks.length === 0) {
          return "No scheduled tasks found.";
        }
        return tasks;
      } catch (error) {
        console.error("Error listing scheduled tasks", error);
        return `Error listing scheduled tasks: ${error}`;
      }
    },
  });

  const cancelScheduledTask = tool({
    description: "Cancel a scheduled task using its ID",
    inputSchema: z.object({
      taskId: z.string().describe("The ID of the task to cancel"),
    }),
    execute: async ({ taskId }) => {
      const { agent } = getCurrentAgent<Chat>();
      try {
        await agent!.cancelSchedule(taskId);
        return `Task ${taskId} has been successfully canceled.`;
      } catch (error) {
        console.error("Error canceling scheduled task", error);
        return `Error canceling task ${taskId}: ${error}`;
      }
    },
  });

  return {
    scheduleTask,
    getScheduledTasks,
    cancelScheduledTask,
    updateInventoryByProductName,
    getInventoryByProductName,
  };
}
