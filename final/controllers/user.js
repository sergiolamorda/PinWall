var passport = require('passport'),
    User = require('../models/User');

exports.postSignup = (req, res, next) => {
    console.log(req.body);
    if(req.body.password1 == req.body.password2) {
        var newUser = new User({
            username: req.body.username,
            password: req.body.password1
        });

        User.findOne({username: req.body.username}, (err, exists) => {
            if(exists) return res.render('login', { error: 'El usuario ya existe' });
            newUser.save((err) => {
                if(err) next(err);
                req.logIn(newUser, (err) => {
                    if(err) next(err);
                    res.redirect('/');
                });
            });
        });
    }
}

exports.postLogin = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if(err) next(err);
        if(!user) return res.render('login', { error: 'Usuario o contraseña no válidos' });
        req.logIn(user, (err) => {
            if(err) next(err);
            res.redirect('/');
        });
    })(req, res, next);
}

exports.logout = (req, res) => {
    req.logout();
    res.redirect('/login');
}
