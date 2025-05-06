export default function Index() {
  return (
    <>
      <div className="pb-8">
        <h1 className="text-3xl font-bold">Welcome to Northwind Traders</h1>
        <p className="text-lg text-gray-500 pt-1">Cloudflare-powered analytics demo for the Northwind dataset</p>
      </div>
      <div className="bg-gray-50 rounded-lg shadow-md mb-6 p-6">
        <h2 className="text-xl font-semibold pb-2">Architecture Overview</h2>
        <ul className="list-disc list-inside text-base text-gray-700 mb-2">
          <li><span className="font-medium">Frontend:</span> Remix, hosted on Cloudflare Workers</li>
          <li><span className="font-medium">API Layer:</span> Cloudflare Worker</li>
          <li><span className="font-medium">Backend Services:</span>
            <ul className="list-disc list-inside ml-6">
              <li><span className="font-medium">D1:</span> SQL database for transactional data</li>
              <li><span className="font-medium">KV:</span> Key-Value store for fast lookups and caching</li>
              <li><span className="font-medium">Vectorize:</span> Vector database for semantic search and AI features</li>
            </ul>
          </li>
        </ul>
      </div>
      <div className="flex flex-col min-w-full items-center mb-2">
        <img
          alt="Northwind Reference Architecture"
          className="object-scale-down w-full max-w-4xl bg-white rounded-lg p-4"
          src="https://imagedelivery.net/llMDWXFPgX44M9elMfQ9XA/95ff22b1-b3ef-43ff-aaa8-d8cfb34ff900/public"
        />
        <span className="text-sm text-gray-400 pt-2">Reference architecture: Remix + Workers + D1 + KV + Vectorize</span>
      </div>
      <div className="pb-4">
        <p className="text-base text-gray-700">
          This demo uses the Northwind dataset, running on <a className="link" href="https://workers.cloudflare.com/" target="_new">Cloudflare Workers</a> and <a className="link" href="https://blog.cloudflare.com/d1-turning-it-up-to-11/" target="_new">D1</a> (Cloudflare's Serverless DB). Dataset sourced from <a className="link" href="https://github.com/jpwhite3/northwind-SQLite3" target="_new">northwind-SQLite3</a>.
        </p>
      </div>
    </>
  )
}
