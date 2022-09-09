
// IMPORTS
const router = require('express').Router();
const {isLoggedOut} = require('../utils/auth');
const {Post, User} = require('../models');
const {purgeUpdatedAtProperty} = require('../utils/general-helpers');



// ROUTES

// Home page
router.get('/', async (req, res) => {
    let dbPostsData = await Post.findAll({
        attributes: ['id', 'title', 'content', 'createdAt', 'updatedAt'],
        include: {
            model: User,
            attributes: ['id', 'username']
        },
        order: [['updatedAt', 'DESC']]
    });

    dbPostsData = dbPostsData.map(post => {
        let output = post.get({plain: true});
        output.postedByCurrentUser = req.session.user_id === output.user.id;
        return output;
    });
    purgeUpdatedAtProperty(dbPostsData);

    res.render('homepage', {
        posts: dbPostsData,
        loggedIn: req.session.loggedIn,
    });
});


// Login page
router.get('/login', isLoggedOut, (req, res) =>
    res.render('login', {loggedIn: false})
);



// EXPORT
module.exports = router;