var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home/home', { title: 'doroTracker' });
});

module.exports = router;
