var express = require("express");
var router = express.Router({mergeParams: true});
var Blog = require("../models/blogs");
var Comments = require("../models/comments");
var middleware = require("../middleware/index");
var { isUserLoggedIn, checkAuthorBlog, checkAuthorComment } = middleware;

/**
 * Post Comment (create new)
 */
router.post("/new", isUserLoggedIn, function(req, res) {
    Blog.findById(req.params.id, function(err, blog) {
        if (err) {
          req.flash('error', 'Sorry, that Blog does not exist.');
          return res.redirect('main/blogs');
        }

        Comments.create(req.body.comment, function(error, comment) {
            if (error) {
                req.flash('error', 'Sorry, the comment could not be created.');
                console.log(error);
                return res.redirect('main/blogs');
            }

            // add userName and userId to the comment and save
            comment.author.id = req.user._id;
            comment.author.username = req.user.username;
            comment.save();
            blog.comments.push(comment);
            blog.save(function(err){
              if(err){
                req.flash('error', 'Sorry, the comment could not be created.');
                console.log(err);
                res.redirect('/blogs/' + blog._id);
              }
              else{
                req.flash('success', 'Created a comment!');
                res.redirect('/blogs/' + blog._id);
              }
            });
        });
    });
});

/**
 *Update comment
 */
router.put("/:commentId", isUserLoggedIn, checkAuthorComment, function(req, res) {
    var updateComment = {
      $set: {
        text: req.body.comment.text
      }
    };
    Comments.findByIdAndUpdate(req.params.commentId, updateComment, function(err, updated){
      if(err){
            req.flash('error', err.message);
            res.redirect("/blogs/" + req.params.id);
      }else{
            req.flash('success', 'Comment updated');
            res.redirect("/blogs/" + req.params.id);
      }
    });
});
/**
 * Delete Comment by ID
 */
router.delete("/:commentId", isUserLoggedIn, checkAuthorComment, function(req, res) {
    var blogQuery = {
        $pull: {
            comments: req.comment.id
        }
    };

    Blog.findByIdAndUpdate(req.params.id, blogQuery, function(err) {
        if (err) {
            console.log(err)
            req.flash('error', err.message);
            return res.redirect('/');
        }

        req.comment.remove(function(err) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Comment deleted!');
            res.redirect("/blogs/" + req.params.id);
        });
    });
});

module.exports = router;
