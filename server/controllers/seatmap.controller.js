const Seatmap = require("../models/seatmap");
const Seat = require("../models/seat");
const SeatStatus = require("../models/seatStatus");
const Room = require("../models/room");

// Helper function to build seat layout (can be used by other controllers)
exports.buildSeatLayout = (totalSeats) => {
  const effectiveCapacity = Math.max(Number(totalSeats) || 0, 50); // Default 50 if 0
  const seatsPerRow = 10;
  const seats = [];

  // Generate all seats
  const totalRows = Math.ceil(effectiveCapacity / seatsPerRow);
  
  for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
    const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, D, E...
    const seatsInThisRow = Math.min(seatsPerRow, effectiveCapacity - rowIndex * seatsPerRow);
    
    // All rows: standard seats (10 per row)
    // A1-A10, B1-B10, C1-C10, D1-D10...
    for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
      seats.push({
        row: rowLetter,
        number: seatNum,
        type: "Standard"
        // status removed - tracked in SeatStatus per showtime
      });
    }
  }

  return seats;
};

// Generate seat layout based on room capacity
exports.generateSeatLayout = async (req, res) => {
  try {
    const { roomId, capacity } = req.body;
    
    if (!roomId || !capacity) {
      return res.status(400).json({ message: "roomId and capacity are required" });
    }

    // Check if room already has seats
    const existingRoom = await Room.findById(roomId);
    if (existingRoom && existingRoom.seats && existingRoom.seats.length > 0) {
      return res.status(400).json({ 
        message: "Phòng này đã có bố cục ghế. Vui lòng xóa bố cục cũ trước khi tạo mới.",
        roomId: existingRoom._id
      });
    }

    const totalSeats = parseInt(capacity);
    const seatsPerRow = 10;
    const seatIds = [];

    // Generate all seats
    const totalRows = Math.ceil(totalSeats / seatsPerRow);
    
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, D, E...
      const seatsInThisRow = Math.min(seatsPerRow, totalSeats - rowIndex * seatsPerRow);
      
      // All rows: standard seats (10 per row)
      // A1-A10, B1-B10, C1-C10, D1-D10...
      for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
        // Check if seat with same row/number already exists (reuse it)
        let seat = await Seat.findOne({ row: rowLetter, number: seatNum });
        
        if (!seat) {
          // Create new seat only if it doesn't exist
          seat = await Seat.create({
            row: rowLetter,
            number: seatNum,
            type: "Standard"
          });
        }
        
        seatIds.push(seat._id);
      }
    }

    // Update room with seats
    await Room.findByIdAndUpdate(roomId, { 
      seats: seatIds,
      capacity: seatIds.length
    });

    // Populate seats for response
    const populatedRoom = await Room.findById(roomId).populate("seats");

    res.json({
      message: "Seat layout created successfully",
      room: populatedRoom,
      seats: populatedRoom.seats
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Ghế đã tồn tại trong hệ thống. Vui lòng kiểm tra lại." 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getSeatmapByShowtime = async (req, res) => {
  try {
    const showtimeId = req.params.showtimeId;
    const Showtime = require("../models/showtime");
    const Room = require("../models/room");
    
    // 1. Try to find an existing seatmap specifically for this showtime
    let seatmap = await Seatmap.findOne({ showtimes: showtimeId })
      .populate("seatStatuses");
    
    if (seatmap) {
      // Get seats from Room
      const room = await Room.findById(seatmap.roomId).populate("seats");
      
      if (!room || !room.seats || room.seats.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy bố cục ghế cho phòng này. Vui lòng tạo bố cục ghế trước." });
      }
      
      // Merge seats with their statuses for this showtime
      const seatsWithStatus = room.seats.map(seat => {
        const status = seatmap.seatStatuses.find(
          s => s.seatId.toString() === seat._id.toString()
        );
        return {
          ...seat.toObject(),
          status: status?.status || 'Available',
          price: status?.price || 0,
          heldBy: status?.heldBy,
          heldUntil: status?.heldUntil,
          bookedBy: status?.bookedBy
        };
      });
      
      return res.json({
        ...seatmap.toObject(),
        seats: seatsWithStatus
      });
    }

    // 2. No showtime-specific seatmap found. Create one using seats from Room.
    const showtime = await Showtime.findById(showtimeId).populate("roomId");
    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    const room = showtime.roomId;
    
    // 3. Get seats from Room
    console.log(`Creating seatmap for showtime ${showtimeId} using seats from room ${room?.name}`);
    
    const roomWithSeats = await Room.findById(room._id).populate("seats");
    
    if (!roomWithSeats || !roomWithSeats.seats || roomWithSeats.seats.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bố cục ghế cho phòng này. Vui lòng tạo bố cục ghế trước." });
    }
    
    // 4. Create SeatStatus for each seat in this showtime
    const seatStatusesData = roomWithSeats.seats.map(seat => ({
      seatId: seat._id,
      showtimeId: showtimeId,
      status: 'Available',
      price: calculateSeatPrice(seat.type, showtime.startTime)
    }));
    
    const createdStatuses = await SeatStatus.insertMany(seatStatusesData);
    
    // 5. Create seatmap for this showtime
    seatmap = await Seatmap.create({
      roomId: room._id,
      showtimes: showtimeId,
      seatStatuses: createdStatuses.map(s => s._id),
      capacity: roomWithSeats.seats.length
    });

    // Update the showtime's reference to this seatmap
    await Showtime.findByIdAndUpdate(showtimeId, { seatMap: seatmap._id });
    
    // Reload with populated seatStatuses
    seatmap = await Seatmap.findById(seatmap._id)
      .populate("seatStatuses");
    
    // Merge seats with their statuses
    const seatsWithStatus = roomWithSeats.seats.map(seat => {
      const status = seatmap.seatStatuses.find(
        s => s.seatId.toString() === seat._id.toString()
      );
      return {
        ...seat.toObject(),
        status: status?.status || 'Available',
        price: status?.price || 0,
        heldBy: status?.heldBy,
        heldUntil: status?.heldUntil,
        bookedBy: status?.bookedBy
      };
    });
    
    res.json({
      ...seatmap.toObject(),
      seats: seatsWithStatus
    });
  } catch (error) {
    console.error("Error isolating seatmap for showtime:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate seat price based on type and showtime
const calculateSeatPrice = (seatType, showtimeStart) => {
  let basePrice = 50000; // Base price for Standard seat
  
  // Adjust price by seat type
  if (seatType === 'VIP') basePrice = 80000;
  if (seatType === 'Couple') basePrice = 120000;
  
  // Adjust price by time of day (evening shows cost more)
  if (showtimeStart) {
    const hour = new Date(showtimeStart).getHours();
    if (hour >= 18 || hour < 6) {
      basePrice *= 1.2; // 20% increase for evening/night shows
    }
  }
  
  return Math.round(basePrice);
};

// Hold seats (when user selects them)
exports.holdSeats = async (req, res) => {
  try {
    const { showtimeId, seatIds, userId } = req.body;
    const holdUntil = new Date(Date.now() + 10 * 1000); // 10 seconds hold time

    // Update SeatStatus to "Holding" status
    await SeatStatus.updateMany(
      { 
        seatId: { $in: seatIds }, 
        showtimeId: showtimeId,
        status: { $in: ["Available", "Holding"] } 
      },
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
    const { showtimeId, seatIds } = req.body;

    // Release seats on SeatStatus (set back to Available if not booked)
    await SeatStatus.updateMany(
      { 
        seatId: { $in: seatIds }, 
        showtimeId: showtimeId,
        status: "Holding" 
      },
      { 
        $set: { 
          status: "Available", 
          heldBy: null, 
          heldUntil: null 
        } 
      }
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
    const now = new Date();
    
    // Auto-release expired holds on SeatStatus before returning the list
    // Also release seats with null heldUntil if they are stuck in Holding status
    await SeatStatus.updateMany(
      { 
        showtimeId: showtimeId,
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
    const heldSeatStatuses = await SeatStatus.find({
      showtimeId: showtimeId,
      status: "Holding",
      heldUntil: { $gt: now }
    }).populate('seatId');

    res.json(heldSeatStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bookSeats = async (req, res) => {
  try {
    const { showtimeId, seatIds, bookingId, userId } = req.body;

    // Cập nhật trạng thái ghế trên SeatStatus
    await SeatStatus.updateMany(
      { 
        seatId: { $in: seatIds }, 
        showtimeId: showtimeId,
        status: { $in: ["Available", "Holding"] } 
      },
      { 
        $set: { 
          status: "Booked", 
          bookedBy: userId,
          bookingId: bookingId,
          heldBy: null, 
          heldUntil: null 
        } 
      }
    );

    res.json({ message: "Đặt vé thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get seats by room (from Room directly)
exports.getSeatsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Find the room and populate seats
    const room = await Room.findById(roomId).populate("seats");
    
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    if (!room.seats || room.seats.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bố cục ghế cho phòng này" });
    }
    
    res.json({
      roomId: room._id,
      seats: room.seats,
      capacity: room.capacity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update seat (type, row, number)
exports.updateSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    const { type, row, number } = req.body;
    
    const updateData = {};
    if (type) updateData.type = type;
    if (row) updateData.row = row;
    if (number) updateData.number = parseInt(number);
    
    // Check if another seat with same row/number already exists
    if (row || number) {
      const currentSeat = await Seat.findById(seatId);
      if (!currentSeat) {
        return res.status(404).json({ message: "Không tìm thấy ghế" });
      }
      
      const checkRow = row || currentSeat.row;
      const checkNumber = number ? parseInt(number) : currentSeat.number;
      
      const existingSeat = await Seat.findOne({ 
        row: checkRow, 
        number: checkNumber,
        _id: { $ne: seatId } // Exclude current seat
      });
      
      if (existingSeat) {
        return res.status(400).json({ 
          message: `Ghế ${checkRow}${checkNumber} đã tồn tại trong hệ thống` 
        });
      }
    }
    
    const seat = await Seat.findByIdAndUpdate(seatId, updateData, { new: true });
    
    if (!seat) {
      return res.status(404).json({ message: "Không tìm thấy ghế" });
    }
    
    res.json(seat);
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: `Ghế ${req.body.row}${req.body.number} đã tồn tại trong hệ thống` 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete seat
exports.deleteSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    
    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.status(404).json({ message: "Không tìm thấy ghế" });
    }
    
    // Remove seat from all rooms
    await Room.updateMany(
      { seats: seatId },
      { $pull: { seats: seatId } }
    );
    
    // Delete all SeatStatus entries for this seat
    await SeatStatus.deleteMany({ seatId: seatId });
    
    // Delete the seat
    await Seat.findByIdAndDelete(seatId);
    
    res.json({ message: "Xóa ghế thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new seat to room (reuses existing seat if row/number already exists)
exports.addSeat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { row, number, type } = req.body;
    
    if (!row || !number) {
      return res.status(400).json({ message: "Vui lòng nhập hàng và số ghế" });
    }
    
    // Find the room
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    // Check if seat with same row/number already exists (reuse it)
    let seat = await Seat.findOne({ row, number: parseInt(number) });
    
    if (seat) {
      // Seat already exists, check if it's already in this room
      if (room.seats && room.seats.includes(seat._id)) {
        return res.status(400).json({ 
          message: `Ghế ${row}${number} đã tồn tại trong phòng này` 
        });
      }
      
      // Update seat type if provided and different
      if (type && seat.type !== type) {
        seat.type = type;
        await seat.save();
      }
    } else {
      // Create new seat
      seat = await Seat.create({
        row,
        number: parseInt(number),
        type: type || "Standard"
      });
    }
    
    // Add seat to room
    if (!room.seats) {
      room.seats = [];
    }
    room.seats.push(seat._id);
    room.capacity = room.seats.length;
    await room.save();
    
    res.status(201).json(seat);
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: `Ghế ${req.body.row}${req.body.number} đã tồn tại trong hệ thống` 
      });
    }
    res.status(500).json({ message: error.message });
  }
};
