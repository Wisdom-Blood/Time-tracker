import express from 'express';
import { pool } from '../index.js';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all bids
router.get('/freelancer_bids/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM freelancer_bids WHERE user_id = ? ORDER BY created_at DESC', [id]);
    const formattedBids = rows.map(row => ({
      id: row.id,
      skill: row.skill,
      bidNumber: parseInt(row.bid_number),
      bidDate: row.bid_date ? new Date(row.bid_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      userId: row.user_id
    }));
    res.json(formattedBids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ message: 'Failed to fetch bids' });
  }
});

// Create a new bid
router.post('/freelancer_bids', auth, async (req, res) => {
  try {
    const { skill, bidNumber, bidDate } = req.body;
    const userId = req.user.id; // Get user ID from auth token
    
    const now = new Date().toISOString();
    
    const [result] = await pool.query(
      'INSERT INTO freelancer_bids (skill, bid_number, bid_date, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [skill, bidNumber, bidDate || now.split('T')[0], now, now, userId]
    );
    
    const [newBid] = await pool.query('SELECT * FROM freelancer_bids WHERE id = ?', [result.insertId]);
    
    const formattedBid = {
      id: newBid[0].id,
      skill: newBid[0].skill,
      bidNumber: parseInt(newBid[0].bid_number),
      bidDate: newBid[0].bid_date ? new Date(newBid[0].bid_date).toISOString().split('T')[0] : now.split('T')[0],
      createdAt: newBid[0].created_at ? new Date(newBid[0].created_at).toISOString() : now,
      updatedAt: newBid[0].updated_at ? new Date(newBid[0].updated_at).toISOString() : now,
      userId: newBid[0].user_id
    };
    res.status(201).json(formattedBid);
  } catch (error) {
    console.error('Error creating bid:', error);
    res.status(500).json({ message: 'Failed to create bid' });
  }
});

// Update a bid
router.put('/freelancer_bids/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { skill, bidNumber, bidDate } = req.body;
    const userId = req.user.id; // Get user ID from auth token
    
    // Verify the bid belongs to the user
    const [existingBid] = await pool.query(
      'SELECT * FROM freelancer_bids WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingBid.length === 0) {
      return res.status(404).json({ message: 'Bid not found or unauthorized' });
    }
    
    const now = new Date().toISOString();
    
    await pool.query(
      'UPDATE freelancer_bids SET skill = ?, bid_number = ?, bid_date = ?, updated_at = ? WHERE id = ?',
      [skill, bidNumber, bidDate || now.split('T')[0], now, id]
    );
    
    const [updatedBid] = await pool.query('SELECT * FROM freelancer_bids WHERE id = ?', [id]);
    
    if (updatedBid.length === 0) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    const formattedBid = {
      id: updatedBid[0].id,
      skill: updatedBid[0].skill,
      bidNumber: parseInt(updatedBid[0].bid_number),
      bidDate: updatedBid[0].bid_date ? new Date(updatedBid[0].bid_date).toISOString().split('T')[0] : now.split('T')[0],
      createdAt: updatedBid[0].created_at ? new Date(updatedBid[0].created_at).toISOString() : now,
      updatedAt: updatedBid[0].updated_at ? new Date(updatedBid[0].updated_at).toISOString() : now,
      userId: updatedBid[0].user_id
    };
    res.json(formattedBid);
  } catch (error) {
    console.error('Error updating bid:', error);
    res.status(500).json({ message: 'Failed to update bid' });
  }
});

// Delete a bid
router.delete('/freelancer_bids/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Get user ID from auth token
    
    // Verify the bid belongs to the user
    const [existingBid] = await pool.query(
      'SELECT * FROM freelancer_bids WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingBid.length === 0) {
      return res.status(404).json({ message: 'Bid not found or unauthorized' });
    }
    
    const [result] = await pool.query('DELETE FROM freelancer_bids WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting bid:', error);
    res.status(500).json({ message: 'Failed to delete bid' });
  }
});

// Get all chats
router.get('/freelancer_chat/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM freelancer_chats WHERE user_id = ? ORDER BY created_at DESC', [id]);
    const formattedChats = rows.map(row => ({
      id: row.id,
      clientName: row.client_name,
      clientCountry: row.client_country,
      projectTitle: row.project_title,
      review: parseFloat(row.review),
      reviewNumber: row.review_number,
      spentMoney: parseFloat(row.spent_money),
      isAwarded: Boolean(row.is_awarded),
      chatDate: row.chat_date ? new Date(row.chat_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      userId: row.user_id
    }));
    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
});

