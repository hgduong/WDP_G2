import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/Mainlayout";
import AdminLayout from "../pages/admin/AdminLayout";
import { routesConfig } from "./routeConfig";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter(
  routesConfig.map(({ path, element, allowedRoles }) => {
    // Check if this is an admin route
    const isAdminRoute = path.startsWith("/admin");
    
    return {
      path,
      element: (
        <ProtectedRoute allowedRoles={allowedRoles}>
          {isAdminRoute ? (
            <AdminLayout>{element}</AdminLayout>
          ) : (
            <MainLayout>{element}</MainLayout>
          )}
        </ProtectedRoute>
      ),
    };
  }),
);
