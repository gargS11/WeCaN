
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
app.get('/admin/register', checkSignIn, function (req, res) {
    res.render('admin/register', { user: req.session.user });
});

//importing user model
var User = require('./models/user');

//importing profile model
var Profile = require('./models/profile');

//importing communities model
var Community = require('./models/communities');

//register process
app.post('/admin/register', checkSignIn, function (req, res) {
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
app.get('/admin/userlist', checkSignIn, function (req, res) {
    User.find({}, function (err, userlist) {
        if (err) throw err;
        else {
            res.render('admin/userlist', { user: req.session.user, userlist: userlist });
        }
    });
});

//get communitieslist
app.get('/admin/communitieslist', checkSignIn, function (req, res) {
    Community.find({}, function (err, communitieslist) {
        if (err) throw err;
        else {
            res.render('admin/communitieslist',{ user: req.session.user, communitieslist: communitieslist });
        }
    });
});

//set profile form
app.get('/setprofile', checkSignIn, function (req, res) {
    res.render('setprofile', { user: req.session.user });
});

//set storage engine for profile images
const profileStorage = multer.diskStorage({
    destination: './public/images/uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const profileUpload = multer({ storage: profileStorage });

//setting profile process
app.post('/setprofile', checkSignIn, profileUpload.single('profilepic'), function (req, res, next) {
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
app.get('/profile', checkSignIn, function (req, res) {
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
app.get('/editProfile', checkSignIn, function (req, res) {
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
app.get('/user/myCommunities', checkSignIn, function (req, res) {
    //here we need particular user communities not all communities
    Community.find({}, function (err, myCommunities) {
        if (err) throw err;
        else {
            res.render('user/myCommunities', { user: req.session.user, myCommunities: myCommunities });
        }
    });
});

//get create community form
app.get('/user/createCommunity', checkSignIn, function (req, res) {
    res.render('user/createCommunity', { user: req.session.user });
});

//set storage engine for profile images
const communityStorage = multer.diskStorage({
    destination: './public/images/communities/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const communityUpload = multer({ storage: communityStorage });

//create community process
app.post('/user/createCommunity', checkSignIn, communityUpload.single('community_pic'), function (req, res) {
    let newCommunity = new Community({
        community_name: req.body.community_name,
        description: req.body.description,
        type: req.body.type,
        community_pic: '/images/uploads/' + req.file.filename,
        creator: req.session.user.email,
        members: { email: req.session.user.email, status: '3' }
    });
    console.log(newCommunity);
    newCommunity.save(function (err) {
        if (err) {
            console.log(err);
            return;
        }
        else {
            console.log("Community saved to database");
            User.updateOne({ email: req.session.user.email },
                { $push: { communities: { id: newCommunity._id, status: '3' } } },
                function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        req.session.user.message = "Community Created Successfully";
                        res.redirect('/user/createCommunity');
                    }
                });
        }
    });
});

app.listen(8000);
console.log('8000 is the magic port');