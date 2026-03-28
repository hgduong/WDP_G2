// src/pages/ShowtimeSelector.js
import { useState, useEffect } from "react";

const getCalendarDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const days = [];
  // Show 2 days ago to today + 7 days (total 10 days)
  for (let i = -2; i < 8; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
};

export default function ShowtimeSelector({
  showtimes,
  selectedShowtime,
  setSelectedShowtime,
  selectedDate,
  setSelectedDate,
}) {
  useEffect(() => {
    const days = getCalendarDays();
    const today = new Date().toISOString().split("T")[0];
    if (days.length > 0 && !selectedDate) {
      setSelectedDate(today);
    }
  }, [selectedDate, setSelectedDate]);

  const handleShowtimeClick = (showtime) => {
    setSelectedShowtime(showtime);
  };

  // Helper function to get time string from showtime
  const getTimeString = (showtime) => {
    if (showtime.startTime) {
      const date = new Date(showtime.startTime);
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    return "00:00";
  };

  const getShowtimeStatus = (showtime) => {
    const now = new Date();
    const start = new Date(showtime.startTime);
    // Use default 120min duration if not set
    const durationMin = showtime.duration || 120;
    const end = new Date(start.getTime() + durationMin * 60 * 1000);
    
    if (now < start) return "scheduled";
    if (now >= start && now <= end) return "ongoing";
    return "finished"; // now > end
  };

  const isPast = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    return d < today;
  };

  if (showtimes.length === 0) {
    return (
      <div className="showtimes">
        <h2>Suất chiếu</h2>
        <p className="no-showtimes-message">Chưa có suất chiếu nào cho phim này.</p>
      </div>
    );
  }

  // Sort showtimes by time
  const sortedShowtimes = [...showtimes].sort((a, b) => {
    const timeA = getTimeString(a);
    const timeB = getTimeString(b);
    return timeA.localeCompare(timeB);
  });

  return (
    <div className="showtimes">
      <h2>Suất chiếu</h2>

      <div className="cinema-name">
        {Array.from(new Set(showtimes.map((s) => s.roomId?.cinemaId?.name || s.room?.cinemaId?.name || ""))).join(" / ")}
      </div>

      {/* Date Tabs - Independent from showtimes */}
      <div className="date-tabs">
        {getCalendarDays().map((date) => {
          const d = new Date(date);
          const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
          const label = `${String(d.getDate()).padStart(2, "0")}/${String(
            d.getMonth() + 1
          ).padStart(2, "0")} - ${weekDays[d.getDay()]}`;

          const isActive = selectedDate === date;
          const past = isPast(date);

          return (
            <div
              key={date}
              className={`date-tab ${isActive ? "active" : ""} ${past ? "past" : ""}`}
              onClick={() => !past && setSelectedDate(date)}
            >
              <span className="date-tab-label">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="showtime-category">TẤT CẢ SUẤT CHIẾU</div>

      {/* Time Slots Grid - Filters showtimes by date and dims past ones */}
      <div className="time-grid">
        {sortedShowtimes
          .filter(s => s.startTime.split("T")[0] === selectedDate)
          .map((showtime) => {
            const timeStr = getTimeString(showtime);
            const roomName = showtime.roomId?.name || showtime.room?.name || "N/A";
            const available = showtime.availableSeats !== undefined 
              ? showtime.availableSeats 
              : (showtime.roomId?.capacity || showtime.room?.capacity || 0);
            
            const isSelected = selectedShowtime?._id === showtime._id;
            const status = getShowtimeStatus(showtime);
            const isFinished = status === "finished";
            const isOngoing = status === "ongoing";

            return (
              <div
                key={showtime._id}
                className={`time-slot ${isSelected ? "selected" : ""} ${available === 0 ? "unavailable" : ""} ${isFinished ? "past" : ""} ${isOngoing ? "ongoing" : ""}`}
                onClick={() => !isFinished && available > 0 && handleShowtimeClick(showtime)}
              >
                <span className="time-label">{timeStr}</span>
                <span className="room-label">{roomName}</span>
                <span className="seats">
                  {isFinished ? "Đã chiếu xong" : isOngoing ? "Đang chiếu" : available > 0 ? `Còn ${available} ghế` : "Hết ghế"}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

