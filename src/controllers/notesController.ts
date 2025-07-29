import { Router, Request, Response } from 'express';
import { Note } from '../models/Note';
import { IUser } from '../models/User';
import authMiddleware from '../middleware/auth';

const router = Router();

/**
 * @route GET /notes
 * @desc Fetch all notes for the authenticated user
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const notes = await Note.find({ userId: (req.user as IUser)!._id });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

/**
 * @route POST /notes
 * @desc Create a new note for the authenticated user
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }
  try {
    const note = new Note({
      title,
      content,
      userId: (req.user as IUser)!._id,
    });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

/**
 * @route DELETE /notes/:id
 * @desc Delete a note by ID for the authenticated user
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    if (note.userId.toString() !== (req.user as IUser)!._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await Note.deleteOne({ _id: req.params.id });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

export default router;
