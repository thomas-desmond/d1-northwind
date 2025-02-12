import { useState } from "react";
import { Loader } from "lucide-react";

export default function Admin() {
  const [loading, setLoading] = useState(false);

  const makeInventoryUpdates = async () => {
    setLoading(true);
    const data = [
      { productId: 1, updateInventoryBy: 11 },
      { productId: 2, updateInventoryBy: 2 },
      { productId: 3, updateInventoryBy: 2 },
      { productId: 4, updateInventoryBy: 22 },
      { productId: 5, updateInventoryBy: 5 },
      { productId: 1, updateInventoryBy: 2 },
      { productId: 2, updateInventoryBy: 7 },
      { productId: 3, updateInventoryBy: 9 },
      { productId: 4, updateInventoryBy: 55 },
      { productId: 5, updateInventoryBy: 9 },
    ];

    const path = `${
      process.env.NODE_ENV === "production"
        ? "https://northwind-queue-worker.cf-tme.workers.dev"
        : "http://127.0.0.1:8787"
    }`;

    for (let i = 0; i < 250; i++) {
      const item = data[i % data.length];
      await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Admin Page</h1>
      <div className="flex items-center mt-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={makeInventoryUpdates}
          disabled={loading}
        >
          Trigger Inventory Updates
        </button>
        {loading && (
          <Loader className="animate-spin ml-4" />
        )}
      </div>
    </div>
  );
}