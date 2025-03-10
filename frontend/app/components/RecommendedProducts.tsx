import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const RecommendedProducts = ({
  productId: id,
}: {
  productId: number;
}) => {
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [fetchTime, setFetchTime] = useState(0);

  useEffect(() => {
    setLoading(true);

    const path = `${
      process.env.NODE_ENV === "production"
        ? "https://api.cf-dev-platform.com"
        : "http://127.0.0.1:8789"
    }/api/product_recommendation?Id=${id}`;

    fetch(path)
      .then((response) => response.json())
      .then((data) => {
        setRecommendedProducts(data.products);
        setFetchTime(data.stats.overallTimeMs);
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
          <>
            {recommendedProducts && recommendedProducts.length > 0 ? (
              <div className="flex flex-wrap gap-2 space-between">
                {recommendedProducts
                  .sort((a, b) => b.score - a.score)
                  .map((product) => (
                    <Link to={`/product/${product.id}`} key={product.id}>
                      <div className="card hover:bg-gray-50">
                        <div className="card-content">
                          <p className="title is-4">{product.name}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <p>No recommended products available.</p>
            )}
            <div className="mt-4 text-sm text-gray-500 border-t pt-2">
              Recommendations generated in: {fetchTime.toFixed(0)}ms
            </div>
          </>
        )}
      </div>
    </div>
  );
};
