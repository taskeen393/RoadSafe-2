import mongoose from 'mongoose';

const sosSchema = new mongoose.Schema({
    user: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
});

const Sos = mongoose.model('Sos', sosSchema);

export default Sos;