// Create a new chat
router.post('/freelancer_chat', auth, async (req, res) => {
  try {
    const { clientName, clientCountry, projectTitle, review, reviewNumber, spentMoney, isAwarded, chatDate } = req.body;
    const userId = req.user.id; // Get user ID from auth token
    const now = new Date().toISOString();
    
    const [result] = await pool.query(
      'INSERT INTO freelancer_chats (client_name, client_country, project_title, review, review_number, spent_money, is_awarded, chat_date, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [clientName, clientCountry, projectTitle, review, reviewNumber, spentMoney, isAwarded, chatDate || now.split('T')[0], userId, now, now]
    );
    
    const [newChat] = await pool.query('SELECT * FROM freelancer_chats WHERE id = ?', [result.insertId]);
    
    if (newChat.length === 0) {
      throw new Error('Failed to retrieve created chat');
    }
    
    res.status(201).json({
      id: newChat[0].id,
      clientName: newChat[0].client_name,
      clientCountry: newChat[0].client_country,
      projectTitle: newChat[0].project_title,
      review: parseFloat(newChat[0].review),
      reviewNumber: newChat[0].review_number,
      spentMoney: parseFloat(newChat[0].spent_money),
      isAwarded: Boolean(newChat[0].is_awarded),
      chatDate: newChat[0].chat_date ? new Date(newChat[0].chat_date).toISOString().split('T')[0] : now.split('T')[0],
      createdAt: newChat[0].created_at,
      updatedAt: newChat[0].updated_at,
      userId: newChat[0].user_id
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Failed to create chat' });
  }
});

// Update a chat
router.put('/freelancer_chat/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, clientCountry, projectTitle, review, reviewNumber, spentMoney, isAwarded, chatDate } = req.body;
    const userId = req.user.id; // Get user ID from auth token
    
    // Verify the chat belongs to the user
    const [existingChat] = await pool.query(
      'SELECT * FROM freelancer_chats WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingChat.length === 0) {
      return res.status(404).json({ message: 'Chat not found or unauthorized' });
    }
    
    await pool.query(
      'UPDATE freelancer_chats SET client_name = ?, client_country = ?, project_title = ?, review = ?, review_number = ?, spent_money = ?, is_awarded = ?, chat_date = ? WHERE id = ?',
      [clientName, clientCountry, projectTitle, review, reviewNumber, spentMoney, isAwarded, chatDate || new Date().toISOString().split('T')[0], id]
    );
    
    const [updatedChat] = await pool.query('SELECT * FROM freelancer_chats WHERE id = ?', [id]);
    
    if (updatedChat.length === 0) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json({
      id: updatedChat[0].id,
      clientName: updatedChat[0].client_name,
      clientCountry: updatedChat[0].client_country,
      projectTitle: updatedChat[0].project_title,
      review: parseFloat(updatedChat[0].review),
      reviewNumber: updatedChat[0].review_number,
      spentMoney: parseFloat(updatedChat[0].spent_money),
      isAwarded: Boolean(updatedChat[0].is_awarded),
      chatDate: updatedChat[0].chat_date ? new Date(updatedChat[0].chat_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      createdAt: updatedChat[0].created_at,
      updatedAt: updatedChat[0].updated_at,
      userId: updatedChat[0].user_id
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ message: 'Failed to update chat' });
  }
});

// Delete a chat
router.delete('/freelancer_chat/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Get user ID from auth token
    
    // Verify the chat belongs to the user
    const [existingChat] = await pool.query(
      'SELECT * FROM freelancer_chats WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingChat.length === 0) {
      return res.status(404).json({ message: 'Chat not found or unauthorized' });
    }
    
    const [result] = await pool.query('DELETE FROM freelancer_chats WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Failed to delete chat' });
  }
});

// Get all countries with flags
router.get('/countries', auth, async (req, res) => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2');
    const countries = await response.json();
    
    const formattedCountries = countries.map(country => ({
      code: country.cca2,
      name: country.name.common,
      flag: country.flags.svg,
      flagEmoji: country.flags.emoji
    })).sort((a, b) => a.name.localeCompare(b.name));

    res.json(formattedCountries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ message: 'Failed to fetch countries' });
  }
});

export default router; 