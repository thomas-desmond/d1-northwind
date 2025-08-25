graph TB
    subgraph "Security Layers"
        WAF[🛡️Cloudflare WAF & Firewall for AI <hr><br/> HTTP Traffic Now <br/> Websocket Traffic future]
        Gateway[🛡️AI Gateway<br/> LLM Protection]
    end
    
    subgraph "Client Side"
        Frontend[React Frontend<br/>ai-agent/src/app.tsx<br/>🌐 Browser]
    end
    
    subgraph "Cloudflare Edge"
        Agent[AI Chat Agent<br/>Chat Class + Business Tools<br/>🔧 Cloudflare Worker]
        DO[Durable Objects<br/>Message Storage<br/>💾 Cloudflare]
        Database[(Northwind Database<br/>D1 Database<br/>📊 Cloudflare)]
    end

    subgraph "External Services"
        Mistral[OpenAI<br/>gpt-4o-2024-11-20<br/>🤖]
    end
    
    Frontend --> WAF
    WAF --> Agent
    Agent -->|Store Messages| DO
    Agent -->|Query Business Data| Database
    Agent -->|Business Operations<br/>• Inventory Queries<br/>• Customer Lookup<br/>• Task Scheduling| Database
    Agent --> Gateway
    Gateway -->  Mistral
    
    classDef security fill:#ffcdd2,stroke:#333,stroke-width:2px
    classDef cloudflare fill:#f96,stroke:#333,stroke-width:2px,color:#fff
    classDef external fill:#e1f5fe,stroke:#333,stroke-width:2px
    classDef client fill:#f3e5f5,stroke:#333,stroke-width:2px
    
    class WAF,Shield,Gateway security
    class Agent,Proxy,DO,Database cloudflare
    class WorkersAI cloudflare
    class Frontend client