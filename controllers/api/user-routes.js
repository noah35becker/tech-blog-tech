
// IMPORTS
const router = require('express').Router();
const {isLoggedInApiAuth, isLoggedOutApiAuth} = require('../../utils/auth');
const {User, Post} = require('../../models');
require('dotenv').config();



// REQUESTS

// Get all users (FOR DEV PURPOSES ONLY)
router.get('/', async (req, res) => {
    if (req.body.admin_password === process.env.SEE_ALL_USERS_KEY)
        try{
            const dbUsersData = await User.findAll({
                attributes: {
                    exclude: ['password']
                },
                include: {
                    model: Post,
                    attributes: ['id', 'title', 'content', 'createdAt', 'updatedAt'],
                    as: 'posts'
                }
            });
            res.json(dbUsersData);
        }catch (err){
            console.log(err);
            res.status(500).json(err);
        }
    else
        res.status(403).json({message: 'Access forbidden'});
});


// Get one user
router.get('/:id', async (req, res) => {
    try{
        const dbUserData = await User.findByPk(req.params.id, {
            attributes: {
                exclude: ['password', 'email']
            },
            include: {
                model: Post,
                attributes: ['id', 'title', 'content', 'createdAt', 'updatedAt'],
                as: 'posts'
            }
        });
        
        if (!dbUserData)
            res.status(404).json({message: 'No user found with this ID'});
        else
            res.json(dbUserData);
    }catch (err){
        console.log(err);
        res.status(500).json(err);
    }
});


// Create new user + log them in
router.post('/', isLoggedOutApiAuth, async (req, res) => {
    try {
        const dbUserData = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        });

        req.session.save(() => {
            req.session.user_id = dbUserData.id;
            req.session.username = dbUserData.username;
            req.session.loggedIn = true;

            const jsonUserData = dbUserData.get({plain: true});
            delete jsonUserData.password;
            res.json({ // This must occur INSIDE req.session.save (due to synchronicity)
                message: 'New user successfully created + logged in',
                user: jsonUserData
            });
        });
    }catch (err){
        console.log(err);

        let errJson = JSON.parse(JSON.stringify(err));
        if (errJson.name === 'SequelizeUniqueConstraintError'){
            errJson.message = 'This username and/or email address are already taken';
            res.status(409).send(errJson);
        } else
            res.status(500).send(errJson);
    }
});


// Login
router.post('/login', isLoggedOutApiAuth, async (req, res) => {
    try{
        const dbUserData = await User.findOne({
            where: {
                email: req.body.email
            }
        });

        if (!dbUserData){
            res.status(404).json({message: 'No user found with this email address'});
            return;
        }

        const isPwCorrect = await dbUserData.checkPassword(req.body.password);
        if (!isPwCorrect){
            res.status(400).json({message: 'Incorrect password'});
            return;
        }
        
        req.session.save(() => {
            req.session.user_id = dbUserData.id;
            req.session.username = dbUserData.username;
            req.session.loggedIn = true;

            const jsonUserData = dbUserData.get({plain: true});
            delete jsonUserData.password;
            res.json({ // This must occur INSIDE req.session.save (due to synchronicity)
                message: 'Login successful',
                user: jsonUserData
            });
        });
    }catch (err){
        console.log(err);
        res.status(500).json(err);
    }
});


// Logout
router.post('/logout',
    isLoggedInApiAuth, // technically unnecessary: req.session.destroy() will work even if there's no session to destroy
    (req, res) => req.session.destroy(() => res.status(204).end())
);


// Update user's password
router.put('/update-password', isLoggedInApiAuth, async (req, res) => { // expects {old_password, new_password}
    try{
        const dbUserData = await User.findByPk(req.session.user_id);

        const isOldPwCorrect = await dbUserData.checkPassword(req.body.old_password);
        if (!isOldPwCorrect){
            res.status(400).json({message: 'Old password is incorrect'});
            return;
        }

        const updatedUserData = await dbUserData.update(
            {
                password: req.body.new_password
            },
            {
                individualHooks: true,
            }
        );

        const jsonUserData = updatedUserData.get({plain: true});
        delete jsonUserData.password;
        res.json({
            message: 'Password successfully updated',
            user: jsonUserData
        });
    }catch (err){
        console.log(err);
        res.status(500).json(err);
    }
});


// Update user's username
router.put('/update-username', isLoggedInApiAuth, async (req, res) => { // expects {username, password}
    try{
        const dbUserData = await User.findByPk(req.session.user_id);

        const isPwCorrect = await dbUserData.checkPassword(req.body.password);
        if (!isPwCorrect){
            res.status(400).json({message: 'Incorrect password'});
            return;
        }

        const updatedUserData = await dbUserData.update(
            {
                username: req.body.username,
                password: req.body.password
            },
            {
                individualHooks: true,
            }
        );

        const jsonUserData = updatedUserData.get({plain: true});
        delete jsonUserData.password;
        res.json({
            message: 'Username successfully updated',
            user: jsonUserData
        });
    }catch (err){
        console.log(err);

        let errJson = JSON.parse(JSON.stringify(err));
        if (errJson.name === 'SequelizeUniqueConstraintError'){
            errJson.message = 'This username is already taken';
            res.status(409).send(errJson);
        } else
            res.status(500).send(errJson);  
    }
});


// Update user's email
router.put('/update-email', isLoggedInApiAuth, async (req, res) => { // expects {email, password}
    try{
        const dbUserData = await User.findByPk(req.session.user_id);

        const isPwCorrect = await dbUserData.checkPassword(req.body.password);
        if (!isPwCorrect){
            res.status(400).json({message: 'Incorrect password'});
            return;
        }

        const updatedUserData = await dbUserData.update(
            {
                email: req.body.email,
                password: req.body.password
            },
            {
                individualHooks: true
            }
        );

        const jsonUserData = updatedUserData.get({plain: true});
        delete jsonUserData.password;
        res.json({
            message: 'Email successfully updated',
            user: jsonUserData
        });
    }catch (err){
        console.log(err);

        let errJson = JSON.parse(JSON.stringify(err));
        if (errJson.name === 'SequelizeUniqueConstraintError'){
            errJson.message = 'This username is already taken';
            res.status(409).send(errJson);
        } else
            res.status(500).send(errJson);  
    }
});


// Delete user
router.delete('/', isLoggedInApiAuth, async (req, res) => { // expects {password}
    try{
        const dbUserData = await User.findByPk(req.session.user_id);

        const isPwCorrect = await dbUserData.checkPassword(req.body.password);
        if (!isPwCorrect){
            res.status(400).json({message: 'Incorrect password'});
            return;
        }
        
        await dbUserData.destroy();
            
        req.session.destroy(() => res.json({message: 'Deleted and logged out'}));
    }catch (err){
        console.log(err);
        res.status(500).json(err);
    };
});



// EXPORT
module.exports = router;