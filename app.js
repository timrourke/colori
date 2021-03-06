var debug             = require('debug')('app: ' + process.pid);
var express           = require('express');
var path              = require('path');
var favicon           = require('serve-favicon');
var logger            = require('morgan');
var onFinished        = require('on-finished');
var bodyParser        = require('body-parser');
var Sequelize         = require('sequelize');
var AWS               = require('aws-sdk');


//  Config AWS
AWS.config.loadFromPath(path.join(__dirname, 'config', 'aws_config.js'));
var s3bucket = new AWS.S3({ params: {Bucket: 'colori'} });

//var params = {Key: 'myKey', Body: 'Hello!'};
// s3bucket.upload(params, function(err, data) {
//     if (err) {
//       console.log("Error uploading data: ", err);
//     } else {
//       console.log("Successfully uploaded data to myBucket/myKey");
//     }
// });

debug('Initializing express.');
var app = express();

var NotFoundError     = require(path.join(__dirname, 'errors', 'NotFoundError.js'));
var tokenUtils        = require(path.join(__dirname, 'utils', 'tokenUtils.js'));
var unless            = require('express-unless');

var config            = require(path.join(__dirname, 'config', 'config')); // get our config file

console.log('NODE ENV CURRENTLY: ' + process.env.NODE_ENV);

// Database setup
// Later, abstract the params into config vars for security
var postgresUsername = config.db[process.env.NODE_ENV].username;
var postgresPassword = config.db[process.env.NODE_ENV].password;

var sequelize = new Sequelize('colori', postgresUsername, postgresPassword, {
  host: 'localhost',
  dialect: 'postgres',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
});

// Define Models
var Models = require(path.join(__dirname, 'models', 'models.js'))(sequelize, Sequelize);
sequelize.sync();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
debug('Initializing plugins.');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware - Performance-related
app.use(require('compression')());
app.use(require('response-time')());
app.use(function(req, res, next) {
  onFinished(res, function(err) {
    debug('[%s] finished request', req.connection.remoteAddress);
  });

  next();
});

// Load temporary test frontend
app.use('/', express.static(__dirname + '/public/'));
app.use('/bower_components', express.static(__dirname + '/public/bower_components'));
app.use('/partials', express.static(__dirname + '/public/partials'));

/*
 * API Routes
 *
 */
//app.use('/api', tokenUtils.middleware().unless({path: ['/api/auth/login', '/api/auth/signup', '/api/auth/logout', '/api/gradients', '/api/comments', '/api/userprofiles']}));
app.use("/api/auth", require(path.join(__dirname, 'routes', 'users', 'authorization.js'))(Models));
app.use("/api/users", require(path.join(__dirname, 'routes', 'users', 'users.js'))(Models, s3bucket));
app.use("/api/gradients", require(path.join(__dirname, 'routes', 'gradients', 'gradients.js'))(Models));
app.use("/api/comments", require(path.join(__dirname, 'routes', 'comments', 'comments.js'))(Models));
app.use("/api/userprofiles", require(path.join(__dirname, 'routes', 'userProfiles', 'userProfiles.js'))(Models));

app.all('*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('index.html', { root: __dirname + '/public/' });
});

// // all other requests redirect to 404
app.all("*", function (req, res, next) {
    next(new NotFoundError("404"));
});

// error handler for all the applications
app.use(function (err, req, res, next) {

    var errorType = typeof err,
        code = 500,
        msg = { message: "Internal Server Error" };

    switch (err.name) {
        case "UnauthorizedError":
            code = err.status;
            msg = undefined;
            break;
        case "BadRequestError":
        case "UnauthorizedAccessError":
        case "NotFoundError":
        case "AccountUnactivatedError":
            code = err.status;
            msg = err.inner;
            break;
        case "SequelizeUniqueConstraintError":
            code = 409;
            msg = { message: err.errors };
            break;    
        case "SequelizeValidationError":
            msg = err;
            break;
        default:
            break;
    }

    return res.status(code).json(msg);

});

module.exports = app;
