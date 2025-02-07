import { createSQLLog, prepareStatements } from "../tools";

const apiSearch = () => {
  return {
    path: "search",
    method: "GET",
    handler: async (request: Request, env: Env) => {
      const startTimeCache = Date.now();

      const { searchParams } = new URL(request.url);
      const q = searchParams.get("q");
      const table = searchParams.get("table");
      const categoryId = searchParams.get("categoryId");
      const sortBy = searchParams.get("sortBy");
      const sortOrder = searchParams.get("sortOrder") || "asc"; // default to ascending order
      const itemsPerPage = 50;

      const cacheKey = `search:${q}:${categoryId}:${sortBy}:${sortOrder}`;
      const cached = await env.PRODUCT_SEARCH_CACHE.get(cacheKey);
      if (cached) {
        console.log("Cache hit for search query", cacheKey);
        const cachedResults = JSON.parse(cached)
        const overallTimeMsCache = Date.now() - startTimeCache;

        const queryData = [
          {meta: {
            served_by: "cache",
            duration: 0
          }}
        ]
        return {
          items: itemsPerPage,
          stats: {
            queries: 1,
            results: cachedResults ? cachedResults.length : 0,
            select_fts: 0,
            select_where: 1,
            overallTimeMs: overallTimeMsCache,
            log: createSQLLog(["Cloudflare KV Search Cache Hit"], queryData, overallTimeMsCache),
          },
          results: cachedResults,
        };
      }

      let query = "";
      let params: (string | number)[] = [itemsPerPage, `%${q}%`];

      if (table === "products") {
        query =
          "SELECT Id, ProductName, SupplierId, CategoryId, QuantityPerUnit, UnitPrice, UnitsInStock, UnitsOnOrder, ReorderLevel, Discontinued FROM Product WHERE ProductName LIKE ?2";
        if (categoryId) {
          query += " AND CategoryId = ?3";
          params.push(Number(categoryId));
        }
        if (sortBy) {
          query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
        }
        query += " LIMIT ?1";
      } else {
        query =
          "SELECT Id, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax FROM Customer WHERE CompanyName LIKE ?2 OR ContactName LIKE ?2 OR ContactTitle LIKE ?2 OR Address LIKE ?2";
        if (sortBy) {
          query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
        }
        query += " LIMIT ?1";
      }

      const [stmts, sql] = prepareStatements(env.DB, false, [query], [params]);

      try {
        const startTime = Date.now();
        const search = await (stmts[0] as D1PreparedStatement).all();
        const overallTimeMs = Date.now() - startTime;

        await env.PRODUCT_SEARCH_CACHE.put(
          cacheKey,
          JSON.stringify(search.results),
          { expirationTtl: 300 }
        );

        return {
          items: itemsPerPage,
          stats: {
            queries: 1,
            results: search.results ? search.results.length : 0,
            select_fts: 0,
            select_where: 1,
            overallTimeMs: overallTimeMs,
            log: createSQLLog(sql, [search], overallTimeMs),
          },
          results: search.results,
        };
      } catch (e: any) {
        return { error: 404, msg: e.toString() };
      }
    },
  };
};

interface Env {
  DB: D1Database;
  PRODUCT_SEARCH_CACHE: KVNamespace;
}

export { apiSearch };
