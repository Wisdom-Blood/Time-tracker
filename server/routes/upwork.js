import express from 'express';
import { pool } from '../index.js';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all upwork bids
router.get('/upwork_bids/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id; // Get the authenticated user's ID
    const [rows] = await pool.query(
      'SELECT * FROM upwork_bids WHERE user_id = ? ORDER BY bid_date DESC',
      [userId]
    );
    const formattedBids = rows.map(row => ({
      id: row.id,
      bidDate: row.bid_date ? new Date(row.bid_date).toISOString() : null,
      clientName: row.client_name,
      country: row.country,
      totalSpent: parseFloat(row.total_spent),
      averageHourlyRate: parseFloat(row.average_hourly_rate),
      spentBidAmount: parseFloat(row.spent_bid_amount),
      accountName: row.account_name,
      status: row.status,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      userId: row.user_id
    }));
    res.json(formattedBids);
  } catch (error) {
    console.error('Error fetching upwork bids:', error);
    res.status(500).json({ message: 'Failed to fetch upwork bids' });
  }
});

// Create a new upwork bid
router.post('/upwork_bids', auth, async (req, res) => {
  try {
    const {
      bidDate,
      clientName,
      country,
      totalSpent,
      averageHourlyRate,
      spentBidAmount,
      accountName,
      status
    } = req.body;

    console.log(status, "==========s");
    
    const userId = req.user.id;
    const now = new Date().toISOString();
    
    const [result] = await pool.query(
      `INSERT INTO upwork_bids (
        user_id, bid_date, client_name, country, total_spent, 
        average_hourly_rate, spent_bid_amount, account_name, 
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, bidDate, clientName, country, totalSpent,
        averageHourlyRate, spentBidAmount, accountName,
        status, now, now
      ]
    );
    
    const [newBid] = await pool.query('SELECT * FROM upwork_bids WHERE id = ?', [result.insertId]);
    const formattedBid = {
      id: newBid[0].id,
      bidDate: newBid[0].bid_date ? new Date(newBid[0].bid_date).toISOString() : null,
      clientName: newBid[0].client_name,
      country: newBid[0].country,
      totalSpent: parseFloat(newBid[0].total_spent),
      averageHourlyRate: parseFloat(newBid[0].average_hourly_rate),
      spentBidAmount: parseFloat(newBid[0].spent_bid_amount),
      accountName: newBid[0].account_name,
      status: newBid[0].status,
      createdAt: newBid[0].created_at ? new Date(newBid[0].created_at).toISOString() : now,
      updatedAt: newBid[0].updated_at ? new Date(newBid[0].updated_at).toISOString() : now,
      userId: newBid[0].user_id
    };
    res.status(201).json(formattedBid);
  } catch (error) {
    console.error('Error creating upwork bid:', error);
    res.status(500).json({ message: 'Failed to create upwork bid' });
  }
});

// Update an upwork bid
router.put('/upwork_bids/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bidDate,
      clientName,
      country,
      totalSpent,
      averageHourlyRate,
      spentBidAmount,
      accountName,
      status
    } = req.body;
    const userId = req.user.id;
    
    // Verify the bid belongs to the user
    const [existingBid] = await pool.query(
      'SELECT * FROM upwork_bids WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingBid.length === 0) {
      return res.status(404).json({ message: 'Bid not found or unauthorized' });
    }
    
    const now = new Date().toISOString();
    
    await pool.query(
      `UPDATE upwork_bids SET 
        bid_date = ?, client_name = ?, country = ?, total_spent = ?,
        average_hourly_rate = ?, spent_bid_amount = ?, account_name = ?,
        status = ?, updated_at = ?
      WHERE id = ?`,
      [
        bidDate, clientName, country, totalSpent,
        averageHourlyRate, spentBidAmount, accountName,
        status, now, id
      ]
    );
    
    const [updatedBid] = await pool.query('SELECT * FROM upwork_bids WHERE id = ?', [id]);
    
    if (updatedBid.length === 0) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    const formattedBid = {
      id: updatedBid[0].id,
      bidDate: updatedBid[0].bid_date ? new Date(updatedBid[0].bid_date).toISOString() : null,
      clientName: updatedBid[0].client_name,
      country: updatedBid[0].country,
      totalSpent: parseFloat(updatedBid[0].total_spent),
      averageHourlyRate: parseFloat(updatedBid[0].average_hourly_rate),
      spentBidAmount: parseFloat(updatedBid[0].spent_bid_amount),
      accountName: updatedBid[0].account_name,
      status: updatedBid[0].status,
      createdAt: updatedBid[0].created_at,
      updatedAt: updatedBid[0].updated_at,
      userId: updatedBid[0].user_id
    };
    res.json(formattedBid);
  } catch (error) {
    console.error('Error updating upwork bid:', error);
    res.status(500).json({ message: 'Failed to update upwork bid' });
  }
});

// Delete an upwork bid
router.delete('/upwork_bids/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify the bid belongs to the user
    const [existingBid] = await pool.query(
      'SELECT * FROM upwork_bids WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingBid.length === 0) {
      return res.status(404).json({ message: 'Bid not found or unauthorized' });
    }
    
    const [result] = await pool.query('DELETE FROM upwork_bids WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting upwork bid:', error);
    res.status(500).json({ message: 'Failed to delete upwork bid' });
  }
});

// Get all countries
router.get('/countries', auth, async (req, res) => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2');
    const countries = await response.json();
    
    const formattedCountries = countries.map(country => ({
      code: country.cca2,
      name: country.name.common,
      flag: country.flags.svg
    })).sort((a, b) => a.name.localeCompare(b.name));

    res.json(formattedCountries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ message: 'Failed to fetch countries' });
  }
});

export default router; 