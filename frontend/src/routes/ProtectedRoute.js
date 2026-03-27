import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

export function ProtectedRoute({ children, allowedRoles }) {
  const { role, user } = useContext(UserContext);
  let storedRole = null;
  try {
    storedRole = localStorage.getItem("role");
  } catch {
    storedRole = null;
  }
  const resolvedRole =
    role && role !== "Guest" ? role : user?.role || storedRole || role || "Guest";
  const normalizedRole = String(resolvedRole || "")
    .trim()
    .toLowerCase();
  const normalizedAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.map((item) => String(item).trim().toLowerCase())
    : [];
  
  // If no allowedRoles defined, allow access
  if (!allowedRoles || !Array.isArray(allowedRoles)) {
    return children;
  }
  
  if (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
