/**
 * Routes for:
 *  - Getting user profile
 *  - User deleting themselves
 *  - User updating their username
 */

var express = require("express");
var router  = express.Router();
var passport = require("passport");

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
router.put("/:username/update", function(req, res) {
    var userToUpdate = { username: req.params.username };
    User.find(userToUpdate, function(err, userFound) {
        if(err) {
            console.log("find in username/update: " + err);
            req.flash("Error finding user!");
            return res.redirect("/");
        }
        uname = userFound[0].username;
        User.update({username: uname}, {
            username: req.params.new_username
            }, function(err) {
                    if(err) {
                        console.log("processing username/update: " + err);
                        req.flash("Could not update username!");
                        return res.redirect("/");
                    }
                    req.logout();
                    req.flash("Your username has been changed!");
                    return res.redirect("/");
                }
         );            
    });
});


module.exports = router;
