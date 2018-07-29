var mongoose = require("mongoose");

var currencySchema = new mongoose.Schema({
    exchange: String,
    pair: String,
    last: Number,
    highest: Number,
    lowest: Number,
    volume: Number
});

module.exports = mongoose.model("Arbitrages", arbitragesSchema);
