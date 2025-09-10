import { useState } from "react";
import type { ActionFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useFetcher } from "@remix-run/react";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const category = formData.get("category") as string;
  const query = formData.get("query") as string;

  try {
    let url: string;
    let body: any;

    if (category === "inventory") {
      url = "https://ai-assistant.cf-northwind.com/ai/inventory";
      body = JSON.stringify({
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
      });
    } else {
      url = "https://ai-assistant.cf-northwind.com/ai/customer";
      body = JSON.stringify({ prompt: query });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      console.log("RESPONSE not okay")
      if (response.status === 403) {
        console.log("RESPONSE 403")
        // Try to parse the error response
        try {
          console.log("RESPONSE ",response)
          const errorData = await response.json();
          console.log("ERRORRRORORRR",errorData)
          return json(
            { 
              success: false, 
              error: "blocked_by_security", 
              message: errorData.message || "Request blocked by security policy" 
            },
            { status: 403 }
          );
        } catch {
          return json(
            { 
              success: false, 
              error: "blocked_by_security", 
              message: "Request blocked by security policy" 
            },
            { status: 403 }
          );
        }
      }
      return json(
        { success: false, error: "http_error", message: `HTTP error! status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return json({ success: true, data });
  } catch (error) {
    return json(
      { 
        success: false, 
        error: "network_error", 
        message: error instanceof Error ? error.message : "Network error occurred" 
      },
      { status: 500 }
    );
  }
};

export default function AIAssistant() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("inventory");
  const [results, setResults] = useState("");
  const fetcher = useFetcher();

  const isLoading = fetcher.state === "submitting";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const formData = new FormData();
    formData.append("category", category);
    formData.append("query", query);

    fetcher.submit(formData, { method: "post" });
  };

  // Handle the response from the action
  if (fetcher.data && fetcher.state === "idle") {
    const response = fetcher.data as any;
    
    if (!response.success) {
      if (response.error === "blocked_by_security") {
        if (results !== `Security Policy Block: ${response.message}`) {
          setResults(`Security Policy Block: ${response.message}`);
        }
      } else {
        if (results !== `Error: ${response.message}`) {
          setResults(`Error: ${response.message}`);
        }
      }
    } else {
      // Process successful response
      const data = response.data;
      let newResults = "";

      if (category === "inventory") {
        // Extract content from the last assistant message
        if (
          data &&
          data.messages &&
          Array.isArray(data.messages) &&
          data.messages.length > 0
        ) {
          const assistantMessages = data.messages.filter(
            (msg: any) => msg.role === "assistant"
          );
          if (assistantMessages.length > 0) {
            const lastAssistantMessage =
              assistantMessages[assistantMessages.length - 1];
            newResults = lastAssistantMessage.content || JSON.stringify(data);
          }
        }
      } else {
        // Customer data processing
        if (data && data.response && typeof data.response === 'string') {
          // Handle hardcoded response strings
          newResults = data.response;
        } else if (data && data.customers && Array.isArray(data.customers)) {
          // Handle hardcoded customers array
          const customerList = data.customers
            .map((customer: any) => {
              let result = `Company: ${customer.CompanyName || "N/A"}`;
              if (customer.ContactName) result += `\nContact: ${customer.ContactName}`;
              if (customer.ContactTitle) result += `\nTitle: ${customer.ContactTitle}`;
              if (customer.Phone) result += `\nPhone: ${customer.Phone}`;
              if (customer.City && customer.Country) result += `\nLocation: ${customer.City}, ${customer.Country}`;
              return result;
            })
            .join("\n\n");
          newResults = customerList;
        } else if (
          data &&
          data.matches &&
          Array.isArray(data.matches) &&
          data.matches.length > 0
        ) {
          // Handle original vectorize matches format
          const matches = data.matches
            .map((match: any, index: number) => {
              const companyName = match.metadata?.companyName || "N/A";
              const creditCard = match.metadata?.creditCard;
              const yearlySpend = match.metadata?.yearlySpend;

              let result = `
Company Name: ${companyName}`;

              if (creditCard) {
                result += `
Credit Card: ${creditCard}`;
              } else if (yearlySpend) {
                result += `
Yearly Spend: ${yearlySpend}`;
              }

              return result;
            })
            .join("\n\n");

          newResults = matches;
        } 
      }

      if (results !== newResults) {
        setResults(newResults);
      }
    }
  }

  return (
    <div className="tile is-ancestor">
      <div className="tile is-vertical">
        {/* Input Section */}
        <div className="tile is-parent">
          <div className="card tile is-child">
            <header className="card-header">
              <p className="card-header-title">
                <span className="icon material-icons">smart_toy</span>
                AI Assistant
              </p>
            </header>
            <div className="card-content">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label className="label">Category</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="inventory">Inventory</option>
                        <option value="customer">Customer</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label className="label">Your Request</label>
                  <div className="control">
                    <textarea
                      className="textarea"
                      placeholder="Ask me anything about your inventory or customers..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="field">
                  <div className="control">
                    <button
                      type="submit"
                      className={`button is-primary ${
                        isLoading ? "is-loading" : ""
                      }`}
                      disabled={isLoading || !query.trim()}
                    >
                      <span className="icon">
                        <span className="material-icons">send</span>
                      </span>
                      <span>Send Request</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(results || isLoading) && (
          <div className="tile is-parent">
            <div className="card tile is-child">
              <header className="card-header">
                <p className="card-header-title">
                  <span className="icon material-icons">psychology</span>
                  AI Response
                </p>
              </header>
              <div className="card-content">
                {isLoading ? (
                  <div className="has-text-centered">
                    <div className="loader"></div>
                    <p className="mt-3">Processing your request...</p>
                  </div>
                ) : (
                  <div className="content">
                    <pre
                      className="has-background-light p-4"
                      style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                    >
                      {results}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Architecture Diagram Section */}
        <div className="tile is-parent mt-6">
          <div className="card tile is-child">
            <header className="card-header">
              <p className="card-header-title">
                <span className="icon material-icons">architecture</span>
                AI App Architecture
              </p>
            </header>
            <div className="card-content">
              <div className="has-text-centered max-w-6xl">
                <img
                  src="/ai-app-architecture.png"
                  alt="AI App Architecture Diagram"
                  style={{ maxWidth: "auto", height: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
