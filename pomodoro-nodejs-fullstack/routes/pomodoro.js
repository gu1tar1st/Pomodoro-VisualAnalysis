const express = require('express');
const mongoose = require('mongoose'); // Add this import
const router = express.Router();
const Pomodoro = require('../model/Pomodoro');

// GET route for rendering the page
router.get('/', (req, res) => {
    res.render('pomodoro/pomodoro', { user: req.user || null });
});

// Save Pomodoro session - FIXED PATH
router.post('/save', async (req, res) => {
  try {
    console.log('Received pomodoro data:', req.body); // Debug log
    
    const pomodoroData = req.body;
    
    // Validate required fields
    if (!pomodoroData.facebookName || !pomodoroData.purpose || !pomodoroData.studyTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: facebookName, purpose, studyTime' 
      });
    }
    
    // Ensure userId is set (for testing, generate a temp ID)
    if (!pomodoroData.userId) {
      pomodoroData.userId = new mongoose.Types.ObjectId();
    }
    
    const newPomodoro = new Pomodoro(pomodoroData);
    const saved = await newPomodoro.save();
    
    console.log('Pomodoro saved:', saved); // Debug log
    
    res.status(201).json({
      success: true,
      data: saved,
      message: 'Session saved successfully'
    });
  } catch (error) {
    console.error('Error saving Pomodoro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;