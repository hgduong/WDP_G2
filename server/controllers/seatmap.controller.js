const Seatmap = require("../models/seatmap");
const Seat = require("../models/seat");

exports.getSeatmapByShowtime = async (req, res) => {
  try {
    const seatmap = await Seatmap.findOne({ showtimeId: req.params.showtimeId })
      .populate("seats");
    res.json(seatmap);
  } catch (error) {
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
    const seatmap = await Seatmap.findOne({ showtimeId: req.params.showtimeId });
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
