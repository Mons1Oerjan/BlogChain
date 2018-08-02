var request = require('request');
var Arbitrage = require("../models/arbitrages");

var cryptowatchBaseUrl = "https://api.cryptowat.ch";
var marketsRoute = cryptowatchBaseUrl + "/markets";
var orderbookRoute = cryptowatchBaseUrl + "/markets/{e}/{p}/orderbook";

/**
 * Writes a given arbitrage object to the database.
 */
var writeArbitrageToDatabase = function(arbitrage) {
    Arbitrage.create(arbitrage, function(err, arbitrageCreated) {
        if (err) {
            console.log('Error: Could not write arbitrage to DB.');
        } else {
            console.log('Wrote arbitrage to DB:');
            console.log(arbitrageCreated);
        }
    });
};

/**
 * Gets the orderbook given a market exchange, a pair, and the route.
 */
var getOrderBookByExchangeAndPair = function(exchange, pair, callback) {
    var route = orderbookRoute.replace('{e}', exchange).replace('{p}', pair);

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
                askPrice: Number(parseFloat(jsonBody.result.asks[0][0]).toFixed(4)),
                askLiquidity: Number(parseFloat(jsonBody.result.asks[0][1]).toFixed(4)),
                bidPrice: Number(parseFloat(jsonBody.result.bids[0][0]).toFixed(4)),
                bidLiquidity: Number(parseFloat(jsonBody.result.bids[0][1]).toFixed(4)),
                pair: pair,
                exchange: exchange
            }
        );
    });
};

/**
 * Builds the arbitrage object to be stored in the database.
 * Calculates the spread, spreadPercentage, and arbitrageOpportunity values.
 * Returns null if there is no spread between the two orderbooks (i.e. there is no arbitrage).
 */
var buildArbitrageObject = function(pair, orderBook1, orderBook2) {
    var spread = orderBook1.bidPrice - orderBook2.askPrice;

    if (spread <= 0) {
        // no arbitrage found.
        return null;
    }

    var spreadPct = spread / orderBook1.bidPrice;
    var cryptoReturn = spreadPct * Math.min(
        orderBook1.bidLiquidity,
        orderBook2.askLiquidity
    );
    var dollarReturn = cryptoReturn * Math.min(
        orderBook1.bidLiquidity,
        orderBook2.askLiquidity
    );

    if (dollarReturn < 10) {
        // the arbitrage is too small to be worth showing.
        return null;
    }

    return {
        pair: pair,
        spread: Number(spread.toFixed(4)),
        spreadPct: Number((spreadPct * 100).toFixed(2)),
        cryptoReturn: Number(cryptoReturn.toFixed(2)),
        dollarReturn: Number(dollarReturn.toFixed(2)),
        orderBookBid: orderBook1,
        orderBookAsk: orderBook2
    };
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

           getOrderBookByExchangeAndPair(exchange1, pair1, function(currExchange, currPair, orderBook1) {
               if (orderBook1 && !orderBook1.error) {
                   // compare pairs in currExchange with other exchanges
                   for (var exchange in exchangesMap) {
                       if (!exchangesMap.hasOwnProperty(exchange)) continue;
                       if (exchange === currExchange) continue; // don't compare pairs from the same exchanges
                       if (exchangesMap[exchange].pairs.includes(currPair)) {
                           getOrderBookByExchangeAndPair(exchange, currPair, function(ex, pair, orderBook2) {
                               if (orderBook2 && !orderBook2.error) {
                                   var arbitrage1 = buildArbitrageObject(pair, orderBook1, orderBook2);
                                   var arbitrage2 = buildArbitrageObject(pair, orderBook2, orderBook1);

                                   if (arbitrage1 !== null) {
                                       writeArbitrageToDatabase(arbitrage1);
                                   }
                                   if (arbitrage2 !== null) {
                                       writeArbitrageToDatabase(arbitrage2);
                                   }
                               }
                           });
                       }
                   }
               }
           });
       }
    }
};

/**
 * Builds a hashmap of exchanges and their supported pairs
 */
var buildExchangesMap = function(json) {
    var exchangesMap = {};

    json.result.forEach(function(result) {
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

    return exchangesMap;
};

module.exports = {
    /**
     * Gets the arbitrages by comparing exchanges and pairs.
     */
    getArbitrages: function() {
        request.get(marketsRoute, function(error, response, body) {
            if (error) {
                console.log(error);
                return;
            }
            else if (!response) {
                console.log('Error: No response from the CryptoWatch API.');
                return;
            }
            else if (response.statusCode !== 200) {
                console.log("Error: Markets status code is: " + response.statusCode);
                if (response.statusCode === 429) {
                    console.log('You have reached the CryptoWatch API Rate Limit of 8 seconds CPU time on their server.');
                }
                return;
            }
            else {
                var jsonBody = JSON.parse(body);
                var exchangesMap = buildExchangesMap(jsonBody);
                findArbitrages(exchangesMap);
            }
        });
    }
};
