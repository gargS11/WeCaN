const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }, //admin, user or community manager
  username: { type: String, required: true },
  profileimg: { type: String },
  isProfileSet: Boolean,
  isActivated: Boolean,
  created_at: Date
});

// the schema is useless so far
// we need to create a model using it
const User = mongoose.model('User', UserSchema);
module.exports = User;

/*
// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);
userSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();

  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});*/
