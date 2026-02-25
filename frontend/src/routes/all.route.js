import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/Mainlayout";
import { routesConfig } from "./routeConfig";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter(
  routesConfig.map(({ path, element, allowedRoles }) => ({
    path,
    element: (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <MainLayout>{element}</MainLayout>
      </ProtectedRoute>
    ),
  })),
);
