import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '../models/User';
import { OTP } from '../models/OTP';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email';
import { generateOTP } from '../utils/otp';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register a new user and send OTP for verification
 */
router.post('/register', async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ message: 'Email and name are required' });
  }
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ email, name, isVerified: false });
    await user.save();

    const otp = generateOTP();
    const otpDoc = new OTP({
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      createdAt: new Date(), // Explicitly set for clarity
    });
    await otpDoc.save();

    await sendEmail({
      to: email,
      subject: 'Your OTP for Registration',
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });

    res.status(201).json({ message: 'OTP sent to email', userId: user._id.toString() });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

/**
 * @route POST /auth/otp/send
 * @desc Send OTP for signup or login
 */
router.post('/otp/send', async (req: Request, res: Response) => {
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

    // Enforce 30-second cooldown for OTP requests
    const recentOtp = await OTP.findOne({
      userId,
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) }, // OTPs created in last 30 seconds
    });
    if (recentOtp) {
      const timeElapsed = Date.now() - recentOtp.createdAt.getTime();
      const remainingSeconds = Math.ceil((30 * 1000 - timeElapsed) / 1000);
      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
      });
    }

    const otp = generateOTP();
    const otpDoc = new OTP({
      userId,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      createdAt: new Date(), // Explicitly set for clarity
    });
    await otpDoc.save();

    await sendEmail({
      to: email,
      subject: `Your OTP for HD account ${action === 'signup' ? 'Registration' : 'Login'}`,
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });

    res.json({ message: 'OTP sent to email', userId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

/**
 * @route POST /auth/otp/verify
 * @desc Verify OTP and generate JWT token
 */
router.post('/otp/verify', async (req: Request, res: Response) => {
  const { userId, otp, action, keepLoggedIn } = req.body;
  if (!userId || !otp || !action || !['signup', 'login'].includes(action)) {
    return res.status(400).json({ message: 'userId, otp, and valid action (signup or login) are required' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpDoc = await OTP.findOne({ userId, otp });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await OTP.deleteOne({ _id: otpDoc._id });

    if (action === 'signup') {
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, {
      expiresIn: action === 'login' && keepLoggedIn ? '7d' : '1h',
    });

    res.json({
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

/**
 * @route GET /auth/google
 * @desc Initiate Google OAuth authentication
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @route GET /auth/google/callback
 * @desc Handle Google OAuth callback
 */
router.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
  const keepLoggedIn = req.query.keepLoggedIn === 'true';
  passport.authenticate('google', { session: false }, (err: any, userObj: any) => {
    if (err || !userObj || !userObj.token) {
      return res.redirect(`${process.env.FRONTEND_URL}/signin?error=Google%20authentication%20failed`);
    }
    const user = userObj.user;
    const token = userObj.token;
    const userData = encodeURIComponent(JSON.stringify({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    }));
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}&user=${userData}`);
  })(req, res, next);
});

export default router;