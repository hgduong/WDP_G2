const mongoose = require('mongoose');
const Seat = require('../models/seat');
const Seatmap = require('../models/seatmap');
const Room = require('../models/room');

// Connect to database
const db = require('../config/db');

async function regenerateAllSeats() {
  try {
    console.log('Starting seat regeneration...');
    
    // Get all rooms
    const rooms = await Room.find({});
    console.log(`Found ${rooms.length} rooms`);
    
    for (const room of rooms) {
      console.log(`\nProcessing room: ${room.name} (ID: ${room._id})`);
      console.log(`Capacity: ${room.capacity}`);
      
      // Find seatmap for this room
      let seatmap = await Seatmap.findOne({ roomId: room._id });
      
      if (!seatmap) {
        console.log(`No seatmap found for room ${room.name}, skipping...`);
        continue;
      }
      
      console.log(`Found seatmap with ${seatmap.seats?.length || 0} seats`);
      
      // Delete old seats
      if (seatmap.seats && seatmap.seats.length > 0) {
        await Seat.deleteMany({ _id: { $in: seatmap.seats } });
        console.log(`Deleted ${seatmap.seats.length} old seats`);
      }
      
      // Generate new seats with correct couple seat logic
      const totalSeats = room.capacity || 60;
      const seatsPerRow = 10;
      const seatsData = [];
      
      const totalRows = Math.ceil(totalSeats / seatsPerRow);
      
      for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        const rowLetter = String.fromCharCode(65 + rowIndex);
        const seatsInThisRow = Math.min(seatsPerRow, totalSeats - rowIndex * seatsPerRow);
        const isLastRow = rowIndex === totalRows - 1;
        
        if (isLastRow) {
          // Last row: couple seats (5 couple pairs = 10 seats)
          console.log(`Generating couple seats for last row ${rowLetter}`);
          for (let i = 0; i < 5; i++) {
            seatsData.push({
              row: rowLetter,
              number: (i * 2) + 1,
              type: "Couple",
              status: "Available"
            });
          }
        } else {
          // Other rows: standard seats (10 per row)
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
      
      // Insert new seats
      const createdSeats = await Seat.insertMany(seatsData);
      console.log(`Created ${createdSeats.length} new seats`);
      
      // Update seatmap with new seats
      seatmap.seats = createdSeats.map(s => s._id);
      await seatmap.save();
      
      console.log(`✓ Regenerated seats for room ${room.name}`);
    }
    
    console.log('\n✓ All rooms processed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error regenerating seats:', error);
    process.exit(1);
  }
}

// Run the script
regenerateAllSeats();
