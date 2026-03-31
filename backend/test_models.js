import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function test() {
    try {
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const models = res.data.models.map(m => m.name).filter(m => m.includes('gemini'));
        console.log("Models:", models);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
test();
