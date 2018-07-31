var request = require('request');

var summaryURL = "https://api.cryptowat.ch/markets/{exchange}/{pair}/summary";

/**
 * Populates a 2D array with couples of the supported exchanges/pairs
 */
var getExchangePairList = function() {
    return [
        ['btcusd', 'gdax'],
        ['btcusd', 'quadriga'],
        ['btcusd', 'bitbay'],
        ['ethusd', 'gdax'],
        ['ethusd', 'quadriga'],
        ['ethusd', 'bitbay'],
        ['ltcusd', 'gdax'],
        ['ltcusd', 'bitfinex'],
        ['ltcusd', 'bitbay']
    ];
};

/**
 * Gets the summary given a market exchange, a pair, and the route.
 */
var getAllPrices = function(exchangePairList, callback) {
    var allPrices = [];
    exchangePairList.forEach(function(exchangePair) {
        var pair = exchangePair[0];
        var exchange = exchangePair[1];
        var route = summaryURL.replace('{exchange}', exchange).replace('{pair}', pair);

        var requestPromise = new Promise(function(resolve, reject) {
            request.get(route, function(error, response, body) {
                if (error) {
                    console.log('Summary GET failed for: ' + route);
                    reject('Summary GET request failed');
                }

                if (!response) { //response missing
                    console.log('Summary GET Request: Missing response');
                    reject('Summary GET Request: Missing response');
                } else if (!body) { //body missing
                    console.log('Summary GET Request: Missing body');
                    reject('Summary GET Request: Missing body');
                }

                if (response.statusCode && response.statusCode !== 200) {
                    console.log('Summary GET request status code: ' + response.statusCode);
                    reject('Summary GET request status code: ' + response.statusCode);
                }

                var jsonBody = JSON.parse(body);

                if (!jsonBody.result) { //no results returned
                    reject('Summary contains no results.');
                } else if (!jsonBody.result.price) { //no prices listed in summary
                    reject('Summary contains no prices.');
                } else if (!jsonBody.result.volume) { //no volume for the exchange + pair listed
                    reject('Summary does not indicate a volume.');
                }

                var summary = {
                    exchange: exchange,
                    pair: pair,
                    last: parseFloat(jsonBody.result.price.last),
                    highest: parseFloat(jsonBody.result.price.high),
                    lowest: parseFloat(jsonBody.result.price.low),
                    volume: parseFloat(jsonBody.result.volume)
                };

                resolve(summary);
            });
        });

        requestPromise.then(function(result) {
            allPrices.push(result);
            if (allPrices.length === 8) {  // hack
                return callback(allPrices);
            }
        }, function(err) {
            console.log(err);
            allPrices.push({error: err});
        });
    });
};

module.exports = {
    /**
     * Get the prices for each cryptocurrency
     */
    getPrices: function(cb) {
        var exchangePairList = getExchangePairList();

        getAllPrices(exchangePairList, function(allPrices) {
            return cb(allPrices);
        });
    }
};
