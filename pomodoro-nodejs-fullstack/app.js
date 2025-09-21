require('dotenv').config();
var createError = require('http-errors');
var passport = require('passport');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const MongoStore = require('connect-mongo');

const setUser = require('./middleware/auth');

var homeRouter = require('./routes/home');
var authRouter = require('./routes/auth');
var pomodoroRouter = require('./routes/pomodoro');
var analysisRouter = require('./routes/analysis');

var app = express();
app.use(express.json());


/* 
Connect database
*/
const mongoose = require('mongoose')
const uri = process.env.MONGODB_URI;
mongoose.connect(uri).then(() => {
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Session setup
app.use(session({
  secret: process.env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { secure: true, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(setUser);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', homeRouter);
app.use('/auth', authRouter);
app.use('/pomodoro', pomodoroRouter);
app.use('/analysis', analysisRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
