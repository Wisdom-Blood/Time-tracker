import express from 'express';
import { pool } from '../index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all cash history entries with filters
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, minAmount, maxAmount } = req.query;
    
    let query = `
      SELECT ch.*, u.name as user_name 
      FROM cash_history ch 
      LEFT JOIN users u ON ch.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    // Add date filters
    if (startDate) {
      query += ' AND ch.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND ch.date <= ?';
      params.push(endDate);
    }

    // Add amount filters
    if (minAmount) {
      query += ' AND ch.amount >= ?';
      params.push(minAmount);
    }
    if (maxAmount) {
      query += ' AND ch.amount <= ?';
      params.push(maxAmount);
    }

    // If no date filter is provided, default to current month
    if (!startDate && !endDate) {
      query += ' AND MONTH(ch.date) = MONTH(CURRENT_DATE()) AND YEAR(ch.date) = YEAR(CURRENT_DATE())';
    }

    query += ' ORDER BY ch.date DESC';

    // Get filtered records
    const [rows] = await pool.query(query, params);

    // Calculate total amount
    const [totalResult] = await pool.query(
      `SELECT SUM(amount) as total FROM (${query}) as filtered_data`,
      params
    );

    // Get the date range for display
    const dateRange = !startDate && !endDate 
      ? {
          month: new Date().toLocaleString('default', { month: 'long' }),
          year: new Date().getFullYear()
        }
      : {
          startDate: startDate ? new Date(startDate).toLocaleDateString() : null,
          endDate: endDate ? new Date(endDate).toLocaleDateString() : null
        };

    res.json({
      records: rows,
      total: totalResult[0].total || 0,
      dateRange
    });
  } catch (err) {
    console.error('Error fetching cash history:', err);
    res.status(500).json({ message: 'Failed to fetch cash history' });
  }
});

// Add new cash history entry
router.post('/', auth, async (req, res) => {
  const { amount, reason, date} = req.body;
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      'INSERT INTO cash_history (amount, reason, date, user_id) VALUES (?, ?, ?, ?)',
      [amount, reason, date, userId]
    );
    
    const [newEntry] = await pool.query(
      'SELECT ch.*, u.name as user_name FROM cash_history ch LEFT JOIN users u ON ch.user_id = u.id WHERE ch.id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newEntry[0]);
  } catch (err) {
    console.error('Error adding cash history:', err);
    res.status(500).json({ message: 'Failed to add cash history' });
  }
});

// Update cash history entry
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { amount, reason, date} = req.body;
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      'UPDATE cash_history SET amount = ?, reason = ?, date = ? WHERE id = ? AND user_id = ?',
      [amount, reason, date, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cash history entry not found or unauthorized' });
    }

    const [updatedEntry] = await pool.query(
      'SELECT ch.*, u.name as user_name FROM cash_history ch LEFT JOIN users u ON ch.user_id = u.id WHERE ch.id = ?',
      [id]
    );

    res.json(updatedEntry[0]);
  } catch (err) {
    console.error('Error updating cash history:', err);
    res.status(500).json({ message: 'Failed to update cash history' });
  }
});

// Delete cash history entry
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      'DELETE FROM cash_history WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cash history entry not found or unauthorized' });
    }

    res.json({ message: 'Cash history entry deleted successfully' });
  } catch (err) {
    console.error('Error deleting cash history:', err);
    res.status(500).json({ message: 'Failed to delete cash history' });
  }
});

export default router;