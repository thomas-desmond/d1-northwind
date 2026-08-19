import { useState } from "react";
import { Robot, CaretDown } from "@phosphor-icons/react";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Tooltip } from "@/components/tooltip/Tooltip";

interface ToolInvocationCardProps {
  part: UIMessage["parts"][number];
  addToolApprovalResponse: (response: {
    id: string;
    approved: boolean;
  }) => void;
}

export function ToolInvocationCard({
  part,
  addToolApprovalResponse,
}: ToolInvocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isToolUIPart(part)) return null;

  const toolName = getToolName(part);
  const needsConfirmation = part.state === "approval-requested";
  const isComplete = part.state === "output-available";
  const approvalId =
    "approval" in part
      ? (part.approval as { id?: string } | undefined)?.id
      : undefined;
  const input = "input" in part ? part.input : undefined;
  const output = "output" in part ? part.output : undefined;

  return (
    <Card
      className={`p-4 my-3 w-full max-w-[500px] rounded-md bg-neutral-100 dark:bg-neutral-900 ${
        needsConfirmation ? "" : "border-[#F48120]/30"
      } overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 cursor-pointer"
      >
        <div
          className={`${needsConfirmation ? "bg-[#F48120]/10" : "bg-[#F48120]/5"} p-1.5 rounded-full flex-shrink-0`}
        >
          <Robot size={16} className="text-[#F48120]" />
        </div>
        <h4 className="font-medium flex items-center gap-2 flex-1 text-left">
          {toolName}
          {!needsConfirmation && isComplete && (
            <span className="text-xs text-[#F48120]/70">✓ Completed</span>
          )}
        </h4>
        <CaretDown
          size={16}
          className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`transition-all duration-200 ${isExpanded ? "max-h-[200px] opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <div
          className="overflow-y-auto"
          style={{ maxHeight: isExpanded ? "180px" : "0px" }}
        >
          {input !== undefined && (
            <div className="mb-3">
              <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                Arguments:
              </h5>
              <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}

          {needsConfirmation && approvalId && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  addToolApprovalResponse({
                    id: approvalId,
                    approved: false,
                  })
                }
              >
                Reject
              </Button>
              <Tooltip content={"Accept action"}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    addToolApprovalResponse({
                      id: approvalId,
                      approved: true,
                    })
                  }
                >
                  Approve
                </Button>
              </Tooltip>
            </div>
          )}

          {isComplete && (
            <div className="mt-3 border-t border-[#F48120]/10 pt-3">
              <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                Result:
              </h5>
              <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
