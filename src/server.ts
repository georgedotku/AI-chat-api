import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';
import OpenAI from 'openai';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize StreamChat client
const chatClient = StreamChat.getInstance(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});
// Register user with StreamChat
app.post('/register', async (req: Request, res: Response): Promise<any> => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    try {
        const userId = email.replace(/[^a-zA-Z0-9_-]/g, '_');
        console.log(userId);
        // Check if user exists
        const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });

        if (!userResponse.users.length) {
            // Add new user to stream
            await chatClient.upsertUser({
                id: userId,
                name,
                email,
                role: 'user',
            });
        }
        res.status(200).json({ userId, name, email });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send message to OpenAI and get response
app.post('/chat', async (req: Request, res: Response): Promise<any> => {
    const { userId, message } = req.body;
    if (!userId || !message) {
        return res.status(400).json({ error: 'User ID and message are required' });
    }
    try {
        // Verify user exists
        const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });
        if (!userResponse.users.length) {
            return res.status(404).json({ error: 'User not found, register first' });
        }
        // Send message to OpenAI
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: message,
                }
            ]
        });
        console.log(response);
        res.send('success');
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.error(error);
    }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});