import React, { useState } from "react";
import api from "../api/client";
export function productImageUrl(path) {
  if (!path || !/^\/api\/products\/\d+\/image(?:\?v=[a-f0-9-]+)?$/.test(path))
    return null;
  const base = new URL(
    api.defaults?.baseURL ||
      process.env.REACT_APP_API_BASE_URL ||
      "http://localhost:8080/api",
    window.location.origin,
  );
  return new URL(
    path.replace(/^\/api\//, ""),
    `${base.href.replace(/\/$/, "")}/`,
  ).href;
}
export default function ProductImage({ product = {}, compact = false }) {
  const [failed, setFailed] = useState(null);
  const src = productImageUrl(product.imageUrl);
  const label = `${product.brand || "LPG cylinder"}${product.sizeKg ? ` ${product.sizeKg} kg` : ""}`;
  return (
    <div className={`product-image ${compact ? "compact" : ""}`}>
      {src && failed !== src ? (
        <img
          src={src}
          alt={label}
          loading="lazy"
          onError={() => setFailed(src)}
        />
      ) : (
        <div
          className="product-placeholder"
          role="img"
          aria-label={`${label}: image unavailable`}
        >
          <svg viewBox="0 0 80 100" aria-hidden="true">
            <path
              d="M30 12h20v12H30zM22 35q0-11 18-11t18 11v45q0 12-18 12T22 80z"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              d="M22 56h36M28 94h24"
              stroke="currentColor"
              strokeWidth="4"
            />
          </svg>
          {!compact && <span>{label}</span>}
        </div>
      )}
    </div>
  );
}
