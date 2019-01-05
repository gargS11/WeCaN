const mongoose = require('mongoose');

const ProfileSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullname: {type: String, required: true},
  dob: {type: String, required: true},
  mobile: {type: Number, required: true},
  gender: {type: String, required: true},
  city: {type: String, required: true},
  hobbies: {type: String, required: true},
  bio: {type: String, required: true},
  profilepic: {type: Object, required: true}
});

// the schema is useless so far
// we need to create a model using it
const Profile = mongoose.model('Profile', ProfileSchema);
module.exports = Profile;