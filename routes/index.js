/**
 * Routes for:
 *   - Welcome view
 *   - User Registration
 *   - User Login
 *   - User Logout
 *   - Dashboard view
 *   - Arbitrage view
 */

var express = require("express");
var router  = express.Router();
var passport = require("passport");
var request = require('request');

var User = require("../models/user");
var Arbitrage = require('../models/arbitrages');

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
    if (req.body.password !== req.body.password_confirm) {
        req.flash("error", "Passwords did not match. Please try again.");
        return res.redirect("/register");
    }

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
router.get("/dashboard", function(req, res) {
    res.render("main/blogchainmain");
});


router.get("/dashboard/arbitrage", function(req, res) {
    Arbitrage.find({})
        .sort({createdAt: -1})
        .limit(1500)
        .exec(function(err, allArbitrages) {
            if(err) {
                console.log(err);
            } else {
                if(req.xhr) {
                    res.json(allBlogs);
                } else {
                    res.render("main/arbitrage", {
                        arbitrages: allArbitrages
                    });
                }
            }
        });
});


module.exports = router;
