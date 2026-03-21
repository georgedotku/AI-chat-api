import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize StreamChat client
const chatClient = StreamChat.getInstance(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
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
        res.status(200).json({ message: 'Success' })
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});