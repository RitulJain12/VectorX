// controllers/oauthController.js
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { 
            _id: user._id,
            email: user.emailId,
            role: user.role 
        },
        process.env.JWT_KEY,
        { expiresIn: '7d' }
    );
};

const handleOAuthSuccess = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
        }

        const token = generateToken(req.user);
        
        // Set token in cookie (same as your existing auth)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Redirect to frontend with success
        res.redirect(`${process.env.CLIENT_URL}/oauth-success`);
    } catch (error) {
        console.error('OAuth success error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
};

module.exports = {
    handleOAuthSuccess
};