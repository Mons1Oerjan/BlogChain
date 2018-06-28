/**
 * Web-application routes are defined here.
 */
module.exports = function(app) {

    /**
     * Create a new user.
     * Source: https://loopback.io/doc/en/lb3/Logging-in-users.html
     */
    app.post('/login', function(req, res) {
        var credentials = {
            email: req.body.email,
            password: req.body.password
        };
        User.login(credentials, 'user', function(err, token) {
            if (err) {
                // TODO: render view named 'login_error.ejs'
                res.render('login_error', {
                    title: 'Login failed',
                    content: err,
                    redirectTo: '/',
                    redirectToLinkText: 'Try again'
                });
                return;
            }

            // TODO: login user and render the dashboard view
            res.render('dashboard', {
                email: req.body.email,
                accessToken: token.id
            });
        });
    });

    /**
     * Render the Login page
     */
    app.get('/login', function(req, res) {
        res.render('login');
    });

    /**
     * redirect the empty route to the Login page
     */
    app.get('', function (req, res) {
        res.redirect('/login');
    });
};
