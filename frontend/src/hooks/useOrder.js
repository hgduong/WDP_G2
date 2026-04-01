import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { cancelBooking, getBookingById, getPaymentStatus } from "../services/api";
import {
  getCinemaInfo,
  getCustomerInfo,
  getMovieInfo,
  getRoomInfo,
  getShowtimeInfo,
} from "../utils/orderUtils";

const STORAGE_KEY = "lastOrderBookingId";

export const useOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookingId, setBookingId] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const stateBookingId = location.state?.orderData?._id;
    const queryBookingId = searchParams.get("bookingId");
    const storedBookingId = localStorage.getItem(STORAGE_KEY);
    const nextBookingId = queryBookingId || stateBookingId || storedBookingId || null;

    if (stateBookingId && queryBookingId !== stateBookingId) {
      setSearchParams({ bookingId: stateBookingId });
    }

    if (!nextBookingId) {
      setError("Không tìm thấy thông tin đơn hàng.");
      setLoading(false);
      return;
    }

    localStorage.setItem(STORAGE_KEY, nextBookingId);
    setBookingId(nextBookingId);
    setError(null);
  }, [location.state, searchParams, setSearchParams]);

  const refreshOrder = useCallback(
    async (withPaymentSync = true) => {
      if (!bookingId) {
        return null;
      }

      const booking = await getBookingById(bookingId);

      if (
        withPaymentSync &&
        booking?.paymentId?._id &&
        booking.paymentStatus === "Pending"
      ) {
        const paymentState = await getPaymentStatus(booking.paymentId._id);
        return paymentState.booking || booking;
      }

      return booking;
    },
    [bookingId],
  );

  useEffect(() => {
    if (!bookingId) {
      return undefined;
    }

    let active = true;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setActionError("");
        const booking = await refreshOrder(true);

        if (active) {
          setOrderData(booking);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.message || "Không thể tải thông tin đơn hàng.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      active = false;
    };
  }, [bookingId, refreshOrder]);

  useEffect(() => {
    if (!orderData?.paymentId?._id || orderData.paymentStatus !== "Pending") {
      setPolling(false);
      return undefined;
    }

    setPolling(true);

    const intervalId = window.setInterval(async () => {
      try {
        const paymentState = await getPaymentStatus(orderData.paymentId._id);
        setOrderData((current) => paymentState.booking || current);
      } catch (pollError) {
        console.error("Payment polling failed:", pollError);
      }
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      setPolling(false);
    };
  }, [orderData?.paymentId?._id, orderData?.paymentStatus]);

  useEffect(() => {
    if (orderData?.paymentStatus !== "Pending") {
      setNowTick(Date.now());
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [orderData?.paymentStatus]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleCancelBooking = async () => {
    if (!bookingId) {
      return;
    }

    try {
      setActionError("");
      const response = await cancelBooking(bookingId);
      setOrderData(response.booking || (await refreshOrder(false)));
    } catch (cancelError) {
      setActionError(cancelError?.message || "Không thể hủy booking.");
    }
  };

  const countdownMs = useMemo(() => {
    const expiresAt = orderData?.paymentId?.expiresAt || orderData?.expiresAt;

    if (!expiresAt) {
      return 0;
    }

    return Math.max(0, new Date(expiresAt).getTime() - nowTick);
  }, [orderData?.paymentId?.expiresAt, orderData?.expiresAt, nowTick]);

  const countdownText = useMemo(() => {
    const totalSeconds = Math.floor(countdownMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [countdownMs]);

  const movie = getMovieInfo(orderData);
  const cinema = getCinemaInfo(orderData);
  const room = getRoomInfo(orderData);
  const showtime = getShowtimeInfo(orderData);
  const customerInfo = getCustomerInfo(orderData);

  return {
    bookingId,
    orderData,
    loading,
    polling,
    error,
    actionError,
    countdownMs,
    countdownText,
    movie,
    cinema,
    room,
    showtime,
    customerInfo,
    handleGoHome,
    handleCancelBooking,
  };
};
