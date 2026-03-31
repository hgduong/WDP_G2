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

    // Check if template seatmap already exists for this room
    const existingSeatmap = await Seatmap.findOne({ roomId, isTemplate: true });
    
    if (existingSeatmap) {
      return res.status(400).json({ 
        message: "Phòng này đã có bố cục ghế. Vui lòng xóa bố cục cũ trước khi tạo mới.",
        seatmapId: existingSeatmap._id
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

    // Create seatmap for the room
    const seatmap = await Seatmap.create({
      roomId: roomId,
      showtimes: null, // Will be linked when showtime is created
      seats: seatIds,
      isTemplate: true,
      capacity: seatIds.length
    });

    // Update room with seatmap reference
    await Room.findByIdAndUpdate(roomId, { seatmapId: seatmap._id });

    // Populate seats for response
    const populatedSeatmap = await Seatmap.findById(seatmap._id).populate("seats");

    res.json({
      message: "Seat layout created successfully",
      seatmap: populatedSeatmap,
      seats: populatedSeatmap.seats
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
      .populate("seats")
      .populate("seatStatuses");
    
    if (seatmap && seatmap.seats && seatmap.seats.length > 0) {
      // Merge seats with their statuses for this showtime
      const seatsWithStatus = seatmap.seats.map(seat => {
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

    // 2. No showtime-specific seatmap found. Use SHARED SEATS approach.
    const showtime = await Showtime.findById(showtimeId).populate("roomId");
    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    const room = showtime.roomId;
    
    // 3. Find the TEMPLATE seatmap for this room (shared seats)
    console.log(`Creating seatmap for showtime ${showtimeId} using shared seats from room ${room?.name}`);
    
    const templateSeatmap = await Seatmap.findOne({ roomId: room._id, isTemplate: true })
      .populate("seats");
    
    if (!templateSeatmap || !templateSeatmap.seats || templateSeatmap.seats.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bố cục ghế cho phòng này. Vui lòng tạo bố cục ghế trước." });
    }
    
    // 4. Create SeatStatus for each SHARED seat in this showtime
    const seatStatusesData = templateSeatmap.seats.map(seat => ({
      seatId: seat._id,
      showtimeId: showtimeId,
      status: 'Available',
      price: calculateSeatPrice(seat.type, showtime.startTime)
    }));
    
    const createdStatuses = await SeatStatus.insertMany(seatStatusesData);
    
    // 5. Create seatmap for this showtime that REFERENCES the shared seats
    seatmap = await Seatmap.create({
      roomId: room._id,
      showtimes: showtimeId,
      seats: templateSeatmap.seats.map(s => s._id),  // Reference to SHARED seats
      seatStatuses: createdStatuses.map(s => s._id),
      capacity: templateSeatmap.capacity,
      isTemplate: false
    });

    // Update the showtime's reference to this seatmap
    await Showtime.findByIdAndUpdate(showtimeId, { seatMap: seatmap._id });
    
    // Reload with populated seats and seatStatuses
    seatmap = await Seatmap.findById(seatmap._id)
      .populate("seats")
      .populate("seatStatuses");
    
    // Merge seats with their statuses
    const seatsWithStatus = seatmap.seats.map(seat => {
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

// Get seats by room (from seatmap template)
exports.getSeatsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Find the template seatmap for this room
    const seatmap = await Seatmap.findOne({ roomId, isTemplate: true })
      .populate("seats");
    
    if (!seatmap) {
      return res.status(404).json({ message: "Không tìm thấy bố cục ghế cho phòng này" });
    }
    
    res.json({
      seatmapId: seatmap._id,
      seats: seatmap.seats,
      capacity: seatmap.capacity
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
    
    // Remove seat from all seatmaps (template and showtime-specific)
    await Seatmap.updateMany(
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
    
    // Find the template seatmap for this room
    const seatmap = await Seatmap.findOne({ roomId, isTemplate: true });
    
    if (!seatmap) {
      return res.status(404).json({ message: "Không tìm thấy bố cục ghế cho phòng này" });
    }
    
    // Check if seat with same row/number already exists (reuse it)
    let seat = await Seat.findOne({ row, number: parseInt(number) });
    
    if (seat) {
      // Seat already exists, check if it's already in this seatmap
      if (seatmap.seats.includes(seat._id)) {
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
    
    // Add seat to seatmap
    seatmap.seats.push(seat._id);
    seatmap.capacity = seatmap.seats.length;
    await seatmap.save();
    
    // Update room capacity
    await Room.findByIdAndUpdate(roomId, { capacity: seatmap.capacity });
    
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
