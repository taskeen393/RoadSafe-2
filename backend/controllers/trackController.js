import Sos from '../models/Sos.js';

export const createSos = async (req, res) => {
    try {
        const { user, message } = req.body;
        if (!user || !message) return res.status(400).json({ error: 'User and message required' });

        const newSos = new Sos({ user, message });
        await newSos.save();

        res.json({ success: true, sos: newSos });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getSosEvents = async (req, res) => {
    try {
        const sosEvents = await Sos.find().sort({ timestamp: -1 });
        res.json(sosEvents);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
