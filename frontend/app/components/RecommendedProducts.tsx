import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const RecommendedProducts = ({ productId: id }: { productId: number }) => {
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    setLoading(true);

    const path = `${
      process.env.NODE_ENV === "production"
        ? "https://northwind-worker.cf-tme.workers.dev"
        : "http://127.0.0.1:8789"
    }/api/product_recommendation?Id=${id}`;

    fetch(path)
      .then((response) => response.json())
      .then((data) => {
        const products = data.products.map((product) => {
          const similiarityScore = data.similarityScores.find(score => score.id === product.Id.toString());
          return {
            ...product,
            similarityScore: similiarityScore?.score || 0,
          }
        });
        setRecommendedProducts(products);
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title">
          <span className="icon material-icons">ballot</span>
          <span className="ml-2">Recommended Products</span>
        </p>
      </header>
      <div className="card-content">
        {loading ? (
          <div>
            <span className="icon material-icons animate-spin">loop</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 space-between">
            {recommendedProducts.sort((a, b) => b.similarityScore - a.similarityScore).map((product) => (
              <Link to={`/product/${product.Id}`} key={product.Id}>
                <div className="card hover:bg-gray-50">
                  <div className="card-content">
                    <p className="title is-4">
                      {product.ProductName}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
};
