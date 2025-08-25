graph TB
    subgraph "Client Side"
        Frontend[React Frontend<br/>ai-agent/src/app.tsx<br/>🌐 Browser]
    end
    
    subgraph "Cloudflare Edge"
        Agent[AI Chat Agent<br/>Chat Class<br/>🔧 Cloudflare Worker]
        Proxy[LLM Proxy<br/>Request Logger & Router<br/>🔧 Cloudflare Worker]
        DO[Durable Objects<br/>Message Storage<br/>💾 Cloudflare]
    end
    
    subgraph "External Services"
        Mistral[Mistral AI API<br/>ministral-3b-latest<br/>🤖 api.mistral.ai]
        Database[(Northwind Database<br/>D1 Database<br/>📊 Cloudflare)]
    end
    
    Frontend -->|WebSocket/HTTP| Agent
    Agent -->|Store Messages| DO
    Agent -->|Query Data| Database
    Agent -->|LLM Requests| Proxy
    Proxy -->|Proxied Requests<br/>/v1/* path| Mistral
    
    classDef cloudflare fill:#f96,stroke:#333,stroke-width:2px,color:#fff
    classDef external fill:#e1f5fe,stroke:#333,stroke-width:2px
    classDef client fill:#f3e5f5,stroke:#333,stroke-width:2px
    
    class Agent,Proxy,DO,Database cloudflare
    class Mistral external
    class Frontend client