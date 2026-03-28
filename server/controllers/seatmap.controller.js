const Seatmap = require("../models/seatmap");
const Seat = require("../models/seat");
const Room = require("../models/room");

// Helper function to build seat layout (can be used by other controllers)
// Last 10 seats are couple seats (5 couple pairs)
exports.buildSeatLayout = (totalSeats) => {
  const effectiveCapacity = Math.max(Number(totalSeats) || 0, 50); // Default 50 if 0
  const seatsPerRow = 10;
  const coupleSeatsCount = 10; // Last 10 seats are couple seats
  const seats = [];

  // Generate all seats
  const totalRows = Math.ceil(effectiveCapacity / seatsPerRow);
  
  for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
    const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, D, E...
    const seatsInThisRow = Math.min(seatsPerRow, effectiveCapacity - rowIndex * seatsPerRow);
    const isLastRow = rowIndex === totalRows - 1;
    
    if (isLastRow) {
      // Last row: couple seats (5 couple pairs = 10 seats)
      // E1-2, E3-4, E5-6, E7-8, E9-10
      for (let i = 0; i < 5; i++) {
        seats.push({
          row: rowLetter,
          number: (i * 2) + 1,
          type: "Couple",
          status: "Available"
        });
      }
    } else {
      // Other rows: standard seats (10 per row)
      // A1-A10, B1-B10, C1-C10, D1-D10...
      for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
        seats.push({
          row: rowLetter,
          number: seatNum,
          type: rowIndex >= 3 ? "VIP" : "Standard",
          status: "Available"
        });
      }
    }
  }

  return seats;
};

// Generate seat layout based on room capacity
// Last 10 seats are couple seats (5 couple pairs)
exports.generateSeatLayout = async (req, res) => {
  try {
    const { roomId, capacity } = req.body;
    
    if (!roomId || !capacity) {
      return res.status(400).json({ message: "roomId and capacity are required" });
    }

    const totalSeats = parseInt(capacity);
    const seatsPerRow = 10;
    const coupleSeatsCount = 10; // Last 10 seats are couple seats
    const seats = [];

    // Generate all seats
    const totalRows = Math.ceil(totalSeats / seatsPerRow);
    
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, D, E...
      const seatsInThisRow = Math.min(seatsPerRow, totalSeats - rowIndex * seatsPerRow);
      const isLastRow = rowIndex === totalRows - 1;
      
      if (isLastRow) {
        // Last row: couple seats (5 couple pairs = 10 seats)
        // E1-2, E3-4, E5-6, E7-8, E9-10
        for (let i = 0; i < 5; i++) {
          seats.push({
            row: rowLetter,
            number: (i * 2) + 1,
            type: "Couple",
            status: "Available"
          });
        }
      } else {
        // Other rows: standard seats (10 per row)
        // A1-A10, B1-B10, C1-C10, D1-D10...
        for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
          seats.push({
            row: rowLetter,
            number: seatNum,
            type: rowIndex >= 3 ? "VIP" : "Standard",
            status: "Available"
          });
        }
      }
    }

    // Insert seats into database
    const createdSeats = await Seat.insertMany(seats);

    // Create seatmap for the room
    const seatmap = await Seatmap.create({
      roomId: roomId,
      showtimes: null, // Will be linked when showtime is created
      seats: createdSeats.map(seat => seat._id)
    });

    // Update room with seatmap reference
    await Room.findByIdAndUpdate(roomId, { seatmapId: seatmap._id });

    res.json({
      message: "Seat layout created successfully",
      seatmap: seatmap,
      seats: createdSeats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSeatmapByShowtime = async (req, res) => {
  try {
    const showtimeId = req.params.showtimeId;
    const Showtime = require("../models/showtime");
    const Room = require("../models/room");
    
    // 1. Try to find an existing seatmap specifically for this showtime
    let seatmap = await Seatmap.findOne({ showtimes: showtimeId }).populate("seats");
    
    if (seatmap) {
      // Small check: if showtime has a specific seatmap but it's empty, we might need to fix it
      if (!seatmap.seats || seatmap.seats.length === 0) {
        // ... handled below in regeneration logic
      } else {
        return res.json(seatmap);
      }
    }

    // 2. No showtime-specific seatmap found. We need to create one.
    const showtime = await Showtime.findById(showtimeId).populate("roomId");
    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    const room = showtime.roomId;
    const expectedCapacity = room?.capacity || 60;

    // 3. Create a UNIQUE seatmap and set of seats for THIS showtime
    console.log(`Creating isolated seatmap for showtime ${showtimeId} in room ${room?.name}`);
    
    // Generate new seats (isolated from other showtimes)
    const effectiveCapacity = Math.max(Number(expectedCapacity) || 0, 50);
    const seatsPerRow = 10;
    const rowCount = Math.ceil(effectiveCapacity / seatsPerRow);
    const seatsData = [];
    
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const rowLetter = String.fromCharCode(65 + rowIndex);
      const isLastRow = rowIndex === rowCount - 1;
      const seatsInThisRow = Math.min(seatsPerRow, effectiveCapacity - rowIndex * seatsPerRow);
      
      if (isLastRow) {
        for (let i = 0; i < 5; i++) {
          seatsData.push({
            row: rowLetter,
            number: (i * 2) + 1,
            type: "Couple",
            status: "Available"
          });
        }
      } else {
        for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
          seatsData.push({
            row: rowLetter,
            number: seatNum,
            type: rowIndex >= 3 ? "VIP" : "Standard",
            status: "Available"
          });
        }
      }
    }
    
    const createdSeats = await Seat.insertMany(seatsData);
    
    // Create the new seatmap record linked to this showtime
    seatmap = await Seatmap.create({
      roomId: room._id,
      showtimes: showtimeId,
      seats: createdSeats.map(s => s._id),
      capacity: effectiveCapacity,
      isTemplate: false
    });

    // Optionally update the showtime's own reference to this seatmap
    await Showtime.findByIdAndUpdate(showtimeId, { seatMap: seatmap._id });
    
    // Reload with populated seats
    seatmap = await Seatmap.findById(seatmap._id).populate("seats");
    
    res.json(seatmap);
  } catch (error) {
    console.error("Error isolating seatmap for showtime:", error);
    res.status(500).json({ message: error.message });
  }
};

