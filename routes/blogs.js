var express = require("express");
var router  = express.Router();
var Blog = require("../models/blogs");
var Comment = require("../models/comments");
var middleware = require("../middleware/index");
var filesMiddleware = require("../middleware/files");
var cloudinary = require("../models/cloudinary");
var { isUserLoggedIn, checkAuthorBlog, checkAuthorComment } = middleware;

/**
 * Blogs Listview (GetAll)
 */
router.get("/", function(req, res) {
    Blog.find({}, function(err, allBlogs) {
        if(err) {
            console.log(err);
        } else {
            if(req.xhr) {
                res.json(allBlogs);
            } else {
                res.render("main/blogs", {
                    blogs: allBlogs
                });
            }
        }
    });
});

/**
 * View for creating a new blog
 */
router.get("/new", isUserLoggedIn, function(req, res) {
   res.render("main/new");
});

/**
 * Get Blog by ID
 */
router.get("/:id", function(req, res) {
    Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog) {
        if (err || !foundBlog) {
            console.log(err);
            req.flash('error', 'Sorry, that Blog does not exist!');
            return res.redirect('/blogs');
        }

        res.render("main/blog", {
            blog: foundBlog
        });
    });
});

/**
 * POST Blog (create new)
 */
router.post("/", isUserLoggedIn, filesMiddleware.single('image'),function(req, res) {
    var defaultImgUrl = "https://oroinc.com/b2b-ecommerce/wp-content/uploads/sites/3/2018/04/cryptocurrency-b2b-ecommerce.png";
    var newBlog = {
        name: req.body.name,
        content: req.body.description,
        imageID: "none",
        imageURL: defaultImgUrl,
        author: {
            id: req.user._id,
            username: req.user.username
        }
    };

    Blog.create(newBlog, function(err, blogCreated) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('blogs/');
        } else {
            if (!req.file) {
              req.flash('success', 'Blog Created!');
              res.redirect("/blogs");
            } else {
              // upload image to cloudinary if the user selected an image file
              cloudinary.v2.uploader.upload(req.file.path, function(error, result) {
                  if (error) {
                      req.flash('error', "Your selected image could not be uploaded.");
                      console.error(error);
                      return res.redirect("/blogs");
                  }
                  blogCreated.imageID= result.public_id;
                  blogCreated.imageURL= result.url;
                  blogCreated.save(function(err){
                    if(err){
                      req.flash('error', "Your selected image could not be uploaded.");
                      console.error(error);
                      return res.redirect("/blogs");
                    }else{
                      req.flash('success', 'Blog Created!');
                      res.redirect("/blogs");
                    }
                  });
              });
            }
        }
    });
 });

 /**
  * Update Blog view
  */
 router.get("/:id/edit", isUserLoggedIn, checkAuthorBlog, function(req, res){
   Blog.findById(req.params.id, function(err, foundBlog) {
       if (err || !foundBlog) {
           console.log(err);
           req.flash('error', 'Sorry, that Blog does not exist!');
           return res.redirect('/blogs');
       }
       return res.render("main/blogEdit", {
           blog: foundBlog
       });
   });
 });

 /**
  * PUT blog by ID (updates the blog in the database)
  */
router.put("/:id", isUserLoggedIn, checkAuthorBlog, function(req, res){
    var updatedBlog = {
        $set: {
            name: req.body.blog.name,
            content: req.body.blog.content
        }
    };
    Blog.findByIdAndUpdate(req.params.id, updatedBlog, function(err, updated){
        if(err||!updated){
            console.log(err);
            req.flash('error', 'Sorry, that Blog does not exist!');
            return res.redirect('/blogs');
        }
        req.flash('success', 'Your blog has been updated!');
        return res.redirect("/blogs/" + req.params.id);
    });
});

/**
 * Delete Blog by ID (deletes the blog and all associated comments from the database)
 */
router.delete("/:id", isUserLoggedIn, checkAuthorBlog, function(req, res) {
    var commentsToDelete = {
        _id: {
            $in: req.blog.comments
        }
    };

    Comment.remove(commentsToDelete, function(err) {
        if (err) {
            req.flash('error', 'Comments could not be removed.');
            console.error(err);
            return res.redirect('/');
        }

        req.blog.remove(function(error) {
            if (error) {
                req.flash('error', 'Blog could not be removed.');
                console.error(error);
                return res.redirect('/');
            }

            req.flash('success', 'Blog successfully deleted.');
            res.redirect('/blogs');
        });
    });
});

module.exports = router;
