const mongoose = require('mongoose');
require('dotenv').config();
const Seat = require('../models/seat');

const dropLegacySeatIndexes = async () => {
    try {
        const indexes = await Seat.collection.indexes();
        const legacyIndex = indexes.find((index) => index.name === 'roomId_1_row_1_number_1');

        if (!legacyIndex) {
            return;
        }

        await Seat.collection.dropIndex(legacyIndex.name);
        console.log(`Dropped legacy seat index: ${legacyIndex.name}`);
    } catch (error) {
        // NamespaceNotFound means the seats collection has not been created yet.
        if (error?.code === 26) {
            return;
        }

        console.error('Failed to reconcile seat indexes:', error);
        throw error;
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
        await dropLegacySeatIndexes();
    } catch (error) {
        console.error("MongoDB connection failed: ", error);
        process.exit(1);
    }
};

module.exports = connectDB;
