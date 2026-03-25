const apiUrl = "http://localhost:9999";

// Create new booking
export const createBooking = async (bookingData, token) => {
  const response = await fetch(`${apiUrl}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(bookingData),
  });
  return response.json();
};

// Get booking by ID
export const getBooking = async (bookingId, token) => {
  const response = await fetch(`${apiUrl}/api/bookings/${bookingId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  return response.json();
};

// Get booking by code
export const getBookingByCode = async (bookingCode) => {
  const response = await fetch(`${apiUrl}/api/bookings/code/${bookingCode}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return response.json();
};

// Update payment status
export const updatePaymentStatus = async (bookingId, paymentStatus, token) => {
  const response = await fetch(`${apiUrl}/api/bookings/${bookingId}/payment`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ paymentStatus }),
  });
  return response.json();
};

// Get user bookings
export const getUserBookings = async (token) => {
  const response = await fetch(`${apiUrl}/api/user/bookings`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  return response.json();
};