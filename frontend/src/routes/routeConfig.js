// import Home from "../pages/Home";
// import MovieDetail from "../pages/MovieDetail";
// import Booking from "../pages/Booking";
// import Checkout from "../pages/Checkout";
// import Profile from "../pages/Profile";
// import Login from "../pages/Login"; 
// import Signup from "../pages/Signup";
// import OtpVerify from "../pages/OtpVerify";
// import ForgotPassword from "../pages/ForgotPassword";
// import ResetPassword from "../pages/ResetPassword";
// import Unauthorized from "../pages/Unauthorized";

// export const routesConfig = [
//   { path: "/", element: <Home />, allowedRoles: ["*"] },
//   { path: "/movie/:id", element: <MovieDetail />, allowedRoles: ["*"] },
//   { path: "/booking/:id", element: <Booking />, allowedRoles: ["*"] },
//   { path: "/checkout", element: <Checkout />, allowedRoles: ["*"] },
//   { path: "/profile", element: <Profile />, allowedRoles: ["Customer","Admin"] },
//   { path: "/login", element: <Login />, allowedRoles: ["*"] }, 
//   { path: "/signup", element: <Signup />, allowedRoles: ["*"] },
//   { path: "/otp_verify", element: <OtpVerify />, allowedRoles: ["*"] },
//   { path: "/forgot_password", element: <ForgotPassword />, allowedRoles: ["*"] },
//   { path: "/reset_password", element: <ResetPassword />, allowedRoles: ["*"] },
//   { path: "/unauthorized", element: <Unauthorized />, allowedRoles: ["*"] },
// ];


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
import Unauthorized from "../pages/Unauthorized";

export const routesConfig = [
  { path: "/", element: <Home />, allowedRoles: ["User","Admin","Staff","Guest"] },
  { path: "/movie/:id", element: <MovieDetail />, allowedRoles: ["User","Admin","Staff","Guest"] },
  { path: "/booking/:id", element: <Booking />, allowedRoles: ["User"] },
  { path: "/checkout", element: <Checkout />, allowedRoles: ["User"] },
  { path: "/profile", element: <Profile />, allowedRoles: ["User","Admin"] },
  { path: "/login", element: <Login />, allowedRoles: ["Guest"] }, 
  { path: "/signup", element: <Signup />, allowedRoles: ["Guest"] },
  { path: "/otp_verify", element: <OtpVerify />, allowedRoles: ["Guest"] },
  { path: "/forgot_password", element: <ForgotPassword />, allowedRoles: ["Guest"] },
  { path: "/reset_password", element: <ResetPassword />, allowedRoles: ["Guest"] },
  { path: "/unauthorized", element: <Unauthorized />, allowedRoles: ["Guest","User","Admin","Staff"] },
];
