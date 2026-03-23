import Home from "../pages/Home";
import MovieDetail from "../pages/MovieDetail";
import Booking from "../pages/Booking";
import Checkout from "../pages/Checkout";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import StaffLogin from "../pages/staff/StaffLogin";
import Signup from "../pages/Signup";
import OtpVerify from "../pages/OtpVerify";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import NotFound from "../pages/NotFound";

// Admin pages
import Dashboard from "../pages/admin/dashboard";
import MovieManagement from "../pages/admin/MovieManagement";
import CinemaManagement from "../pages/admin/CinemaManagement";
import ShowtimeManagement from "../pages/admin/ShowtimeManagement";
import StaffManagement from "../pages/admin/StaffManagement";

export const routesConfig = [
  {
    path: "/",
    element: <Home />,
    allowedRoles: ["Customer", "Admin", "Staff", "Guest"],
  },
  {
    path: "/movie/:id",
    element: <MovieDetail />,
    allowedRoles: ["Customer", "Admin", "Staff", "Guest"],
  },
  { path: "/booking/:id", element: <Booking />, allowedRoles: ["Customer"] },
  { path: "/checkout", element: <Checkout />, allowedRoles: ["Customer"] },
  {
    path: "/profile",
    element: <Profile />,
    allowedRoles: ["Customer", "Admin"],
  },
  { path: "/login", element: <Login />, allowedRoles: ["Guest"] },
  { path: "/staff-login", element: <StaffLogin />, allowedRoles: ["Guest"] },
  { path: "/signup", element: <Signup />, allowedRoles: ["Guest"] },
  { path: "/otp_verify", element: <OtpVerify />, allowedRoles: ["Guest"] },
  {
    path: "/forgot_password",
    element: <ForgotPassword />,
    allowedRoles: ["Guest"],
  },
  {
    path: "/reset_password",
    element: <ResetPassword />,
    allowedRoles: ["Guest"],
  },
  
  // Admin routes
  {
    path: "/admin",
    element: <Dashboard />,
    allowedRoles: ["Admin", "Staff"],
  },
  {
    path: "/admin/dashboard",
    element: <Dashboard />,
    allowedRoles: ["Admin", "Staff"],
  },
  {
    path: "/admin/movies",
    element: <MovieManagement />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/cinemas",
    element: <CinemaManagement />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/showtimes",
    element: <ShowtimeManagement />,
    allowedRoles: ["Admin"],
  },
    {
    path: "/admin/staffs",
    element: <StaffManagement />,
    allowedRoles: ["Admin"],
  },
  
  { path: "*", element: <NotFound /> },
];
