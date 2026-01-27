// client/src/components/SeatSelector.jsx
import { useState } from "react";

export default function SeatSelector({ seats, onChange }) {
  const [selected, setSelected] = useState([]);

  const toggleSeat = (seat) => {
    const newSelected = selected.includes(seat)
      ? selected.filter(s => s !== seat)
      : [...selected, seat];
    setSelected(newSelected);
    onChange(newSelected);
  };

  return (
    <div className="grid grid-cols-8 gap-2">
      {seats.map(seat => (
        <button
          key={seat}
          onClick={() => toggleSeat(seat)}
          className={`p-2 rounded ${
            selected.includes(seat) ? "bg-green-500" : "bg-gray-700"
          }`}
        >
          {seat}
        </button>
      ))}
    </div>
  );
}
