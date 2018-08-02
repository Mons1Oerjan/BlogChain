var request = require('request');

var summaryURL = "https://api.cryptowat.ch/markets/{exchange}/{pair}/summary";

/**
 * Populates a 2D array with couples of the supported exchanges/pairs
 */
var getExchangePairList = function() {
    return [
        ['btcusd', 'gdax', 'https://pro.coinbase.com/', "http://icons.iconarchive.com/icons/froyoshark/enkel/256/Bitcoin-icon.png", "https://developers.coinbase.com/images/coinbase.png"],
        ['btcusd', 'gemini', 'https://gemini.com/', "http://icons.iconarchive.com/icons/froyoshark/enkel/256/Bitcoin-icon.png", "https://s2.coinmarketcap.com/static/img/exchanges/32x32/151.png"],
        ['btcusd', 'bitbay', 'https://bitbay.net/en/home', "http://icons.iconarchive.com/icons/froyoshark/enkel/256/Bitcoin-icon.png", "https://s2.coinmarketcap.com/static/img/exchanges/32x32/82.png"],
        ['ethusd', 'gdax', 'https://pro.coinbase.com/', "https://s2.coinmarketcap.com/static/img/coins/200x200/1027.png", "https://developers.coinbase.com/images/coinbase.png"],
        ['ethusd', 'gemini', 'https://gemini.com/', "https://s2.coinmarketcap.com/static/img/coins/200x200/1027.png", "https://s2.coinmarketcap.com/static/img/exchanges/32x32/151.png"],
        ['ethusd', 'bitbay', 'https://bitbay.net/en/home', "https://s2.coinmarketcap.com/static/img/coins/200x200/1027.png", "https://s2.coinmarketcap.com/static/img/exchanges/32x32/82.png"],
        ['ltcusd', 'gdax', 'https://pro.coinbase.com/', "https://i.redditmedia.com/GTiGM0IrtqlXp5U7jCyaG4cI3RiRx3GfCR6oVNLT8jk.jpg?w=320&s=45820609d95d70ae4bf16cdcb527d6d6", "https://developers.coinbase.com/images/coinbase.png"],
        ['ltcusd', 'bitfinex', 'https://www.bitfinex.com/', "https://i.redditmedia.com/GTiGM0IrtqlXp5U7jCyaG4cI3RiRx3GfCR6oVNLT8jk.jpg?w=320&s=45820609d95d70ae4bf16cdcb527d6d6", "https://s2.coinmarketcap.com/static/img/exchanges/16x16/37.png"],
        ['ltcusd', 'bitbay', 'https://bitbay.net/en/home', "https://i.redditmedia.com/GTiGM0IrtqlXp5U7jCyaG4cI3RiRx3GfCR6oVNLT8jk.jpg?w=320&s=45820609d95d70ae4bf16cdcb527d6d6", "https://s2.coinmarketcap.com/static/img/exchanges/32x32/82.png"]
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
    ['btcusd', "http://icons.iconarchive.com/icons/froyoshark/enkel/256/Bitcoin-icon.png"],
    ['ethusd', "https://s2.coinmarketcap.com/static/img/coins/200x200/1027.png"],
    ['ltcusd', "https://i.redditmedia.com/GTiGM0IrtqlXp5U7jCyaG4cI3RiRx3GfCR6oVNLT8jk.jpg?w=320&s=45820609d95d70ae4bf16cdcb527d6d6"]
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
        var imageURL = exchangePair[3];
        var exchangeImage = exchangePair[4];

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
                    image: imageURL,
                    url: exchangeUrl,
                    exchangeImage: exchangeImage,
                    last: (jsonBody.result) ? parseFloat(jsonBody.result.price.last) : -1,
                    highest: (jsonBody.result) ? parseFloat(jsonBody.result.price.high) : -1,
                    lowest: (jsonBody.result) ? parseFloat(jsonBody.result.price.low) : -1,
                    volume: (jsonBody.result) ? parseFloat(jsonBody.result.volume) : -1
                };
                resolve(summary);
            });
        });

        requestPromise.then(function(result) {
            allPrices.push(result);
            if (allPrices.length === 9) {  // hack
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
