const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState === 0) { // 0 means disconnected
        try {
            await mongoose.connect('mongodb://localhost:27017/newsletter', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1); // Exit the process with failure
        }
    } else {
        console.log('MongoDB is already connected');
    }
};

module.exports = connectDB; 