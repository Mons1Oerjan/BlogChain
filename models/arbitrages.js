var mongoose = require("mongoose");

var arbitragesSchema = new mongoose.Schema({
    pair: String,
    arbitrageOpportunity: Number,
    spread: Number,
    spreadPct: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    orderBookBid: {
        exchange: String,
        pair: String,
        askPrice: Number,
        askLiquidity: Number,
        bidPrice: Number,
        bidLiquidity: Number,
    },
    orderBookAsk: {
        exchange: String,
        pair: String,
        askPrice: Number,
        askLiquidity: Number,
        bidPrice: Number,
        bidLiquidity: Number,
    }
});

module.exports = mongoose.model("Arbitrages", arbitragesSchema);
