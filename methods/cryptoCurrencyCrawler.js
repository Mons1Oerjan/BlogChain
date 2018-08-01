var request = require('request');

var summaryURL = "https://api.cryptowat.ch/markets/{exchange}/{pair}/summary";

/**
 * Populates a 2D array with couples of the supported exchanges/pairs
 */
var getExchangePairList = function() {
    return [
        ['btcusd', 'gdax', 'https://pro.coinbase.com/'],
        ['btcusd', 'gemini', 'https://gemini.com/'],
        ['btcusd', 'bitbay', 'https://bitbay.net/en/home'],
        ['ethusd', 'gdax', 'https://pro.coinbase.com/'],
        ['ethusd', 'gemini', 'https://gemini.com/'],
        ['ethusd', 'bitbay', 'https://bitbay.net/en/home'],
        ['ltcusd', 'gdax', 'https://pro.coinbase.com/'],
        ['ltcusd', 'bitfinex', 'https://www.bitfinex.com/'],
        ['ltcusd', 'bitbay', 'https://bitbay.net/en/home']
    ];
};

var getExhangeList = function(){
  return [
    ['gdax', 'https://pro.coinbase.com/'],
    ['gemini', 'https://gemini.com/'],
    ['bitbay', 'https://bitbay.net/en/home'],
    ['bitfinex', 'https://www.bitfinex.com/']
  ];
};

var getPairList = function(){
  return [
    ['btcusd', "https://oroinc.com/b2b-ecommerce/wp-content/uploads/sites/3/2018/04/cryptocurrency-b2b-ecommerce.png"],
    ['ethusd', "https://oroinc.com/b2b-ecommerce/wp-content/uploads/sites/3/2018/04/cryptocurrency-b2b-ecommerce.png"],
    ['ltcusd', "https://oroinc.com/b2b-ecommerce/wp-content/uploads/sites/3/2018/04/cryptocurrency-b2b-ecommerce.png"]
  ];
};


//filters by pair
function filterPair(query){
  return function(element){
    return element.pair.localeCompare(query)===0;
  }
};
//filters by exchange
function filterExchange(query){
  return function(element){
    return element.exchange.localeCompare(query)===0;
  }
};

/**
 * Gets the summary given a market exchange, a pair, and the route.
 */
var getAllPrices = function(exchangePairList, callback) {
    var orderedPrices = [];
    var allPrices = [];
    exchangePairList.forEach(function(exchangePair) {
        var pair = exchangePair[0];
        var exchange = exchangePair[1];
        var exchangeUrl = exchangePair[2];

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
                    console.log(route);
                    console.log(jsonBody.result);
                    reject('Summary does not indicate a volume.');
                }

                var summary = {
                    exchange: exchange,
                    pair: pair,
                    url: exchangeUrl,
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
                //create a ordered secondary structure to display automatically
                var pairList = getPairList();
                for(var i =0; i<pairList.length; i++){
                  var temp = {pair: pairList[i][0], url : pairList[i][1], exchanges: [] };
                  var infoPairs = allPrices.filter(filterPair(temp.pair)); // get all info for a single currency
                  for(var j=0; j<infoPairs.length; j++){
                    var exchangeTemp = {
                      exchange: infoPairs[j].exchange,
                      url: infoPairs[j].url,
                      last: infoPairs[j].last,
                      highest: infoPairs[j].highest,
                      lowest: infoPairs[j].lowest,
                      volume: infoPairs[j].volume
                    };
                    temp.exchanges.push(exchangeTemp);
                  };
                  orderedPrices.push(temp);
                };
                //console.log(orderedPrices);
                return callback(orderedPrices);
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
