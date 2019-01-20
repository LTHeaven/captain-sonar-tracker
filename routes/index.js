var express = require('express');
// var p5 = require('p5');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CaptainSonarTracker' });
});

module.exports = router;
