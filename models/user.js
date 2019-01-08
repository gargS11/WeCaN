const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  
  password: { type: String, required: true },
  
  role: { type: String, required: true }, //admin, user or community manager
  
  username: { type: String, required: true },
  
  profileimg: { type: String },
  
  isProfileSet: { type: Boolean, default: false, required: true },
  
  isActivated: { type: Boolean, default: true, required: true },
  
  created_at: { type: Date, default: Date.now, required: true },
  
  communities: { type: [{ id: Schema.Types.ObjectId, status: Number }], default: [] }
  //here every community will have status where 0 means user is member, 1 means user has been 
  //invited to join, 2 means user has requested to join, 3 means user is owner of the community
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
