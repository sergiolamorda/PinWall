var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id)

    done(null, user)

    /*
    User.findById(id, (err, user) => {
        done(err, user);
    });
    */
});

passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password1'
    },
    async (username, password, done) => {
        const user = await User.findOne({ username })

        if (!user) {
            return done(null, false, {message: `Este username: ${username} no esta registrado`});
        } else user.comparePassword(password, (err, equals) => {
            if(equals) return done(null, user);
            else return done(null, false, {message: 'La contraseña no es válida'});
        });
        
        /*
        User.findOne({username}, (err, user) => {
            if(!user) {
                return done(null, false, {message: `Este username: ${username} no esta registrado`});
            }
            else user.comparePassword(password, (err, equals) => {
                if(equals) return done(null, user);
                else return done(null, false, {message: 'La contraseña no es válida'});
            });
        });
        */
    }
));

exports.isAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()) return next();
    res.redirect('/login');
}
