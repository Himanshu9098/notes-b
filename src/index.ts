import jwt from 'jsonwebtoken';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, IUser } from './models/User';
import authRoutes from './controllers/authController';
import notesRoutes from './controllers/notesController';
import { transporter } from './utils/email';

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
app.use(passport.initialize());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch((err: Error) => console.error('MongoDB connection error:', err));

// Passport Configuration for Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/auth/google/callback',
}, async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email: profile.emails![0].value });
      if (user) {
        user.googleId = profile.id;
        user.name = user.name || profile.displayName;
        user.isVerified = true;
        await user.save();
      } else {
        user = new User({
          googleId: profile.id,
          email: profile.emails![0].value,
          name: profile.displayName,
          isVerified: true,
        });
        await user.save();
      }
    }
    const keepLoggedIn = profile._json.keepLoggedIn === 'true';
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, {
      expiresIn: keepLoggedIn ? '7d' : '1h',
    });
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

// Routes
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
