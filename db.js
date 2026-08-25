const mongoose = require('mongoose');

/**
 * Connects to MongoDB for the newsletter subscriber collection.
 *
 * A failure here must not take the site down: every marketing page renders
 * without the database, and only /subscribe and /subscribers depend on it.
 * Those endpoints check isDBConnected() and answer 503 while it is down.
 */
const connectDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        console.log('MongoDB is already connected');
        return true;
    }

    try {
        await mongoose.connect(
            process.env.MONGODB_CONNECTION || 'mongodb://localhost:27017/newsletter',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
            }
        );
        console.log('MongoDB connected successfully');
        return true;
    } catch (error) {
        // Log and carry on — the site stays up in a degraded state.
        console.error('MongoDB unavailable, newsletter signup disabled:', error.message);
        return false;
    }
};

const isDBConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.isDBConnected = isDBConnected;
