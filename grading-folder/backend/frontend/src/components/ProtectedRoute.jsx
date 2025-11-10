// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ⏳ While loading user info from localStorage, show nothing (avoid flicker)
  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  // 🚫 If not logged in, redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // ✅ Otherwise show protected page
  return children;
};

export default ProtectedRoute;
