// routes/userAuth.js
const express = require('express');
const passport = require('passport');
const authRouter = express.Router();
const {register, login, logout, adminRegister, deleteProfile,forgotpass,ResetPassword} = require('../controllers/userAuthent');
const { handleOAuthSuccess } = require('../controllers/oauthController');
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');

// Regular auth routes
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware, adminRegister);
authRouter.delete('/deleteProfile', userMiddleware, deleteProfile);
authRouter.post('/forgot-pass', forgotpass);
authRouter.post('/forgotpassword',ResetPassword);
// Google OAuth routes
authRouter.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })
);

authRouter.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
        session: false 
    }),
    handleOAuthSuccess
);
// GitHub OAuth routes
authRouter.get('/github',
    passport.authenticate('github', {
        scope: ['user:email'], // Request email scope
        session: false
    })
);

authRouter.get('/github/callback',
    passport.authenticate('github', {
        failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
        session: false
    }),
    handleOAuthSuccess
);

// Check auth status
authRouter.get('/check', userMiddleware, (req, res) => {
    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id: req.result._id,
        role: req.result.role,
        authMethod: req.result.authMethod
    }

    res.status(200).json({
        user: reply,
        message: "Valid User"
    });
});

module.exports = authRouter;