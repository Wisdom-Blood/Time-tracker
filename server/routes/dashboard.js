import express from 'express';
import { pool } from '../index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Get total active users
    const [userCount] = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role != "admin"'
    );

    // Get total monthly plan (sum of target_money from all active users)
    const [monthlyPlan] = await pool.query(
      'SELECT SUM(target_money) as total FROM users WHERE role != "admin"'
    );

    // Get current month's top performer
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const [topUser] = await pool.query(
      `SELECT 
        u.name,
        SUM(r.working_hours) as total_hours
      FROM users u
      JOIN work_reports r ON u.id = r.user_id
      WHERE 
        DATE_FORMAT(r.report_date, '%Y-%m') = ?
        AND u.role != 'admin'
      GROUP BY u.id, u.name
      ORDER BY total_hours DESC
      LIMIT 1`,
      [currentMonth]
    );

    // Calculate monthly progress
    const [monthlyProgress] = await pool.query(
      `SELECT 
        (SUM(r.working_hours) / (
          SELECT SUM(
            CASE 
              WHEN DAYOFWEEK(dates.date) = 1 THEN 8  -- Sunday
              ELSE 16                                 -- Other days
            END
          )
          FROM (
            SELECT DATE_ADD(DATE_SUB(LAST_DAY(?), INTERVAL DAY(LAST_DAY(?)) - 1 DAY),
                   INTERVAL numbers.n - 1 DAY) as date
            FROM (
              SELECT ones.n + tens.n * 10 + 1 as n
              FROM
                (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
                (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) tens
              WHERE ones.n + tens.n * 10 < DAY(LAST_DAY(?))
            ) numbers
          ) dates
          WHERE DAYOFWEEK(dates.date) NOT IN (7)  -- Exclude Saturday
        )) * 100 as progress
      FROM work_reports r
      WHERE DATE_FORMAT(r.report_date, '%Y-%m') = ?`,
      [currentMonth, currentMonth, currentMonth, currentMonth]
    );

    res.json({
      totalUsers: userCount[0].total,
      monthlyPlan: monthlyPlan[0].total || 0,
      monthlyProgress: Math.round(monthlyProgress[0].progress || 0),
      topUser: topUser[0]?.name || 'N/A'
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get weekly bid statistics
router.get('/weekly-bids', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // First get all users with role 'user'
    const [users] = await pool.query(
      'SELECT id, name FROM users WHERE role = "user" ORDER BY name'
    );

    // Get all users' freelancer bids stats
    const freelancerBidsQuery = `
      SELECT 
        u.name as user_name,
        DATE(fb.bid_date) as date,
        SUM(fb.bid_number) as bid_count,
        COUNT(*) as row_count
      FROM users u
      LEFT JOIN freelancer_bids fb ON fb.user_id = u.id 
        AND fb.bid_date BETWEEN ? AND ?
      WHERE u.role = 'user'
      GROUP BY u.name, DATE(fb.bid_date)
    `;

    // Get all users' freelancer chats stats
    const freelancerChatsQuery = `
      SELECT 
        u.name as user_name,
        DATE(fc.chat_date) as date,
        COUNT(*) as chat_count,
        SUM(CASE WHEN is_awarded = 1 THEN 1 ELSE 0 END) as offer_count
      FROM users u
      LEFT JOIN freelancer_chats fc ON fc.user_id = u.id 
        AND fc.chat_date BETWEEN ? AND ?
      WHERE u.role = 'user'
      GROUP BY u.name, DATE(fc.chat_date)
    `;

    // Get all users' upwork bids stats
    const upworkBidsQuery = `
      SELECT 
        u.name as user_name,
        DATE(ub.bid_date) as date,
        COUNT(*) as sent_count,
        SUM(CASE WHEN status = 'chat' THEN 1 ELSE 0 END) as chat_count,
        SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offer_count
      FROM users u
      LEFT JOIN upwork_bids ub ON ub.user_id = u.id 
        AND ub.bid_date BETWEEN ? AND ?
      WHERE u.role = 'user'
      GROUP BY u.name, DATE(ub.bid_date)
    `;

    const [freelancerBids, freelancerChats, upworkBids] = await Promise.all([
      pool.query(freelancerBidsQuery, [startDate, endDate]),
      pool.query(freelancerChatsQuery, [startDate, endDate]),
      pool.query(upworkBidsQuery, [startDate, endDate])
    ]);

    // Initialize stats for all users
    const freelancerStats = {};
    const upworkStats = {};
    users.forEach(user => {
      freelancerStats[user.name] = {};
      upworkStats[user.name] = {};
    });


    freelancerBids[0].forEach(row => {
      if (!row.date) return; // Skip if no date (from LEFT JOIN)
      
      const { user_name, date, bid_count, row_count } = row;
      const dateStr = new Date(date).toISOString().split('T')[0];
      
      console.log(`\nProcessing bids for ${user_name} on ${dateStr}:`);
      console.log('Bid Count (sum of bid_number):', bid_count);
      console.log('Row Count:', row_count);
      
      if (!freelancerStats[user_name][dateStr]) {
        freelancerStats[user_name][dateStr] = {
          sent: parseInt(bid_count) || 0,
          chat: 0,
          offer: 0
        };
      } else {
        freelancerStats[user_name][dateStr].sent = bid_count || 0;
      }
      
      console.log('Current Stats after bids:', freelancerStats[user_name][dateStr]);
    });

    console.log('\n=== Freelancer Chats Raw Data ===');
    console.log(freelancerChats[0]);

    freelancerChats[0].forEach(row => {
      if (!row.date) return; // Skip if no date (from LEFT JOIN)
      
      const { user_name, date, chat_count, offer_count } = row;
      const dateStr = new Date(date).toISOString().split('T')[0];
      
      console.log(`\nProcessing chats for ${user_name} on ${dateStr}:`);
      console.log('Chat Count:', chat_count);
      console.log('Offer Count:', offer_count);
      
      if (!freelancerStats[user_name][dateStr]) {
        freelancerStats[user_name][dateStr] = { 
          sent: parseInt(chat_count) || 0,
          chat: parseInt(chat_count) || 0,
          offer: parseInt(offer_count) || 0
        };
      } else {
        freelancerStats[user_name][dateStr].chat = parseInt(chat_count) || 0;
        freelancerStats[user_name][dateStr].offer = parseInt(offer_count) || 0;
        // Add chat count to sent count since sent should include both bids and chats
        freelancerStats[user_name][dateStr].sent += parseInt(chat_count) || 0;
      }
      
      console.log('Current Stats after chats:', freelancerStats[user_name][dateStr]);
    });

    console.log('\n=== Final Freelancer Stats ===');
    console.log(JSON.stringify(freelancerStats, null, 2));

    // Process upwork stats by user
    console.log('\n=== Upwork Bids Raw Data ===');
    console.log(upworkBids[0]);

    upworkBids[0].forEach(row => {
      if (!row.date) return; // Skip if no date (from LEFT JOIN)
      
      const { user_name, date } = row;
      const dateStr = new Date(date).toISOString().split('T')[0];
      
      console.log(`\nProcessing upwork bids for ${user_name} on ${dateStr}:`);
      console.log('Sent Count:', row.sent_count);
      console.log('Chat Count:', row.chat_count);
      console.log('Offer Count:', row.offer_count);
      
      upworkStats[user_name][dateStr] = {
        sent: parseInt(row.sent_count) || 0,
        chat: parseInt(row.chat_count) || 0,
        offer: parseInt(row.offer_count) || 0
      };
      
      console.log('Current Stats:', upworkStats[user_name][dateStr]);
    });

    console.log('\n=== Final Upwork Stats ===');
    console.log(JSON.stringify(upworkStats, null, 2));

    res.json({
      freelancer: freelancerStats,
      upwork: upworkStats
    });
  } catch (error) {
    console.error('Error fetching weekly bid statistics:', error);
    res.status(500).json({ message: 'Failed to fetch weekly bid statistics' });
  }
});
export default router;