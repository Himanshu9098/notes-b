import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, IUser } from './models/User';
import { Note } from './models/Note';
import { OTP } from './models/OTP';
import authMiddleware from './middleware/auth';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI!, {}).then(() => console.log('MongoDB connected'))
  .catch((err: Error) => console.error('MongoDB connection error:', err));

// Passport Configuration for Google OAuth (Signup or Login)
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/auth/google/callback',
}, async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      // Check if email already exists (e.g., from OTP registration)
      user = await User.findOne({ email: profile.emails![0].value });
      if (user) {
        // Update existing user with Google ID
        user.googleId = profile.id;
        user.name = user.name || profile.displayName; // Preserve existing name if set
        user.isVerified = true;
        await user.save();
      } else {
        // Create new user
        user = new User({
          googleId: profile.id,
          email: profile.emails![0].value,
          name: profile.displayName,
          isVerified: true,
        });
        await user.save();
      }
    }
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    return done(null, { user, token });
  } catch (err) {
    return done(err, false);
  }
}));

passport.serializeUser((userObj: any, done) => {
  done(null, userObj.user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

app.use(passport.initialize());

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Routes
app.post('/auth/register', async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ message: 'Email and name are required' });
  }
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ email, name, isVerified: false });
    await user.save();

    const otp = generateOTP();
    const otpDoc = new OTP({
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await otpDoc.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Registration',
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: 'OTP sent to email', userId: user._id.toString() });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

app.post('/auth/otp/send', async (req: Request, res: Response) => {
  const { email, action } = req.body;
  if (!email || !action || !['signup', 'login'].includes(action)) {
    return res.status(400).json({ message: 'Email and valid action (signup or login) are required' });
  }
  try {
    let user = await User.findOne({ email });
    let userId: string;

    if (action === 'signup' && user) {
      return res.status(400).json({ message: 'User already exists' });
    } else if (action === 'login' && !user) {
      return res.status(404).json({ message: 'User not found' });
    } else if (action === 'signup' && !user) {
      return res.status(400).json({ message: 'Please register first using /auth/register' });
    } else {
      userId = user!._id.toString();
    }

    const otp = generateOTP();
    const otpDoc = new OTP({
      userId,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await otpDoc.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your OTP for ${action === 'signup' ? 'Registration' : 'Login'}`,
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent to email', userId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

app.post('/auth/otp/verify', async (req: Request, res: Response) => {
  const { userId, otp, action } = req.body;
  if (!userId || !otp || !action || !['signup', 'login'].includes(action)) {
    return res.status(400).json({ message: 'userId, otp, and valid action (signup or login) are required' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otpDoc = await OTP.findOne({ userId, otp });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await OTP.deleteOne({ _id: otpDoc._id });

    if (action === 'signup') {
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id.toString(), email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  if (req.user && (req.user as any).token) {
    const user = (req.user as any).user;
    const token = (req.user as any).token;
    const userData = encodeURIComponent(JSON.stringify({ id: user._id.toString(), email: user.email, name: user.name }));
    res.redirect(`http://localhost:5173/dashboard?token=${token}&user=${userData}`);
  } else {
    res.redirect('http://localhost:5173/signin?error=Google%20authentication%20failed');
  }
});

app.get('/notes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const notes = await Note.find({ userId: (req.user as IUser)!._id });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

app.post('/notes', authMiddleware, async (req: Request, res: Response) => {
  console.log('POST /notes called', req.body, req.user);
  const { title, content } = req.body;
  if (!title || !content) {
    console.log('Missing title or content');
    return res.status(400).json({ message: 'Title and content are required' });
  }
  try {
    const note = new Note({
      title,
      content,
      userId: (req.user as IUser)!._id,
    });
    await note.save();
    console.log('Note saved:', note);
    res.status(201).json(note);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

app.delete('/notes/:id', authMiddleware, async (req: Request, res: Response) => {
  console.log('DELETE /notes/:id called', req.params.id, req.user);
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      console.log('Note not found');
      return res.status(404).json({ message: 'Note not found' });
    }
    if (note.userId.toString() !== (req.user as IUser)!._id.toString()) {
      console.log('Unauthorized delete attempt');
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await Note.deleteOne({ _id: req.params.id });
    console.log('Note deleted:', req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));