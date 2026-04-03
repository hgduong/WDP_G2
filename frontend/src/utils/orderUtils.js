/**
 * Format a date string to Vietnamese locale format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format a date string to Vietnamese locale format with weekday
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string with weekday
 */
export const formatShowtime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format a price to Vietnamese currency format
 * @param {number} price - The price to format
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

/**
 * Generate a QR code URL for payment
 * @param {object} data - The data to encode in the QR code
 * @returns {string} QR code URL
 */
export const generateQRCodeUrl = (data) => {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  const qrData = encodeURIComponent(payload);
  return `https://chart.googleapis.com/chart?cht=qr&chl=${qrData}&chs=200x200&chco=4CAF50`;
};

/**
 * Generate ticket content for a specific ticket
 * @param {object} ticket - The ticket object
 * @param {object} orderData - The order data
 * @returns {object} Ticket content object
 */
export const generateTicketContent = (ticket, orderData) => {
  return {
    ticketCode: ticket.ticketCode,
    movie: orderData.movie?.title || orderData.showtimeId?.movieId?.title,
    showtime: orderData.showtime?.startTime || orderData.showtimeId?.startTime,
    cinema: orderData.cinema?.name || orderData.cinemaId?.name,
    room: orderData.room?.name || orderData.roomId?.name,
    seat: ticket.seatLabel,
    bookingCode: orderData.bookingCode
  };
};

/**
 * Extract movie information from order data
 * @param {object} orderData - The order data
 * @returns {object|null} Movie information or null
 */
export const getMovieInfo = (orderData) => {
  if (orderData?.movie) return orderData.movie;
  if (orderData?.showtimeId?.movieId) return orderData.showtimeId.movieId;
  return null;
};

/**
 * Extract cinema information from order data
 * @param {object} orderData - The order data
 * @returns {object|null} Cinema information or null
 */
export const getCinemaInfo = (orderData) => {
  if (orderData?.cinema) return orderData.cinema;
  if (orderData?.cinemaId) return orderData.cinemaId;
  return null;
};

/**
 * Extract room information from order data
 * @param {object} orderData - The order data
 * @returns {object|null} Room information or null
 */
export const getRoomInfo = (orderData) => {
  if (orderData?.room) return orderData.room;
  if (orderData?.roomId) return orderData.roomId;
  return null;
};

/**
 * Extract showtime information from order data
 * @param {object} orderData - The order data
 * @returns {object|null} Showtime information or null
 */
export const getShowtimeInfo = (orderData) => {
  if (orderData?.showtime) return orderData.showtime;
  if (orderData?.showtimeId) return orderData.showtimeId;
  return null;
};

/**
 * Extract customer information from order data or user context
 * @param {object} orderData - The order data
 * @param {object} user - The user object from context
 * @returns {object} Customer information
 */
export const getCustomerInfo = (orderData, user) => {
  return orderData?.customerInfo || {
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || ""
  };
};
