import express from 'express';
import { auth } from '../middleware/auth.js';
import { pool } from '../index.js';
import { startOfWeek, endOfWeek, format } from 'date-fns';

const router = express.Router();

// GET /api/bids/stats/weekly
router.get('/stats/weekly', auth, async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start from Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    // Get all users first
    const [users] = await pool.query('SELECT id, name FROM users');

    // Query for freelancer bids
    const freelancerQuery = `
      SELECT 
        u.name as username,
        DATE(b.created_at) as bid_date,
        COUNT(CASE WHEN b.status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN b.status = 'chat' THEN 1 END) as chat,
        COUNT(CASE WHEN b.status = 'offer' THEN 1 END) as offer
      FROM users u
      LEFT JOIN freelancer_bids b ON u.id = b.user_id AND b.created_at BETWEEN ? AND ?
      WHERE u.id = ?
      GROUP BY u.name, DATE(b.created_at)
    `;

    // Query for upwork bids
    const upworkQuery = `
      SELECT 
        u.name as username,
        DATE(b.created_at) as bid_date,
        COUNT(CASE WHEN b.status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN b.status = 'chat' THEN 1 END) as chat,
        COUNT(CASE WHEN b.status = 'offer' THEN 1 END) as offer
      FROM users u
      LEFT JOIN upwork_bids b ON u.id = b.user_id AND b.created_at BETWEEN ? AND ?
      WHERE u.id = ?
      GROUP BY u.name, DATE(b.created_at)
    `;

    // Initialize stats objects with all users
    const freelancerStats = {};
    const upworkStats = {};
    users.forEach(user => {
      freelancerStats[user.name] = {};
      upworkStats[user.name] = {};
    });

    // Get stats for each user
    for (const user of users) {
      // Get freelancer stats
      const [freelancerResults] = await pool.query(freelancerQuery, [weekStart, weekEnd, user.id]);
      freelancerResults.forEach(row => {
        if (row.bid_date) {
          freelancerStats[row.username][format(new Date(row.bid_date), 'yyyy-MM-dd')] = {
            sent: parseInt(row.sent) || 0,
            chat: parseInt(row.chat) || 0,
            offer: parseInt(row.offer) || 0
          };
        }
      });

      // Get upwork stats
      const [upworkResults] = await pool.query(upworkQuery, [weekStart, weekEnd, user.id]);
      upworkResults.forEach(row => {
        if (row.bid_date) {
          upworkStats[row.username][format(new Date(row.bid_date), 'yyyy-MM-dd')] = {
            sent: parseInt(row.sent) || 0,
            chat: parseInt(row.chat) || 0,
            offer: parseInt(row.offer) || 0
          };
        }
      });
    }

    res.json({
      freelancer: freelancerStats,
      upwork: upworkStats
    });
  } catch (error) {
    console.error('Error fetching bid stats:', error);
    res.status(500).json({ message: 'Failed to fetch bid statistics' });
  }
});

export default router; 