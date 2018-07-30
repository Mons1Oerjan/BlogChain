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
    
    getPrices(function(prices) {
        res.render("main/blogchainmain"); //is this right?
    });

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


/**
 * Get the prices for each cryptocurrency
 */ 
var getPrices = function(callback) {
    var summaryURL = "https://api.cryptowat.ch/markets/{exchange}/{pair}/summary"; //baseURL for price-related API requests

    /**
    * Gets the summary given a market exchange, a pair, and the route.
    */
    var getSummary = function(exchange, pair, route, callback) {
        request.get(route, function(error, response, body) {
            if (error) {
                console.log('Summary GET failed for: ' + route);
                return callback(exchange, pair, {
                    error: 'Summary GET request failed'
                });
            }

            if (!response) { //response missing
                console.log('Summary GET Request: Missing response');
            } else if (!body) { //body missing
                console.log('Summary GET Request: Missing body');
            }

            if (response.statusCode && response.statusCode !== 200) {
                console.log('Summary GET request status code: ' + response.statusCode);
                return callback(exchange, pair, {
                    error: 'Summary status code is not 200.'
                });
            }

            jsonBody = JSON.parse(body);

            if (!jsonBody.result) { //no results returned
                return callback(exchange, pair, {
                    error: 'Summary contains no results.'
                });
            } else if (!jsonBody.result.price) { //no prices listed in summary
                return callback(exchange, pair, {
                    error: 'Summary contains no prices.'
                });
            } else if (!jsonBody.result.volume) { //no volume for the exchange + pair listed
                return callback(exchange, pair, {
                    error: 'Summary does not indicate a volume.'
                });
            }

            return callback(exchange, pair, { //return desired information
                exchange: exchange,
                pair: pair,
                last: parseFloat(jsonBody.result.price.last),
                highest: parseFloat(jsonBody.result.price.high),
                lowest: parseFloat(jsonBody.result.price.low),
                volume: parseFloat(jsonBody.result.volume)
            });

        });
    };


    var testExchange = 'gdax';
    var testPair = 'btcusd';
    var testRoute = summaryURL.replace('{exchange}', testExchange).replace('{pair}', testPair);
    getSummary(testExchange, testPair, testRoute, callback);

}


module.exports = router;
