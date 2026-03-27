import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

export function ProtectedRoute({ children, allowedRoles }) {
  const { role, isAuthReady } = useContext(UserContext);
  
  if (!isAuthReady) {
    return null; // Or a loading spinner
  }
  
  // Try to get role from context, fallback to localStorage for the very first render after login
  const currentRole = role === "Guest" ? (localStorage.getItem("role") || "Guest") : role;
  
  // If no allowedRoles defined, allow access
  if (!allowedRoles || !Array.isArray(allowedRoles)) {
    return children;
  }
  
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
