/**
 * Routes for:
 *   - Welcome view
 *   - User Registration
 *   - User Login
 *   - User Logout
 *   - Dashboard view
 */

var express = require("express");
var router  = express.Router();
var passport = require("passport");

var User = require("../models/user");

/**
 * Welcome View
 */
router.get("/", function(req, res) {
    res.render("starters/intro");
});

/**
 * User Registration View
 */
router.get("/register", function(req, res) {
   res.render("starters/register", {
       page: 'register'
   });
});

/**
 * POST User (create new)
 */
router.post("/register", function(req, res) {
    var newUser = new User({
        username: req.body.username
    });

    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
          req.flash("error", "Could not create a new user.");
          console.error(err);
          return res.redirect("/register");
        }

        // authenticate the user
        passport.authenticate("local")(req, res, function() {
           req.flash("success", "Successfully Signed Up! Welcome, " + req.body.username + ".");
           res.redirect("/blogs");
        });
    });
});

/**
 * Login View
 */
router.get("/login", function(req, res) {
   res.render("starters/login", {
       page: 'login'
   });
});

/**
 * POST Login (authenticate the user)
 */
router.post("/login", passport.authenticate("local", {
    successRedirect: "/blogs",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: 'Welcome to BlogChain!'
}));

/**
 * Logout View
 */
router.get("/logout", function(req, res) {
   req.logout();
   req.flash("success", "You have successfully logged out.");
   res.redirect("/blogs");
});

/**
 * Dashboard View
 */
router.get("/blogchainmain", function(re, res) {
    res.render("main/blogchainmain")
});

module.exports = router;
