import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
export default function AdminLayout() {
  const { user } = useContext(AuthContext);

  // Security Check: Block non-staff or unauthenticated access
  if (!user || user.role === "CUSTOMER") {
    return <Navigate to="/auth" replace />;
  }
  return (
    <div className="view active">
      <Navbar />
      <main className="adminmain">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
