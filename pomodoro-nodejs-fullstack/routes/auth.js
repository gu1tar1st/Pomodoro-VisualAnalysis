require('dotenv').config();
const express = require('express');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../model/User');

const router = express.Router();

// Passport setup
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'emails', 'picture.type(large)']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ facebookId: profile.id });

      if (!user) {
        user = new User({
          facebookId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          picture: profile.photos?.[0]?.value,
          accessToken,
          refreshToken
        });
        await user.save();
      } else {
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

router.get('/profile', (req, res) => {
  if (!req.user) return res.redirect('/');
  res.json({
    message: "✅ Logged in!",
    user: req.user
  });
});

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

module.exports = router;
