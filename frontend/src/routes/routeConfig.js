import Home from "../pages/Home";
import MovieDetail from "../pages/MovieDetail";
import Booking from "../pages/Booking";
import Checkout from "../pages/Checkout";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffBooking from "../pages/staff/StaffBooking";
import StaffLogin from "../pages/staff/StaffLogin";
import StaffRegister from "../pages/staff/StaffRegister";
import StaffOrder from "../pages/staff/StaffOrder";
import TicketCheck from "../pages/staff/TicketCheck";
import StaffSchedule from "../pages/staff/StaffSchedule";
import Signup from "../pages/Signup";
import OtpVerify from "../pages/OtpVerify";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import NotFound from "../pages/NotFound";
import Order from "../pages/OrderUser";
import Unauthorized from "../pages/Unauthorized";
import ShowtimesByCinema from "../pages/ShowtimesByCinema";
import MoviesAll from "../pages/MoviesAll";
import CinemasOverview from "../pages/CinemasOverview";
import TicketPrices from "../pages/TicketPrices";
import NewsOffers from "../pages/NewsOffers";
import TopUp from "../pages/TopUp";
import TopUpPayment from "../pages/TopUpPayment";
import TopUpSuccess from "../pages/TopUpSuccess";
import TopUpFailure from "../pages/TopUpFailure";
import TransactionDetail from "../pages/TransactionDetail";

//Staff pages

// Admin pages
import Dashboard from "../pages/admin/dashboard";
import MovieManagement from "../pages/admin/MovieManagement";
import CinemaManagement from "../pages/admin/CinemaManagement";
import ShowtimeManagement from "../pages/admin/ShowtimeManagement";
import StaffRegistration from "../pages/admin/StaffRegistration";
import StaffManagement from "../pages/admin/StaffManagement";
import UserManagement from "../pages/admin/UserManagement";
import VoucherManagement from "../pages/admin/VoucherManagement";
import ScheduleManagement from "../pages/admin/ScheduleManagement";
import AttendanceTracking from "../pages/admin/AttendanceTracking";
import ActorsManagement from "../pages/admin/ActorsManagement";
import DirectorsManagement from "../pages/admin/DirectorsManagement";

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
  { path: "/booking/:id", element: <Booking />, allowedRoles: ["Customer", "Guest"] },
  { path: "/checkout", element: <Checkout />, allowedRoles: ["Customer"] },
  { path: "/order", element: <Order />, allowedRoles: ["Customer", "Staff", "Admin"] },
  {
    path: "/profile",
    element: <Profile />,
    allowedRoles: ["Customer", "Admin", "Staff"],
  },
  {
    path: "/topup",
    element: <TopUp />,
    allowedRoles: ["Customer", "Admin", "Staff"],
  },
  {
    path: "/topup/payment",
    element: <TopUpPayment />,
    allowedRoles: ["Customer", "Admin", "Staff"],
  },
  {
    path: "/topup-success",
    element: <TopUpSuccess />,
    allowedRoles: ["Customer", "Admin", "Staff"],
  },
  {
    path: "/topup-failure",
    element: <TopUpFailure />,
    allowedRoles: ["Customer", "Admin", "Staff"],
  },
  {
    path: "/transaction/:id",
    element: <TransactionDetail />,
    allowedRoles: ["Customer", "Admin", "Staff"],
  },
  { path: "/login", element: <Login />, allowedRoles: ["Guest"] },
  { path: "/staff-login", element: <StaffLogin />, allowedRoles: ["Guest"] },
  { path: "/staff-register", element: <StaffRegister />, allowedRoles: ["Guest"] },
  {
    path: "/staff/dashboard",
    element: <StaffDashboard />,
    allowedRoles: ["Staff", "Admin"],
  },
  {
    path: "/staff/bookings",
    element: <StaffBooking />,
    allowedRoles: ["Staff", "Admin"],
  },
  {
    path: "/staff/orders",
    element: <StaffOrder />,
    allowedRoles: ["Staff", "Admin"],
  },
  {
    path: "/staff/ticket-check",
    element: <TicketCheck />,
    allowedRoles: ["Staff", "Admin"],
  },
  {
    path: "/staff/schedule",
    element: <StaffSchedule />,
    allowedRoles: ["Staff", "Admin"],
  },
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
  {
    path: "/unauthorized",
    element: <Unauthorized />,
    allowedRoles: ["Customer", "Admin", "Staff", "Guest"],
  },
  {
    path: "/showtimes",
    element: <ShowtimesByCinema />,
    allowedRoles: ["Customer", "Admin", "Staff", "Guest"],
  },
  {
    path: "/movies",
    element: <MoviesAll />,
    allowedRoles: ["Customer", "Admin", "Staff", "Guest"],
  },
  {
    path: "/cinemas",
    element: <CinemasOverview />,
    allowedRoles: ["Customer", "Admin", "Staff", "Guest"],
  },
  {
    path: "/prices",
    element: <TicketPrices />,
    allowedRoles: ["Customer", "Admin", "Staff", "Guest"],
  },
  {
    path: "/news",
    element: <NewsOffers />,
    allowedRoles: ["Customer", "Admin", "Staff", "Guest"],
  },
  
  // Admin routes
  {
    path: "/admin",
    element: <Dashboard />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/dashboard",
    element: <Dashboard />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/movies",
    element: <MovieManagement />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/actors",
    element: <ActorsManagement />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/directors",
    element: <DirectorsManagement />,
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
  {
    path: "/admin/staff-register",
    element: <StaffRegistration />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/users",
    element: <UserManagement />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/voucher",
    element: <VoucherManagement />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/schedules/create",
    element: <ScheduleManagement />,
    allowedRoles: ["Admin"],
  },
  {
    path: "/admin/schedules/attendance",
    element: <AttendanceTracking />,
    allowedRoles: ["Admin"],
  },
  
  { path: "*", element: <NotFound /> },
];
