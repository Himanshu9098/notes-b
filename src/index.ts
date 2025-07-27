import express, { Request, Response } from 'express';

const app = express();
const PORT = 3001; // Choose a port for your backend

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the backend!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});