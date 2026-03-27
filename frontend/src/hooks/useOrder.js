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
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    const initializeOrder = async () => {
      const data = location.state?.orderData;
      
      if (data) {
        // If booking already exists in DB (has _id from MongoDB), use it directly
        if (data._id) {
          setOrderData(data);
          setBookingId(data._id);
          setPaymentStatus(data.paymentStatus || "Unpaid");
          localStorage.setItem("lastOrder", JSON.stringify(data));
        } else {
          // Booking not yet saved to DB — create it now
          try {
            const bookingRequestData = {
              userId: user?._id || user?.id || null,
              showtimeId: data.showtimeId || data.showtime?._id,
              cinemaId: data.cinemaId || data.cinema?._id || data.showtime?.cinemasId?._id,
              roomId: data.roomId || data.room?._id || data.showtime?.roomId?._id,
              seats: (data.seats || []).map(s => ({ _id: s._id || s.id, label: s.label })).filter(s => s._id),
              totalPrice: data.totalPrice,
              customerInfo: data.customerInfo || {
                fullName: user?.fullName || "",
                email: user?.email || "",
                phone: user?.phone || ""
              },
              paymentStatus: "Unpaid"
            };

            const response = await createBooking(bookingRequestData);
            
            if (response.booking || response.message === "Đặt vé thành công") {
              const savedBooking = response.booking;
              const mergedData = { ...data, ...savedBooking, _id: savedBooking._id };
              setOrderData(mergedData);
              setBookingId(savedBooking._id);
              setPaymentStatus(savedBooking.paymentStatus || "Unpaid");
              localStorage.setItem("lastOrder", JSON.stringify(mergedData));
            } else {
              setOrderData(data);
              setPaymentStatus(data.paymentStatus || "Unpaid");
            }
          } catch (err) {
            console.error("Error creating booking:", err);
            setOrderData(data);
            setPaymentStatus(data.paymentStatus || "Unpaid");
          }
        }
      } else {
        const storedOrder = localStorage.getItem("lastOrder");
        if (storedOrder) {
          try {
            const parsedOrder = JSON.parse(storedOrder);
            setOrderData(parsedOrder);
            setPaymentStatus(parsedOrder.paymentStatus || "Unpaid");
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
