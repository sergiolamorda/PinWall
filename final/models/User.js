var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    //email: { type: String, unique: true, lowercase: true, required: true, trim: true },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

userSchema.pre('save', function(next) {
    var user = this;
    if(!user.isModified('password')) {
        return next();
    }

    bcrypt.genSalt(10, (err, salt) => {
        if(err) next(err);
        bcrypt.hash(user.password, salt, null, (err, hash) => {
            if(err) next(err);
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, (err, equals) => {
        if(err) return cb(err);
        cb(null, equals);
    });
}

module.exports = mongoose.model("User", userSchema);
