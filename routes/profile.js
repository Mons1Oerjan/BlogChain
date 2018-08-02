/**
 * Routes for:
 *  - Getting user profile
 *  - User deleting themselves
 *  - User updating their username
 */

var express = require("express");
var router  = express.Router();
var passport = require("passport");
var middleware = require("../middleware/index");
var { isUserLoggedIn } = middleware;

var User = require("../models/user");


/**
 * User profile view
 */
router.get("/:username/profile", isUserLoggedIn, function(req, res) {
    //console.log("username is " + req.params.username);

    var filter = { username: req.params.username };
    User.find(filter, function(err, userFound) {
        //console.log(userFound);
        if(err){
          console.log("error in username/update: " + err);
          req.flash('error', "Your profile could not be found!");
          return res.redirect("/dashboard");
        }
        var uname = userFound[0].username;
        var name = userFound[0].name;
        var wallet = userFound[0].wallet;
        //console.log(uname);
        res.render('main/profile', { uname: uname, name: name, wallet: wallet }, function(err,html) {
            if(err){ console.log("get username/profile: " + err); res.sendStatus(500);}
            res.send(html);
        });
    });
});

/**
 * Update user profile
 */
router.put("/:username/updateprof", isUserLoggedIn,function(req, res) {
    User.findById(req.user._id,
        function(err, userFound) {
            if(err){
                console.log("error in username/update: " + err);
                req.flash('error', "Error updating user!");
                return res.redirect("/");
            }
            userFound.name = req.body.name;
            userFound.wallet = req.body.wallet;
            userFound.save(function (err, u) {
                if(err) {
                    console.log(err);
                    req.flash('error', "Could not update username!");
                    return res.redirect("/dashboard");
                }
                req.flash('success', "You username has been updated!");
                //console.log("user saved: " + u);
                return res.redirect("/dashboard");
            });
     });
});

/**
 * Delete User
 */
router.delete("/:username/profile", isUserLoggedIn,function(req, res) {
    var userToDelete = { username: req.params.username };
    User.remove(userToDelete, function(err) {
        if(err) {
            console.log("delete username/profile: " + err);
            req.flash('error' ,"Could not remove user profile!");
            return res.redirect("/");
        }
        req.flash('success' ,"Your account has been deleted");
        req.logout();
        return res.redirect("/");
    });
});

/**
 * Update Username
 */
router.get("/:username/updateusername", isUserLoggedIn,function(req, res) {
    res.render('main/updateusername', { user : req.params.username });
});

/**
 * Process Update Username
 */
router.put("/:username/updateusername", isUserLoggedIn, function(req, res) {
    //var userToUpdate = { _id: req.user.id };
    //console.log(req.user._id);
    //console.log(req.body.new_username);
    User.findById(req.user._id,
        function(err, userFound) {
            if(err){
                console.log("find in username/update: " + err);
                req.flash('error', "Error updating user!");
                return res.redirect("/");
            }
            userFound.username = req.body.new_username;

            userFound.save(function (err, u) {
                if(err) {
                    console.log(err);
                    req.flash('error', "Could not update username!");
                    return res.redirect("/dashboard");
                }
                //console.log("user saved: " + u);
                req.flash('success', "Your username was updated!");
                return res.redirect("/dashboard");
            });
         });
});

module.exports = router;
