import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, ready } = useContext(AuthContext);
  const location = useLocation();
  if (!ready) return <p role="status">Checking your session…</p>;
  if (!user)
    return (
      <Navigate
        to="/auth"
        state={{
          from: location,
        }}
        replace
      />
    );
  if (allowedRoles && !allowedRoles.includes(user.role))
    return (
      <main className="section">
        <h1>Access restricted</h1>
        <p>You do not have permission to open this page.</p>
      </main>
    );
  return children;
}
