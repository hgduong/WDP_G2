import Home from "../pages/Home";
import MovieDetail from "../pages/MovieDetail";
import Booking from "../pages/Booking";
import Checkout from "../pages/Checkout";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import OtpVerify from "../pages/OtpVerify";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import NotFound from "../pages/NotFound";

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
  { path: "*", element: <NotFound /> },
];
