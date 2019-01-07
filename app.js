//see for req.flash()

const express = require('express');
//Init app
const app = express();

const expressValidator = require('express-validator');
const bcrypt = require('bcryptjs');    //to hash passwords
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');  //to store images

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
                    if (req.session.user.isProfileSet === false) {
                        res.redirect('/setprofile');
                    } else {
                        res.redirect('/profile');
                    }
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
    res.render('admin/register', { user: req.session.user });
});

//importing user model
var User = require('./models/user');

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
    let query = { email: email };
    User.findOne(query, function (err, user) {
        if (err) throw err;
        else if (user) {
            console.log("User saved to database");
            req.session.user.message = "Already registered";
            res.redirect('/admin/register');
        }
        else {
            let newUser = new User({
                email: email,
                password: password,
                role: role,
                username: email.substring(0, email.lastIndexOf("@")),
                isProfileSet: false,
                isActivated: true,
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
                            req.session.user.message = "Registered Successfully";
                            res.redirect('/admin/register');
                        }
                    });
                });
            });
        }
    });
});

//get userlist
app.get('/admin/userlist', function (req, res) {
    User.find({}, function (err, userlist) {
        if (err) throw err;
        else {
            res.render('admin/userlist', { user: req.session.user, userlist:userlist });
        }
    });
});
//get communitieslist
app.get('/admin/communitieslist', function (req, res) {
    res.render('admin/communitieslist', { user: req.session.user });
});
//set profile form
app.get('/setprofile', function (req, res) {
    res.render('setprofile', { user: req.session.user });
});

//set storage engine for images
const storage = multer.diskStorage({
    destination: './public/images/uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

//importing profile model
var Profile = require('./models/profile');

//setting profile process
app.post('/setprofile', upload.single('profilepic'), function (req, res, next) {
    console.log(req.file);
    let newProfile = new Profile({
        email: req.session.user.email,
        fullname: req.body.fullname,
        dob: req.body.dob,
        mobile: req.body.mobile,
        gender: req.body.gender,
        city: req.body.city,
        hobbies: req.body.hobbies,
        bio: req.body.bio,
        profilepic: req.file
    });
    console.log(newProfile);
    newProfile.save(function (err) {
        if (err) {
            console.log(err);
            return;
        }
        else {
            console.log("Profile saved to database");
            let user = {};
            user.isProfileSet = true;
            user.profileimg = "/images/uploads/" + req.file.filename;

            User.update({ email: req.session.user.email }, user, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    res.redirect('/profile');
                }
            });
        }
    });
});

//getting home i.e profile page
app.get('/profile', function (req, res) {
    let query = { email: req.session.user.email };
    Profile.findOne(query, function (err, profile) {
        if (err) throw err;
        if (!profile) {
            res.send('Profile not found');
        }
        else {
            User.findOne(query, function (err, user) {
                if (err) throw err;
                else {
                    profile.imgsrc = "/images/uploads/" + profile.profilepic.filename;
                    res.render('profile', { user: user, profile: profile, });
                }
            });
        }
    });
});

//get editProfile form
app.get('/editProfile', function (req, res) {
    let query = { email: req.session.user.email };
    Profile.findOne(query, function (err, profile) {
        if (err) throw err;
        if (!profile) {
            res.send('Profile not found');
        }
        else {
            User.findOne(query, function (err, user) {
                if (err) throw err;
                else {
                    profile.imgsrc = "/images/uploads/" + profile.profilepic.filename;
                    res.render('editProfile', { user: user, profile: profile, });
                }
            });
        }
    });
});
//edit Profile process
app.post('/editProfile', function (req, res) {
    res.render('user/createCommunity', { user: req.session.user });
});

//get my Communities
app.get('/user/myCommunities', function (req, res) {
    res.render('user/myCommunities', { user: req.session.user });
});
//get create community form
app.get('/user/createCommunity', function (req, res) {
    res.render('user/createCommunity', { user: req.session.user });
});
//create community
app.post('/user/createCommunity', function (req, res) {
    res.render('user/createCommunity', { user: req.session.user });
});

app.listen(8000);
console.log('8000 is the magic port');