var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');
var router = require('./router.js');
var session = require('express-session');

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));
app.use(session({
  secret: 'alien badminton',
  resave: true,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, '/../public')));
app.set('views', __dirname + '/../views');
app.engine('html', require('ejs').renderFile);

app.get('/', function(req, res){
  res.render('index.html');
})

app.get('/render-friends', function(req, res){
  res.render('globe.html');
})

app.get('/fbconfig', function(req, res){
  res.end(process.env.FBID);
})

app.use('/api/', router);



module.exports = app;