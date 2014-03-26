var app,
	db = require('./db'),
	express = require('express'),
	http = require('http'),
	path = require('path'),
	routes = require('./routes');

app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

db.setup(function () {
	app.get('/', routes.index(db));
	app.get('/matches', routes.matches(db));
	app.get('/teams', routes.teams(db));
	app.get('/results', routes.results(db));
	app.get('/teams/:id', routes.teamresults(db));
	app.get('/events/:id', routes.eventmatches(db));
});

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
