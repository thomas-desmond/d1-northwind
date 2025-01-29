
export default function Admin() {
    const make25InventoryUpdateCalls = async () => {
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
    };
    return (
        <div>
            <h1 className="text-3xl font-bold">Admin Page</h1>
            <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={make25InventoryUpdateCalls}
            >
                Make 250 Calls
            </button>
        </div>
    );
}