# Cloudflare WAF and Firewall for AI Protection Architecture

This diagram illustrates how Cloudflare's Web Application Firewall (WAF) and Firewall for AI provide security protection for incoming traffic from various client types, routing to different Cloudflare services and external origins.

```mermaid
graph TB
    %% Client Sources
    subgraph "Client Sources"
        ReactApp["🌐 React Web App"]
        MobileApp["📱 Mobile App"]
        APIClient["🔧 API Client"]
        Bot["🤖 Bot/Crawler"]
        ThirdParty["🏢 Third-party Service"]
    end

    %% Cloudflare Edge
    subgraph "Cloudflare Edge"
        DNS["☁️ Cloudflare DNS"]
        CDN["🚀 Cloudflare CDN"]
        
        subgraph "Security Layer"
            WAF["🛡️ Web Application Firewall (WAF)"]
            FWAI["🧠 Firewall for AI"]
            DDoS["⚡ DDoS Protection"]
            BotMgmt["🤖 Bot Management"]
        end
        
        subgraph "Traffic Analysis"
            APIShield["🔒 API Shield"]
            Analytics["📊 Security Analytics"]
        end
    end

    %% Cloudflare Services
    subgraph "Cloudflare Services"
        subgraph "Compute"
            Worker["⚙️ Cloudflare Worker"]
            Agent["🤖 AI Agent"]
            Pages["📄 Cloudflare Pages"]
        end
        
        subgraph "Storage & Data"
            D1["🗄️ D1 Database"]
            R2["📦 R2 Storage"]
            KV["🔑 Workers KV"]
        end
        
        subgraph "AI Services"
            AIGateway["🚪 AI Gateway"]
            LLM["🧠 LLM Models"]
        end
    end

    %% External Services
    subgraph "External Origins"
        ExternalAPI["🌍 External API"]
        Database["🗃️ External Database"]
        Microservice["🔧 Microservice"]
    end

    %% Traffic Flow
    ReactApp --> DNS
    MobileApp --> DNS
    APIClient --> DNS
    Bot --> DNS
    ThirdParty --> DNS

    DNS --> CDN
    CDN --> WAF

    %% Security Processing
    WAF --> |"HTTP/HTTPS Traffic"| FWAI
    WAF --> |"All Traffic"| DDoS
    WAF --> |"Suspicious Traffic"| BotMgmt
    
    FWAI --> |"AI/LLM Requests"| APIShield
    WAF --> |"API Traffic"| APIShield
    
    APIShield --> Analytics
    FWAI --> Analytics
    WAF --> Analytics

    %% Routing to Services
    APIShield --> |"Allowed Traffic"| Worker
    APIShield --> |"AI Agent Requests"| Agent
    APIShield --> |"Static Content"| Pages
    
    Worker --> D1
    Worker --> R2
    Worker --> KV
    Worker --> ExternalAPI
    
    Agent --> AIGateway
    Agent --> D1
    AIGateway --> LLM
    
    Worker --> Database
    Worker --> Microservice

    %% Blocked Traffic
    WAF -.-> |"❌ Blocked"| BlockedTraffic["🚫 Malicious Traffic<br/>• SQL Injection<br/>• XSS Attacks<br/>• Rate Limit Exceeded"]
    FWAI -.-> |"❌ Blocked"| BlockedAI["🚫 Blocked AI Traffic<br/>• PII Detection<br/>• Prompt Injection<br/>• Sensitive Data"]
    BotMgmt -.-> |"❌ Blocked"| BlockedBots["🚫 Blocked Bots<br/>• Malicious Crawlers<br/>• Scrapers<br/>• Automated Attacks"]

    %% Styling
    classDef clientStyle fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef securityStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef serviceStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef externalStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef blockedStyle fill:#ffebee,stroke:#c62828,stroke-width:2px,stroke-dasharray: 5 5

    class ReactApp,MobileApp,APIClient,Bot,ThirdParty clientStyle
    class WAF,FWAI,DDoS,BotMgmt,APIShield,Analytics securityStyle
    class Worker,Agent,Pages,D1,R2,KV,AIGateway,LLM serviceStyle
    class ExternalAPI,Database,Microservice externalStyle
    class BlockedTraffic,BlockedAI,BlockedBots blockedStyle