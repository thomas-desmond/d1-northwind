import { useEffect, useState } from "react";
import { Link, LoaderFunctionArgs, useNavigate } from "react-router-dom";
import { Paginate } from "~/components";
import type { LoaderFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { useStatsDispatch } from "~/components/StatsContext";

export const loader: LoaderFunction = async ({
  context,
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const count = url.searchParams.get("count");
  const search = url.searchParams.get("search");
  const role = url.searchParams.get("token") || "admin";

  const rand = Math.floor(Math.random() * 1000001);
  const path = `${
    process.env.NODE_ENV === "production"
      ? "https://api.cf-northwind.com"
      : "http://127.0.0.1:8789"
  }/api/orders-no-validation?page=${page}${
    Number(count) > 0 ? `` : `&count=true`
  }${search ? `&search=${search}` : ""}&rand=${rand}`;

  const startTime = Date.now();
  const res = await fetch(path, {
    headers: {
      "Role": role,
    },
  });
  const endTime = Date.now();
  const fetchTime = endTime - startTime;

  if (!res.ok) {
    return json({
      error: `Error: ${res.status} ${res.statusText}`,
      orders: [],
      pages: 1,
      fetchTime,
    });
  }
  const result = (await res.json()) as any;

  return json({ ...result, fetchTime });
};
type LoaderType = Awaited<ReturnType<typeof loader>>;

interface Order {
  Id: string;
  TotalProducts: string;
  TotalProductsPrice: string;
  TotalProductsItems: string;
  OrderDate: string;
  ShipName: string;
  ShipCity: string;
  ShipCountry: string;
}

const OrdersNoValidation = () => {
  const data = useLoaderData<LoaderType>();
  const [selectedToken, setSelectedToken] = useState("admin");
  const [orders, setOrders] = useState<Order[]>(data.orders);
  const [total, setTotal] = useState(data.total);
  const [fetchTime, setFetchTime] = useState(data.fetchTime);

  const navigate = useNavigate();

  const { page, pages } = data;
  const dispatch = useStatsDispatch();

  useEffect(() => {
    dispatch && data.stats && dispatch(data.stats);
  }, [dispatch, data.stats]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setSelectedToken(token);
    }
  }, []);

  useEffect(() => {
    setOrders(data.orders);
    setTotal(data.total);
    setFetchTime(data.fetchTime);
  }, [data.orders, data.total, data.fetchTime]);

  const setPage = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    params.set("token", selectedToken);
    navigate(`?${params.toString()}`);
  };

  const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = event.target.value;
    if (selectedToken !== newToken) {
      setSelectedToken(newToken);
      setOrders([]);
      setTotal(0);
      setFetchTime(0);
    }
  };

  const handleGetOrders = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("token", selectedToken);
    navigate(`?${params.toString()}`);
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Orders (No JWT Validation)</h1>
      <div>
        <label className="mr-2">Log In As:</label>
        {[
          { key: "admin", label: "Administrator" },
          { key: "user", label: "User 'Around The Horn'" },
        ].map(({ key, label }) => (
          <label key={key} className="radio-inline mr-2">
            <input
              type="radio"
              name="token"
              value={key}
              checked={selectedToken === key}
              onChange={handleTokenChange}
              className="mr-1"
            />
            {label}
          </label>
        ))}
        <button
          onClick={handleGetOrders}
          className="button"
          style={{ backgroundColor: "#87CEEB" }}
        >
          Get Orders
        </button>
      </div>
      {data.error && (
        <div className="card-content">
          <h2>{data.error}</h2>
        </div>
      )}
      <div className="text-xl font-semibold my-3">Total orders: {total}</div>
      <div className="text-xl font-semibold my-3">Total data fetch time: {fetchTime} ms</div>
      {orders.length ? (
        <div className="card has-table">
          <header className="card-header">
            <p className="card-header-title">Orders</p>
            <button className="card-header-icon">
              <span
                className="material-icons"
                onClick={() => {
                  //eslint-disable-next-line
                  window.location.href = window.location.href;
                }}
              >
                redo
              </span>
            </button>
          </header>
          <div className="card-content">
            <table>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Total Price</th>
                  <th>Products</th>
                  <th>Quantity</th>
                  <th>Shipped</th>
                  <th>Ship Name</th>
                  <th>City</th>
                  <th>Country</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: Order, index: number) => {
                  return (
                    <tr key={index}>
                      <td data-label="Id">
                        <Link className="link" to={`/order/${order.Id}`}>
                          {order.Id}
                        </Link>
                      </td>
                      <td data-label="Price">{`$${parseFloat(
                        order.TotalProductsPrice
                      ).toFixed(2)}`}</td>
                      <td data-label="Products">{order.TotalProducts}</td>
                      <td data-label="Quantity">{order.TotalProductsItems}</td>
                      <td data-label="Date">{order.OrderDate}</td>
                      <td data-label="Name">{order.ShipName}</td>
                      <td data-label="City">{order.ShipCity}</td>
                      <td data-label="Country">{order.ShipCountry}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Paginate pages={pages} page={page} setPage={setPage} />
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
};

export default OrdersNoValidation;
