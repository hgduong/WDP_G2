const Seatmap = require("../models/seatmap");

exports.getSeatmapByShowtime = async (req, res) => {
  try {
    const seatmap = await Seatmap.findOne({ showtimeId: req.params.showtimeId })
      .populate("seats");
    res.json(seatmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bookSeats = async (req, res) => {
  try {
    const { showtimeId, seatIds } = req.body;

    // Cập nhật trạng thái ghế
    await Seat.updateMany(
      { _id: { $in: seatIds }, status: "Available" },
      { $set: { status: "Booked" } }
    );

    res.json({ message: "Đặt vé thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
