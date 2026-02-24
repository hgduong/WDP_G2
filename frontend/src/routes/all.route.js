// src/routes.jsx
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/Mainlayout";
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
export const router = createBrowserRouter([
  { path: "/", element: <MainLayout><Home /></MainLayout> },
  { path: "/movie/:id", element: <MainLayout><MovieDetail /></MainLayout> },
  { path: "/booking/:id", element: <MainLayout><Booking /></MainLayout> },
  { path: "/checkout", element: <MainLayout><Checkout /></MainLayout> },
  { path: "/profile", element: <MainLayout><Profile /></MainLayout> },
  { path: "/login", element: <MainLayout><Login /></MainLayout> }, 
  { path: "/signup", element: <MainLayout><Signup /></MainLayout> },
  { path: "/otp_verify", element: <MainLayout><OtpVerify /></MainLayout> },
  { path: "/forgot_password", element: <MainLayout><ForgotPassword /></MainLayout> },
  { path: "/reset_password", element: <MainLayout><ResetPassword/></MainLayout> },
  { path: "*", element: <MainLayout><NotFound /></MainLayout> },
  
]);
