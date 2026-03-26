const Seatmap = require("../models/seatmap");
const Seat = require("../models/seat");
const Room = require("../models/room");

// Helper function to build seat layout (can be used by other controllers)
// Each row has 10 seats, last row is couple seats
exports.buildSeatLayout = (totalSeats) => {
  const effectiveCapacity = Math.max(Number(totalSeats) || 0, 50); // Default 50 if 0
  const seatsPerRow = 10;
  const rowCount = Math.ceil(effectiveCapacity / seatsPerRow);
  const seats = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, D, E...
    const isLastRow = rowIndex === rowCount - 1;
    const seatsInThisRow = Math.min(seatsPerRow, effectiveCapacity - rowIndex * seatsPerRow);

    if (isLastRow && seatsInThisRow > 0) {
      // Last row: couple seats (2 at a time)
      // E1-2, E3-4, E5-6, E7-8, E9-10
      for (let i = 0; i < seatsInThisRow; i += 2) {
        seats.push({
          row: rowLetter,
          number: i + 1,
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
// Each row has 10 seats, last row is couple seats
exports.generateSeatLayout = async (req, res) => {
  try {
    const { roomId, capacity } = req.body;
    
    if (!roomId || !capacity) {
      return res.status(400).json({ message: "roomId and capacity are required" });
    }

    const totalSeats = parseInt(capacity);
    const seatsPerRow = 10;
    const rowCount = Math.ceil(totalSeats / seatsPerRow);
    const seats = [];

    // Generate seats for each row
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, D, E...
      const isLastRow = rowIndex === rowCount - 1;
      const seatsInThisRow = Math.min(seatsPerRow, totalSeats - rowIndex * seatsPerRow);

      if (isLastRow && seatsInThisRow > 0) {
        // Last row: couple seats (2 at a time)
        // E1-2, E3-4, E5-6, E7-8, E9-10
        for (let i = 0; i < seatsInThisRow; i += 2) {
          seats.push({
            row: rowLetter,
            number: i + 1,
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
    console.log("=== GET SEATMAP DEBUG ===");
    console.log("showtimeId:", showtimeId);
    
    // First, try to find seatmap by showtimes field (single ID, not array)
    let seatmap = await Seatmap.findOne({ showtimes: showtimeId })
      .populate("seats");
    console.log("Method 1 - by showtimes:", seatmap ? "found" : "not found");
    
    // If not found, try to get seatmap from showtime's seatMap field
    if (!seatmap) {
      const Showtime = require("../models/showtime");
      const showtime = await Showtime.findById(showtimeId);
      console.log("showtime.seatMap:", showtime?.seatMap);
      
      if (showtime?.seatMap) {
        seatmap = await Seatmap.findById(showtime.seatMap).populate("seats");
        console.log("Method 2 - by showtime.seatMap:", seatmap ? "found" : "not found");
      }
      // If still not found, try room's seatmapId
      else if (showtime?.roomId) {
        const Room = require("../models/room");
        const room = await Room.findById(showtime.roomId);
        console.log("room.seatmapId:", room?.seatmapId);
        if (room?.seatmapId) {
          seatmap = await Seatmap.findById(room.seatmapId).populate("seats");
          console.log("Method 3 - by room.seatmapId:", seatmap ? "found" : "not found");
        }
      }
    }
    
    // If still not found, try finding template seatmap for this room
    if (!seatmap) {
      const Showtime = require("../models/showtime");
      const showtime = await Showtime.findById(showtimeId).populate("roomId");
      console.log("showtime.roomId:", showtime?.roomId?._id || showtime?.roomId);
      
      if (showtime?.roomId) {
        // Find seatmap by roomId (any seatmap linked to this room)
        seatmap = await Seatmap.findOne({ 
          roomId: showtime.roomId._id || showtime.roomId
        }).populate("seats");
        console.log("Method 4 - by roomId:", seatmap ? "found" : "not found");
      }
    }
    
    // FIX: If seatmap exists but has NO seats or wrong count, auto-generate seats!
    if (seatmap) {
      const Showtime = require("../models/showtime");
      const showtime = await Showtime.findById(showtimeId);
      
      // Get room to know capacity - fetch fresh data!
      const Room = require("../models/room");
      const room = showtime?.roomId ? await Room.findById(showtime.roomId) : null;
      const expectedCapacity = room?.capacity || 60;
      console.log("Seatmap controller - Room capacity:", expectedCapacity, "Current seats:", seatmap.seats?.length);
      
      if (!seatmap.seats || seatmap.seats.length === 0 || seatmap.seats.length !== expectedCapacity) {
        console.log(`Seatmap has ${seatmap.seats?.length || 0} seats but expected ${expectedCapacity}! Regenerating...`);
        
        // Delete old seats first
        if (seatmap.seats?.length > 0) {
          await Seat.deleteMany({ _id: { $in: seatmap.seats } });
        }
        
        // Generate seats (inline version to avoid circular require)
        const effectiveCapacity = Math.max(Number(expectedCapacity) || 0, 50);
        const seatsPerRow = 10;
        const rowCount = Math.ceil(effectiveCapacity / seatsPerRow);
        const seatsData = [];
        
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
          const rowLetter = String.fromCharCode(65 + rowIndex);
          const isLastRow = rowIndex === rowCount - 1;
          const seatsInThisRow = Math.min(seatsPerRow, effectiveCapacity - rowIndex * seatsPerRow);
          
          if (isLastRow && seatsInThisRow > 0) {
            for (let i = 0; i < seatsInThisRow; i += 2) {
              seatsData.push({
                row: rowLetter,
                number: i + 1,
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
        
        // Update seatmap with new seats
        seatmap.seats = createdSeats.map(s => s._id);
        await seatmap.save();
        
        // Reload with populated seats
        seatmap = await Seatmap.findById(seatmap._id).populate("seats");
        console.log("Auto-generated seats:", seatmap.seats.length);
      }
      
      console.log("Final seatmap:", seatmap?._id);
      console.log("Seats count:", seatmap?.seats?.length);
      console.log("Seats array:", seatmap?.seats);
      
      res.json(seatmap);
    } else {
      // No seatmap found at all
      console.log("No seatmap found for showtime:", showtimeId);
      res.json(null);
    }
  } catch (error) {
    console.error("Error getting seatmap:", error);
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
    const seatmap = await Seatmap.findOne({ showtimes: req.params.showtimeId });
    if (!seatmap) {
      return res.json([]);
    }

    // Find seats that are being held and not expired
    const now = new Date();
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
