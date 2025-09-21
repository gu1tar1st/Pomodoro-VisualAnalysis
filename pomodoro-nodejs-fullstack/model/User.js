const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  facebookId: { type: String, required: true, unique: true },  // ID from Facebook
  name: { type: String },
  email: { type: String },
  picture: { type: String }, // profile picture URL

  accessToken: { type: String },   // Facebook access token
  refreshToken: { type: String },  // if available

  instagram: {
    id: { type: String },          // Instagram user ID
    username: { type: String },    // Instagram username
    accountType: { type: String }, // PERSONAL or BUSINESS
    media: { type: Array },        // you can store media JSON here if needed
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Automatically update `updatedAt`
UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);
