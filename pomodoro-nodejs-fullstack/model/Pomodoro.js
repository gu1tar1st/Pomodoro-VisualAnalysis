const mongoose = require('mongoose');

const PomodoroSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // Reference to User schema
    required: true
  },

  facebookName: {
    type: String,
    required: true
  }, // The name of the Facebook user

  purpose: {
    type: String,
    required: true
  }, // Purpose of Pomodoro (e.g., "Math homework", "Reading")

  studyTime: {
    type: Number,
    required: true
  }, // Planned study time (minutes)

  actualStudyTime: {
    type: Number,
    default: 0
  }, // Actual time studied (minutes)

  restTime: {
    type: Number,
    default: 5
  }, // Rest duration (minutes)

  studyDate: {
    type: Date,
    default: Date.now
  }, // When the session happened

  cycles: {
    type: Number,
    default: 1
  }, // Planned Pomodoro cycles

  completedCycles: {
    type: Number,
    default: 0
  }, // Completed Pomodoro cycles

  isCompleted: {
    type: Boolean,
    default: false
  }, // Whether the whole session was completed

  notes: {
    type: String
  }, // Optional notes from the user

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pomodoro', PomodoroSchema);
