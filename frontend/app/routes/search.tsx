import type { LoaderFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStatsDispatch } from "~/components/StatsContext";

const productCategories = [
  { id: 1, name: "Beverages" },
  { id: 2, name: "Condiments" },
  { id: 3, name: "Confections" },
  { id: 4, name: "Dairy Products" },
  { id: 5, name: "Grains/Cereals" },
  { id: 6, name: "Meat/Poultry" },
  { id: 7, name: "Produce" },
  { id: 8, name: "Seafood" },
];

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("q");
  const table = url.searchParams.get("table");
  const categoryId = url.searchParams.get("categoryId");
  const sortBy = url.searchParams.get("sortBy");
  const sortOrder = url.searchParams.get("sortOrder");

  const rand = Math.floor(Math.random() * 1000001);
  const path = `${
    process.env.NODE_ENV === "production"
      ? "https://northwind-worker.cf-tme.workers.dev"
      : "http://127.0.0.1:8789"
  }/api/search?q=${keyword}&rand=${rand}&table=${table ?? "products"}${
    categoryId ? `&categoryId=${categoryId}` : ""
  }${sortBy ? `&sortBy=${sortBy}` : ""}${
    sortOrder ? `&sortOrder=${sortOrder}` : ""
  }`;
  const startTime = performance.now();
  const res = await fetch(path);
  const endTime = performance.now();
  const fetchTime = endTime - startTime;
  const result = (await res.json()) as any;
  return json({ ...result, categories: productCategories, fetchTime });
};
type LoaderType = Awaited<ReturnType<typeof loader>>;

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q");
  const categoryId = searchParams.get("categoryId");
  const sortByParam = searchParams.get("sortBy");
  const sortOrderParam = searchParams.get("sortOrder");
  const data = useLoaderData<LoaderType>();
  const { results, categories, fetchTime } = data;
  const [keyword, setKeyword] = useState(q || "");
  const [table, setTable] = useState("products");
  const [selectedCategory, setSelectedCategory] = useState(categoryId || "");
  const [sortBy, setSortBy] = useState(sortByParam || "ProductName");
  const [sortOrder, setSortOrder] = useState(sortOrderParam || "asc");
  

  const dispatch = useStatsDispatch();
  useEffect(() => {
    dispatch && data.stats && dispatch(data.stats);
  }, [dispatch, data.stats]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (table) params.set("table", table);
    if (selectedCategory) params.set("categoryId", selectedCategory);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    navigate(`?${params.toString()}`);
  };

  return (
    <>
      <div className="card">
        <div className="card-content">
          <div className="field">
            <label className="label">Search Database</label>
            <div className="field-body">
              <div className="field">
                <div className="control icons-left">
                  <input
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Enter keyword..."
                    value={keyword}
                    className="input w-1/2"
                  />
                  <span className="icon left material-icons">search</span>
                </div>
              </div>
            </div>
          </div>

          <div className="field">
            {table === "products" && (
              <div className="field">
                <label className="label">Category</label>
                <div className="control">
                  <div className="select">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {categories.map(
                        (category: { id: number; name: string }) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Dropdown for sorting options */}
            {/* Radio buttons for sorting options */}
            <div className="field">
              <label className="label">Sort By</label>
              <div className="control">
                <label className="radio-inline mr-4">
                  <input
                    type="radio"
                    name="sortBy"
                    value="ProductName"
                    checked={sortBy === "ProductName"}
                    onChange={() => setSortBy("ProductName")}
                    className="mr-1"
                  />
                  Name
                </label>
                <label className="radio-inline">
                  <input
                    type="radio"
                    name="sortBy"
                    value="Id"
                    checked={sortBy === "Id"}
                    onChange={() => setSortBy("Id")}
                    className="mr-1"
                  />
                  Product ID
                </label>
              </div>
            </div>

            <div className="field">
              <label className="label">Sort Order</label>
              <div className="control">
                <label className="radio-inline mr-4">
                  <input
                    type="radio"
                    name="sortOrder"
                    value="asc"
                    checked={sortOrder === "asc"}
                    onChange={() => setSortOrder("asc")}
                    className="mr-1"
                  />
                  Ascending
                </label>
                <label className="radio-inline">
                  <input
                    type="radio"
                    name="sortOrder"
                    value="desc"
                    checked={sortOrder === "desc"}
                    onChange={() => setSortOrder("desc")}
                    className="mr-1"
                  />
                  Descending
                </label>
              </div>
            </div>

            <div className="field">
              <div className="control">
                <button
                  className="button"
                  onClick={handleSearch}
                  style={{ backgroundColor: "#87CEEB" }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
          <p className="text-black font-bold text-lg">Search results</p>
          {results.length ? (
            <>
            <p className="text-gray-500 text-lg font-bold">Total Search time: {fetchTime.toFixed(2)} ms</p>
              {/* <pre className="text-gray-400 text-sm">{log}</pre> */}
              {results.map((r: any, idx: number) => {
                return (
                  <>
                    {table == "products" ? (
                      <>
                        <p className="text-base mt-2 link">
                          <Link to={`/product/${r.Id}`}>{r.ProductName}</Link>
                        </p>
                        <p className="text-gray-400 text-sm">
                          Id: {r.Id}, Quantity Per Unit: {r.QuantityPerUnit},
                          Price: {r.UnitPrice}, Stock: {r.UnitsInStock}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base mt-2 link">
                          <Link to={`/customer/${r.Id}`}>{r.CompanyName}</Link>
                        </p>
                        <p className="text-gray-400 text-sm">
                          #{r.Id}, Contact: {r.ContactName}, Title:{" "}
                          {r.ContactTitle}, Phone: {r.Phone}
                        </p>
                      </>
                    )}
                  </>
                );
              })}
            </>
          ) : (
            <p className="mt-6">No results</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Search;
