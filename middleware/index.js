var Comments = require('../models/comments');
var Blogs = require('../models/blogs');

/**
* Authentication Middleware
*/
module.exports = {
    /**
     * Function to check if the user is authenticated.
     */
    isUserLoggedIn: function(req, res, next) {
        if (req.isAuthenticated()) {
            // The user is authenticated. simply return.
            return next();
        }
        req.flash('error', 'Please Sign In');
        res.redirect('/login');
    },

    /**
     * Check if the user is the author of the blog.
     * This makes sure that no other user can update or delete the blog.
     */
    checkAuthorBlog: function(req, res, next) {
        Blogs.findById(req.params.id, function(err, foundBlog) {
            if (err || !foundBlog) {
                console.log(err);
                req.flash('error', 'Sorry, this blog no longer exist!');
                res.redirect('/blogs');
            } else if(foundBlog.author.id.equals(req.user._id)){
                // the logged in user is the author.
                req.blog = foundBlog;
                next();
            }
        });
    },
    /**
     * Checks if the user is the author of the comment.
     * This makes sure that no other user can update or delete the comment.
     */
    checkAuthorComment: function(req, res, next) {
        Comments.findById(req.params.commentId, function(err, foundComment) {
           if (err || !foundComment) {
               console.log(err);
               req.flash('error', 'Sorry, this comment no longer exist!');
               res.redirect('/blogs');
           } else if (foundComment.author.id.equals(req.user._id)) {
               // the logged in user is the author.
               req.comment = foundComment;
               next();
           }
        });
    }
}
