//see for req.flash()

const express = require('express');
const app = express();

const expressValidator = require('express-validator');
const bcrypt = require('bcryptjs');    //to hash passwords
const session = require('express-session');
const cookieParser = require('cookie-parser');

var User = require('./models/user');

const config = require('./config/database');
const mongoose = require('mongoose');
mongoose.connect(config.database, { useCreateIndex: true, useNewUrlParser: true });
let db = mongoose.connection;

db.once('open', function () {
    console.log('Connected to Mongo db');
})
db.on('error', function (err) {
    console.log(err);
});

app.set('view engine', 'ejs');

//middlewares
//handle static pages routes
app.use(express.static('public'));
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse application/json
app.use(express.json());
// add validation methods to request
app.use(expressValidator());
// cookie parser middleware
app.use(cookieParser());
//express session middleware
app.use(session({
    secret: "wecan", resave: false,
    saveUninitialized: true
}));

//login form
app.get('/login', function (req, res) {
    res.render('login', { message: "" });
});

//login process
app.post('/login', function (req, res) {
    let query = { email: req.body.email };
    User.findOne(query, function (err, user) {
        if (err)
            throw err;
        if (!user) {
            res.render('login', { message: "Invalid User!" });
        } else {
            bcrypt.compare(req.body.password, user.password, function (err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    req.session.user = user;
                    res.redirect('/admin/register');
                } else {
                    res.render('login', { message: "Invalid Password!" });
                }
            });
        }
    });
});

//logging out
app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        console.log("user logged out.")
    });
    res.redirect('/login');
});

function checkSignIn(req, res, next) {
    /*if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');*/
    if (req.session.user) {
        next();     //If session exists, proceed to page
    } else {
        var err = new Error("Not logged in!");
        console.log(req.session.user);
        next(err);  //Error, trying to access unauthorized page!
    }
}
//register form
app.get('/admin/register', function (req, res) {
    res.render('admin/register');
});
//register process
app.post('/admin/register', function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role;
    console.log(req.body);
    // *Express validator not working properly*
    /*req.checkBody(email, 'Email is required').notEmpty();
    req.checkBody(email, 'Email is not valid').isEmail();
    req.checkBody(password, 'Password is required').notEmpty();
    req.checkBody(role, 'Individual Role is required').notEmpty();

    let errors = req.validationErrors();
    console.log(errors);
    if (errors) {
        res.render('admin/register', { errors: errors });
    } else {*/
    let newUser = new User({
        email: email,
        password: password,
        role: role,
        username: email.substring(0, email.lastIndexOf("@")),
        isProfileSet: false,
        isDeleted: false,
        created_at: new Date()
    });
    //hashing password
    bcrypt.genSalt(10, function (err, salt) { //here 10 represents saltRounds
        bcrypt.hash(newUser.password, salt, function (err, hash) {
            if (err) {
                console.log(err);
            }
            newUser.password = hash;
            console.log(newUser);
            newUser.save(function (err) {
                if (err) {
                    console.log(err);
                    return;
                }
                else {
                    console.log("User saved to database");
                    res.redirect('/admin/register');
                }
            });
        });
    });
});

app.listen(8000);
console.log('8000 is the magic port');