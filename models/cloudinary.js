var cloudinary = require("cloudinary");

// TODO: Create a BlogChain account on Cloudinary instead of using Seyd's account.
cloudinary.config({
  cloud_name: 'sy349773',
  api_key: '481619294194919',
  api_secret: 'SaEz0J3KNMvoRMN75L8CZbFFi0E',
  secure: true
});

module.exports = cloudinary;
