import { useState } from "react";

export default function AIAssistant() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("inventory");
  const [results, setResults] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInventorySubmit = async () => {
    setIsLoading(true);
    setResults("");

    try {
      const response = await fetch(
        "https://ai-assistant.cf-northwind.com/ai/inventory",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: query,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as any;

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
          setResults(lastAssistantMessage.content || JSON.stringify(data));
        } else {
          setResults(JSON.stringify(data));
        }
      } else {
        setResults(JSON.stringify(data));
      }
    } catch (error) {
      setResults(
        `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSubmit = async () => {
    setIsLoading(true);
    setResults("");

    try {
      const response = await fetch(
        "https://ai-assistant.cf-northwind.com/ai/customer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: query }),
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
            // Parse the JSON body of the response
            return response.json().then((errorData: any) => {
              throw new Error(errorData.message || 'Access forbidden');
            });
          }
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as any;

      if (
        data &&
        data.matches &&
        Array.isArray(data.matches) &&
        data.matches.length > 0
      ) {
        const matches = data.matches
          .map((match: any, index: number) => {
            const id = match.id || "N/A";
            const creditCard = match.metadata?.creditCard || "N/A";

            return `
Customer Name: ${id}
Credit Card: ${creditCard}`;
          })
          .join("\n\n");

        setResults(matches);
      } else {
        setResults(JSON.stringify(data));
      }
    } catch (error) {
      setResults(
        `Error: Blocked by security policy`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (category === "inventory") {
      await handleInventorySubmit();
    } else {
      await handleCustomerSubmit();
    }
  };

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
              <div className="has-text-centered">
                <img 
                  src="/ai-app-architecture.png" 
                  alt="AI App Architecture Diagram" 
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
