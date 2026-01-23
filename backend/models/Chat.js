import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    user: String,
    message: String,
    response: String,
    dateTime: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema, 'Chats');

export default Chat;
