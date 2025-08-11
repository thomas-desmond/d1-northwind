sequenceDiagram
    participant Client
    participant AgentWorker as Agent Worker<br/>(Chat Class)
    participant LLMProxy as LLM Proxy Worker<br/>(+ Firewall for AI)
    participant LLM as Mistral API
    participant Tools as Tools<br/>(DB/APIs)

    Note over Client, Tools: AI Agent Tool Calling Flow with Security

    Client->>AgentWorker: User message (via WebSocket)
    
    AgentWorker->>AgentWorker: onChatMessage() triggered
    
    rect rgb(255, 240, 240)
        Note over AgentWorker: 🔥 INITIAL PROMPT CREATION
        AgentWorker->>AgentWorker: streamText() with system prompt,<br/>user message, and available tools
    end
    
    AgentWorker->>LLMProxy: POST /chat/completions
    Note over LLMProxy: Firewall for AI inspection + proxy to Mistral
    LLMProxy->>LLM: Forward to Mistral API
    
    LLM-->>AgentWorker: "I need to call getInventoryByProductName"
    
    AgentWorker->>Tools: Execute tool with args
    Tools-->>AgentWorker: Return inventory data
    
    rect rgb(240, 255, 240)
        Note over AgentWorker: 🔥 TOOL RESULT PROMPT
        Note over AgentWorker: AI SDK adds tool result to conversation<br/>and continues automatically (maxSteps: 10)
    end
    
    loop Multi-step tool calling (as needed)
        AgentWorker->>LLMProxy: POST with updated conversation
        Note over LLMProxy: Firewall for AI inspection on EVERY request
        LLMProxy->>LLM: Forward request
        LLM-->>AgentWorker: Response (final answer or more tool calls)
        opt More tools needed
            AgentWorker->>Tools: Execute additional tools
            Tools-->>AgentWorker: Tool results
        end
    end
    
    AgentWorker-->>Client: Stream complete response (via WebSocket)