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
var Arbitrage = require("../models/arbitrages");

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
    Arbitrage.find({}).sort({createdAt: -1}).exec(function(err, allArbitrages) {
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
 * Find Arbitrages in the market.
 */
router.post("/dashboard/arbitrage", function(req, res) {
    GetArbitrages(function(arbitrages) {
        res.redirect("/dashboard/arbitrage");
    });
});

/**
 * Gets the arbitrages by comparing exchanges and pairs.
 */
var GetArbitrages = function(callback) {
    var cryptowatchBaseUrl = "https://api.cryptowat.ch";
    var orderbookRoute = cryptowatchBaseUrl + "/markets/{e}/{p}/orderbook";

    var writeArbitrageToDatabase = function(arbitrage) {
        Arbitrage.create(arbitrage, function(err, arbitrageCreated) {
            if (err) {
                console.log('Error: Could not write arbitrage to DB.');
            } else {
                console.log('Wrote arbitrage to DB:');
                console.log(arbitrageCreated);
            }
        });
    }

    /**
     * Gets the orderbook given a market exchange, a pair, and the route.
     */
    var getOrderBookByExchangeAndPair = function(exchange, pair, route, callback) {
        request.get(route, function(error, response, body) {
            if (error) {
                console.log('OrderBook GET request failed for: ' + route);
                return callback(exchange, pair, {
                    error: 'OrderBook Get request failed.'
                });
            }
            if (!response || !body) {
                console.log('OrderBook GET request: No error thrown, but did not get a response or a body.');
                return callback(exchange, pair, {
                    error: 'No error thrown, but did not get a response or a body.'
                });
            }
            if (response.statusCode && response.statusCode !== 200) {
                console.log('OrderBook GET request StatusCode is: ' + response.statusCode);
                return callback(exchange, pair, {
                    error: 'OrderBook status code is not 200.'
                });
            }

            var jsonBody = JSON.parse(body);

            if (!jsonBody.result) {
                return callback(exchange, pair, {
                    error: 'Orderbook contains no results.'
                });
            }
            else if (!jsonBody.result.asks || !jsonBody.result.bids) {
                return callback(exchange, pair, {
                    error: 'Orderbook contains no asks/bids.'
                });
            }
            else if (jsonBody.result.asks.length == 0 || jsonBody.result.bids.length == 0) {
                return callback(exchange, pair, {
                    error: 'Orderbook contains empty lists of asks/bids.'
                });
            }

            return callback(
                exchange,
                pair,
                {
                    askPrice: parseFloat(jsonBody.result.asks[0][0]),
                    askLiquidity: parseFloat(jsonBody.result.asks[0][1]),
                    bidPrice: parseFloat(jsonBody.result.bids[0][0]),
                    bidLiquidity: parseFloat(jsonBody.result.bids[0][1]),
                    pair: pair,
                    exchange: exchange
                }
            );
        });
    };

    /**
     * Finds arbitrages based on the exchangeMap
     */
    var findArbitrages = function(exchangesMap) {
        for (var exchange1 in exchangesMap) {
           if (!exchangesMap.hasOwnProperty(exchange1)) continue;

           // iterate over the pairs in the exchange
           for (var i = 0; i < exchangesMap[exchange1].pairs.length; i++) {
               var pair1 = exchangesMap[exchange1].pairs[i];
               var route1 = orderbookRoute.replace('{e}', exchange1).replace('{p}', pair1);

               getOrderBookByExchangeAndPair(exchange1, pair1, route1, function(currExchange, currPair, orderBook1) {
                   if (orderBook1 && !orderBook1.error) {
                       // compare pairs in currExchange with other exchanges
                       for (var exchange in exchangesMap) {
                           if (!exchangesMap.hasOwnProperty(exchange)) continue;
                           if (exchange === currExchange) continue; // don't compare pairs from the same exchanges

                           // TODO: We are still comparing different pairs. Make sure only matching pairs are compared
                           if (exchangesMap[exchange].pairs.includes(currPair)) {
                               var route2 = orderbookRoute.replace('{e}', exchange).replace('{p}', currPair);

                               getOrderBookByExchangeAndPair(exchange, currPair, route2, function(ex, pa, orderBook2) {
                                   if (orderBook2 && !orderBook2.error) {
                                       // compare OrderBooks (find arbitrages)
                                       var diff1 = orderBook1.bidPrice - orderBook2.askPrice;
                                       var diff2 = orderBook2.bidPrice - orderBook1.askPrice;

                                       if (diff1 > 0) {
                                           var arbitrage = {
                                               orderBookBid: orderBook1,
                                               orderBookAsk: orderBook2,
                                               diff: diff1
                                           };

                                           console.log('Success! Arbitrage found.');
                                           console.log(arbitrage);

                                           writeArbitrageToDatabase(arbitrage);
                                       }
                                       if (diff2 > 0) {
                                           var arbitrage = {
                                               orderBookBid: orderBook2,
                                               orderBookAsk: orderBook1,
                                               diff: diff2
                                           };

                                           console.log('Success! Arbitrage found.');
                                           console.log(arbitrage);

                                           writeArbitrageToDatabase(arbitrage);
                                       }
                                   }
                               });
                           }
                       }
                   }
               });
           }
        }
    }

    request.get(cryptowatchBaseUrl + "/markets", function(error, response, body) {
        if (error) {
            console.log(error)
            return res.render("main/blogchainmain");
        }
        if (!response || response.statusCode !== 200) {
            console.log("Error: Markets status code is not 200.");
            return res.render("main/blogchainmain");
        }

        var jsonBody = JSON.parse(body);

        // Build a hashmap of exchanges and their supported pairs
        var exchangesMap = {};
        jsonBody.result.forEach(function(result) {
            if (result.active) {
                var exchange = result.exchange;
                var pair = result.pair;

                if (!(exchange in exchangesMap)) {
                    // add new exchange to the map
                    exchangesMap[exchange] = {
                        pairs: []
                    };
                }
                exchangesMap[exchange].pairs.push(pair);
            }
        });

        // var fs = require('fs');
        // fs.writeFile('ExchangesMap.json', JSON.stringify(exchangesMap), 'utf-8');

        findArbitrages(exchangesMap);
    });
}

module.exports = router;
