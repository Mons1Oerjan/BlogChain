var mongoose = require("mongoose");

var blogSchema = new mongoose.Schema({
   name: String,
   content: String,
   createdAt: {
       type: Date,
       default: Date.now
   },
   imageID: String,
   imageURL: String,
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comments"
      }
   ]
 },
 {
   usePushEach: true
});

module.exports = mongoose.model("Blogs", blogSchema);
