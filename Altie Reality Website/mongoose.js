require('dotenv').config()
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then((e) => {
    console.log('connection successful mongodb');
}).catch(() => {
    console.log('error came not connected');

})