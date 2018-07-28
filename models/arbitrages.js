var mongoose = require("mongoose");

var arbitragesSchema = new mongoose.Schema({
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
    },
    arbitrageOpportunity: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Arbitrages", arbitragesSchema);
