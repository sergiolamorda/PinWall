var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var scoreSchema = new Schema({
    points: Number,
    username: String,
    type: String
});

module.exports = mongoose.model("Score", scoreSchema);