// Hold seats (when user selects them)
exports.holdSeats = async (req, res) => {
  try {
    const { showtimeId, seatIds, userId } = req.body;
    const holdUntil = new Date(Date.now() + 10 * 1000); // 10 seconds hold time

    // Update seats to "Holding" status
    await Seat.updateMany(
      { _id: { $in: seatIds }, status: { $in: ["Available", "Holding"] } },
      { 
        $set: { 
          status: "Holding", 
          heldBy: userId, 
          heldUntil: holdUntil 
        } 
      }
    );

    res.json({ message: "Giữ ghế thành công", holdUntil });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Release held seats
exports.releaseSeats = async (req, res) => {
  try {
    const { seatIds } = req.body;

    // Release seats (set back to Available if not booked)
    await Seat.updateMany(
      { _id: { $in: seatIds }, status: "Holding" },
      { $set: { status: "Available", heldBy: null, heldUntil: null } }
    );

    res.json({ message: "Giải phóng ghế thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all held seats for a showtime (for real-time sync)
exports.getHeldSeats = async (req, res) => {
  try {
    const showtimeId = req.params.showtimeId;
    
    // Find the seatmap specifically for this isolated showtime
    // We sort by createdAt: -1 to get the most recent one in case of duplicates
    const seatmap = await Seatmap.findOne({ 
      showtimes: showtimeId,
      isTemplate: false 
    }).sort({ createdAt: -1 });

    if (!seatmap) {
      return res.json([]);
    }

    const now = new Date();
    
    // Auto-release expired seats in this seatmap before returning the list
    // Also release seats with null heldUntil if they are stuck in Holding status
    await Seat.updateMany(
      { 
        _id: { $in: seatmap.seats }, 
        status: "Holding", 
        $or: [
          { heldUntil: { $lte: now } },
          { heldUntil: null }
        ]
      },
      { 
        $set: { 
          status: "Available", 
          heldBy: null, 
          heldUntil: null 
        } 
      }
    );

    // Now find the seats that are STILL being held and haven't expired
    const heldSeats = await Seat.find({
      _id: { $in: seatmap.seats },
      status: "Holding",
      heldUntil: { $gt: now }
    });

    res.json(heldSeats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bookSeats = async (req, res) => {
  try {
    const { showtimeId, seatIds } = req.body;

    // Cập nhật trạng thái ghế
    await Seat.updateMany(
      { _id: { $in: seatIds }, status: { $in: ["Available", "Holding"] } },
      { $set: { status: "Booked", heldBy: null, heldUntil: null } }
    );

    res.json({ message: "Đặt vé thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
