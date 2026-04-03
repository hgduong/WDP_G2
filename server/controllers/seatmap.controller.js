const Seat = require("../models/seat");
const SeatStatus = require("../models/seatStatus");
const Room = require("../models/room");

// Helper function to build seat layout (can be used by other controllers)
exports.buildSeatLayout = (totalSeats) => {
  const effectiveCapacity = Math.max(Number(totalSeats) || 0, 50); // Default 50 if 0
  const seatsPerRow = 10;
  const seats = [];
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
        // Check if seat with same row/number already exists in this room (reuse it)
        let seat = await Seat.findOne({ roomId: roomId, row: rowLetter, number: seatNum });
        
        if (!seat) {
          // Create new seat only if it doesn't exist in this room
          seat = await Seat.create({
            roomId: roomId,
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

    return res.json({
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
    
    // 1. Find the showtime
    const showtime = await Showtime.findById(showtimeId).populate("roomId");
    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    const room = showtime.roomId;
    
    // 2. Get seats from Room
    const roomWithSeats = await Room.findById(room._id).populate("seats");
    
    if (!roomWithSeats || !roomWithSeats.seats || roomWithSeats.seats.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bố cục ghế cho phòng này. Vui lòng tạo bố cục ghế trước." });
    }
    
    // 3. Get existing seatStatuses for this showtime
    let seatStatuses = await SeatStatus.find({ showtimeId: showtimeId });
    
    // 4. If no seatStatuses exist, create them for each seat
    if (!seatStatuses || seatStatuses.length === 0) {
      const seatStatusesData = roomWithSeats.seats.map(seat => ({
        seatId: seat._id,
        showtimeId: showtimeId,
        status: 'Available',
        price: calculateSeatPrice(seat.type, showtime.startTime)
      }));
      
      seatStatuses = await SeatStatus.insertMany(seatStatusesData);
      
      // Update showtime with seatStatuses references
      await Showtime.findByIdAndUpdate(showtimeId, { 
        seatStatuses: seatStatuses.map(s => s._id) 
      });
    }
    
    // 5. Merge seats with their statuses
    const seatsWithStatus = roomWithSeats.seats.map(seat => {
      const status = seatStatuses.find(
        s => s.seatId.toString() === seat._id.toString()
      );
      return {
        ...seat.toObject(),
        status: status?.status || 'Available',
        price: status?.price || 0,
        heldBy: status?.heldBy,
        heldUntil: status?.heldUntil,
        bookedBy: status?.bookedBy,
        couplePairId: seat.couplePairId || null
      };
    });
    
    res.json({
      roomId: room._id,
      showtimeId: showtimeId,
      seats: seatsWithStatus,
      capacity: roomWithSeats.seats.length
    });
  } catch (error) {
    console.error("Error getting seatmap for showtime:", error);
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

    // Get all seats to check for couple pairs
    const seats = await Seat.find({ _id: { $in: seatIds } });
    const allSeatIds = [...seatIds];
    
    // For couple seats, also add their pair seats
    for (const seat of seats) {
      if (seat.type === 'Couple' && seat.couplePairId) {
        if (!allSeatIds.includes(seat.couplePairId.toString())) {
          allSeatIds.push(seat.couplePairId);
        }
      }
    }

    // Update SeatStatus to "Holding" status
    await SeatStatus.updateMany(
      { 
        seatId: { $in: allSeatIds }, 
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

    // Get all seats to check for couple pairs
    const seats = await Seat.find({ _id: { $in: seatIds } });
    const allSeatIds = [...seatIds];
    
    // For couple seats, also add their pair seats
    for (const seat of seats) {
      if (seat.type === 'Couple' && seat.couplePairId) {
        if (!allSeatIds.includes(seat.couplePairId.toString())) {
          allSeatIds.push(seat.couplePairId);
        }
      }
    }

    // Release seats on SeatStatus (set back to Available if not booked)
    await SeatStatus.updateMany(
      { 
        seatId: { $in: allSeatIds }, 
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
    await session.abortTransaction();
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to release seats" });
  } finally {
    session.endSession();
  }
};

exports.bookSeats = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { showtimeId, seatIds, bookingId, userId } = req.body;

    // Get all seats to check for couple pairs
    const seats = await Seat.find({ _id: { $in: seatIds } });
    const allSeatIds = [...seatIds];
    
    // For couple seats, also add their pair seats
    for (const seat of seats) {
      if (seat.type === 'Couple' && seat.couplePairId) {
        if (!allSeatIds.includes(seat.couplePairId.toString())) {
          allSeatIds.push(seat.couplePairId);
        }
      }
    }

    // Cập nhật trạng thái ghế trên SeatStatus
    await SeatStatus.updateMany(
      { 
        seatId: { $in: allSeatIds }, 
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
    
    // Include couplePairId in response
    const seatsWithCoupleInfo = room.seats.map(seat => ({
      ...seat.toObject(),
      couplePairId: seat.couplePairId || null
    }));
    
    res.json({
      roomId: room._id,
      seats: seatsWithCoupleInfo,
      capacity: room.capacity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update seat (type, row, number, status, couplePairId)
exports.updateSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    const { type, row, number, status, couplePairId } = req.body;
    
    console.log('updateSeat called with:', { seatId, type, row, number, status, couplePairId });
    
    const updateData = {};
    if (type) updateData.type = type;
    if (row) updateData.row = row;
    if (number) updateData.number = parseInt(number);
    if (status) updateData.status = status;
    // Always set couplePairId, even if null
    updateData.couplePairId = couplePairId === undefined ? null : couplePairId;
    
    console.log('updateData:', updateData);
    
    // Check if another seat with same row/number already exists in the same room
    if (row || number) {
      const currentSeat = await Seat.findById(seatId);
      if (!currentSeat) {
        return res.status(404).json({ message: "Không tìm thấy ghế" });
      }
      
      const checkRow = row || currentSeat.row;
      const checkNumber = number ? parseInt(number) : currentSeat.number;
      
      const existingSeat = await Seat.findOne({ 
        roomId: currentSeat.roomId,
        row: checkRow, 
        number: checkNumber,
        _id: { $ne: seatId } // Exclude current seat
      });
      
      if (existingSeat) {
        return res.status(400).json({ 
          message: `Ghế ${checkRow}${checkNumber} đã tồn tại trong phòng này` 
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
    
    // If this is a couple seat, update the pair seat
    if (seat.type === 'Couple' && seat.couplePairId) {
      await Seat.findByIdAndUpdate(seat.couplePairId, {
        type: 'Standard',
        couplePairId: null
      });
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
    const { row, number, type, status, couplePairId } = req.body;
    
    if (!row || !number) {
      return res.status(400).json({ message: "Vui lòng nhập hàng và số ghế" });
    }
    
    // Find the room
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    // Check if seat with same row/number already exists in this room
    let seat = await Seat.findOne({ roomId: roomId, row, number: parseInt(number) });
    
    if (seat) {
      // Seat already exists in this room
      return res.status(400).json({ 
        message: `Ghế ${row}${number} đã tồn tại trong phòng này` 
      });
    }
    
    // Create new seat for this room
    seat = await Seat.create({
      roomId: roomId,
      row,
      number: parseInt(number),
      type: type || "Standard",
      status: status || "Available",
      couplePairId: couplePairId || null
    });
    
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
