import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { createBooking, updatePaymentStatus } from "../services/bookingService";
import {
  getMovieInfo,
  getCinemaInfo,
  getRoomInfo,
  getShowtimeInfo,
  getCustomerInfo
} from "../utils/orderUtils";

/**
 * Custom hook for managing order state and logic
 * @returns {object} Order state and handlers
 */
export const useOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    const initializeOrder = async () => {
      const data = location.state?.orderData;
      
      if (data) {
        // If booking already exists (created from Checkout), use it directly
        if (data._id || data.bookingCode) {
          setOrderData(data);
          setBookingId(data._id);
          setPaymentStatus(data.paymentStatus || "Pending");
          localStorage.setItem("lastOrder", JSON.stringify(data));
        } else {
          // Fallback: create booking if data doesn't have booking info
          try {
            const bookingRequestData = {
              userId: user?._id || user?.id || null,
              showtimeId: data.showtimeId || data.showtime?._id,
              cinemaId: data.cinemaId || data.cinema?._id,
              roomId: data.roomId || data.room?._id,
              seats: data.seats || [],
              totalPrice: data.totalPrice,
              customerInfo: data.customerInfo || {
                fullName: user?.fullName || "",
                email: user?.email || "",
                phone: user?.phone || ""
              },
              paymentStatus: "Pending"
            };

            const response = await createBooking(bookingRequestData);
            
            if (response.booking || response.message === "Đặt vé thành công") {
              const savedBooking = response.booking;
              setOrderData(savedBooking);
              setBookingId(savedBooking._id);
              setPaymentStatus(savedBooking.paymentStatus || "Pending");
              localStorage.setItem("lastOrder", JSON.stringify(savedBooking));
            } else {
              setOrderData(data);
              setPaymentStatus(data.paymentStatus || "Pending");
            }
          } catch (err) {
            console.error("Error creating booking:", err);
            setOrderData(data);
            setPaymentStatus(data.paymentStatus || "Pending");
          }
        }
      } else {
        const storedOrder = localStorage.getItem("lastOrder");
        if (storedOrder) {
          try {
            const parsedOrder = JSON.parse(storedOrder);
            setOrderData(parsedOrder);
            setPaymentStatus(parsedOrder.paymentStatus || "Pending");
            setBookingId(parsedOrder._id);
          } catch (e) {
            setError("Không tìm thấy thông tin đơn hàng");
          }
        } else {
          setError("Không tìm thấy thông tin đơn hàng");
        }
      }
      setLoading(false);
    };

    initializeOrder();
  }, [location.state, user]);

  const handleGoHome = () => {
    localStorage.removeItem("lastOrder");
    navigate("/");
  };

  const handleGoBack = () => {
    localStorage.removeItem("lastOrder");
    navigate(-1);
  };

  const handlePaymentComplete = async () => {
    try {
      if (bookingId) {
        await updatePaymentStatus(bookingId, "Paid");
      }
      setPaymentStatus("Paid");
      if (orderData) {
        const updatedOrder = { 
          ...orderData, 
          paymentStatus: "Paid",
          status: "Confirmed"
        };
        setOrderData(updatedOrder);
        localStorage.setItem("lastOrder", JSON.stringify(updatedOrder));
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
      setPaymentStatus("Paid");
      if (orderData) {
        const updatedOrder = { 
          ...orderData, 
          paymentStatus: "Paid",
          status: "Confirmed"
        };
        setOrderData(updatedOrder);
        localStorage.setItem("lastOrder", JSON.stringify(updatedOrder));
      }
    }
  };

  const isPaymentComplete = paymentStatus === "Paid";

  // Extract order information
  const movie = getMovieInfo(orderData);
  const cinema = getCinemaInfo(orderData);
  const room = getRoomInfo(orderData);
  const showtime = getShowtimeInfo(orderData);
  const customerInfo = getCustomerInfo(orderData, user);

  return {
    orderData,
    loading,
    error,
    paymentStatus,
    bookingId,
    isPaymentComplete,
    movie,
    cinema,
    room,
    showtime,
    customerInfo,
    handleGoHome,
    handleGoBack,
    handlePaymentComplete
  };
};
