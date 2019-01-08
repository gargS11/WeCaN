const mongoose = require('mongoose');

const CommunitySchema = mongoose.Schema({
  community_name: { type: String, required: true },
  
  description: { type: String, required: true },
  
  type: { type: String, required: true, default: 'direct' },
  
  community_pic: { type: String, required: true },
  
  creator: { type: String, required: true },
  
  isActivated: { type: Boolean, default: true, required: true },
  
  created_at: { type: Date, default: Date.now, required: true },
  
  members: { type: [{ email: String, status: Number }], default: [] },
  //status 0 represents member, 1- has been invited to join, 2- has requested to join, 3- owner

});

const Communities = mongoose.model('Communities', CommunitySchema);
module.exports = Communities;