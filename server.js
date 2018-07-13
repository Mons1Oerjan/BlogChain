/**
 * Dependencies
 */
var express = require("express");
var app = express();
var sanitazer  = require("body-parser");
var mongoose = require("mongoose");
var authentication  = require("passport");
var cookieParser = require("cookie-parser");
var LocalStrategy = require("passport-local");
var flash = require("connect-flash");
var session = require("express-session");
var methodOverride = require("method-override");

/**
 * Models
 */
var Blogs  = require("./models/blogs");
var Comments = require("./models/comments");
var User = require("./models/user");

/**
 * Routes
 */
var commentsRouting = require("./routes/comments");
var blogsRouting = require("./routes/blogs");
var indexRouting = require("./routes/index");

/**
 * DB Connection
 */
var dbConnectionString = 'mongodb://test:cloudtest1@ds163630.mlab.com:63630/cloud_a2';
mongoose.connect(dbConnectionString, function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log("Database connected");
    }
});

/**
 * App Configurations
 */
app.use(sanitazer.urlencoded({extended: true})); // Sanitazes user input
app.set("view engine", "ejs");                   // Sets the view engine to EJS
app.use(express.static(__dirname + "/public"));  // Allows access to static files (css or js)
app.use(methodOverride('_method'));              // Allows RESTful Delete and Put operations
app.use(cookieParser('blogchain'));
app.use(flash());                                // Flash messages to give users feedback
app.locals.moment = require('moment');           // Library to keep track of the current time

/**
 * Authentication: Stores information for each session.
 * Ref: https://nodewebapps.com/2017/06/18/how-do-nodejs-sessions-work/
 */
app.use(require("express-session")({
    secret: "blogchain",
    resave: false,
    saveUninitialized: false
}));

/**
 * Passport Configuration
 * Ref1: https://github.com/jaredhanson/passport-local
 * Ref2: http://www.passportjs.org/docs/authenticate/
 */
app.use(authentication.initialize());                       // Initializes passport
app.use(authentication.session());                          // Adds session to passport
authentication.use(new LocalStrategy(User.authenticate())); // Local Storage
authentication.serializeUser(User.serializeUser());
authentication.deserializeUser(User.deserializeUser());

/**
 * This is the first function that the app reads as long as we get any request
 * By adding this function here all request will have the error and success
 * message in the requests and responses which is useful for the EJS files.
 */
app.use(function(req, res, next) {
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

/**
 * Configure application routes
 */
app.use("/", indexRouting);
app.use("/blogs", blogsRouting);
app.use("/blogs/:id/comments", commentsRouting);

/**
 * Local Connection
 */
app.listen(8000, function() {
   console.log("Connection Successful: http://localhost:8000");
});

/**
 * TODO: Dynamic connection, once deployed.
 */
// app.listen(process.env.PORT, process.env.IP, function() {
//    console.log("The Server Has Started!");
// });