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
router.get("/:username/profile", function(req, res) {
    //console.log("username is " + req.params.username);
    
    var filter = { username: req.params.username };
    User.find(filter, function(err, userFound) {
        //console.log(userFound);
        var uname = userFound[0].username;
        //console.log(uname);
        res.render('main/profile', { uname: uname }, function(err,html) { 
            if(err){ console.log("get username/profile: " + err); res.sendStatus(500);}
            res.send(html);
        });
    });
});

/**
 * Delete User
 */
router.delete("/:username/profile", function(req, res) {
    var userToDelete = { username: req.params.username };
    User.remove(userToDelete, function(err) {
        if(err) { 
            console.log("delete username/profile: " + err);
            req.flash("Could not remove user profile!");
            return res.redirect("/");
        }
        req.flash("Your account has been deleted");
        req.logout();
        return res.redirect("/");
    });
});

/**
 * Update Username
 */
router.get("/:username/update", function(req, res) {
    res.render('main/updateprofile', { user : req.params.username });
});

/**
 * Process Update Username
 */
router.put("/:username/update", isUserLoggedIn, function(req, res) {
    //var userToUpdate = { _id: req.user.id };
    console.log(req.user._id);
    console.log(req.body.new_username);
    User.findById(req.user._id, 
        function(err, userFound) {
            if(err){
                console.log("find in username/update: " + err);
                req.flash("Error updating user!");
                return res.redirect("/");
            }
            userFound.username = req.body.new_username;

            userFound.save(function (err, u) {
                if(err) {
                    console.log(err);
                    req.flash("Could not update username!");
                    return res.redirect("/dashboard");
                }
                console.log("user saved: " + u);
                return res.redirect("/dashboard");
            });
         });
});

module.exports = router;
