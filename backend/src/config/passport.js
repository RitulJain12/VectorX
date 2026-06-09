// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/user');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/user/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google profile:', profile);
        
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            return done(null, user);
        }

        // Check if user exists with the same email
        user = await User.findOne({ emailId: profile.emails[0].value.toLowerCase() });
        
        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.authMethod = 'google';
            user.isVerified = true;
            await user.save();
            return done(null, user);
        }

        // Create new user
        const newUser = new User({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName || '',
            emailId: profile.emails[0].value.toLowerCase(),
            authMethod: 'google',
            isVerified: true
            // No password field for OAuth users
        });

        await newUser.save();
        return done(null, newUser);
    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
}));

// passport.use(new GitHubStrategy({
//     clientID: process.env.GITHUB_CLIENT_ID,
//     clientSecret: process.env.GITHUB_CLIENT_SECRET,
//     callbackURL: "/user/github/callback"
// }, async (accessToken, refreshToken, profile, done) => {
//     try {
//         console.log('GitHub profile:', profile);
        
//         // Check if user already exists with this GitHub ID
//         let user = await User.findOne({ githubId: profile.id });
        
//         if (user) {
//             return done(null, user);
//         }

//         // GitHub doesn't always provide email, so we need to handle that
//         let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
//         if (!email) {
//             // If no email from GitHub, create a placeholder
//             email = `${profile.username}@github.user`;
//         }

//         // Check if user exists with the same email (if we got one from GitHub)
//         if (email && !email.endsWith('@github.user')) {
//             user = await User.findOne({ emailId: email.toLowerCase() });
            
//             if (user) {
//                 // Link GitHub account to existing user
//                 user.githubId = profile.id;
//                 user.authMethod = 'github';
//                 user.isVerified = true;
//                 await user.save();
//                 return done(null, user);
//             }
//         }

//         // Create new user
//         const newUser = new User({
//             githubId: profile.id,
//             firstName: profile.displayName || profile.username,
//             lastName: '   ',
//             emailId: email.toLowerCase(),
//             authMethod: 'github',
//             isVerified: true
//             // No password field for OAuth users
//         });

//         await newUser.save();
//         return done(null, newUser);
//     } catch (error) {
//         console.error('GitHub OAuth error:', error);
//         return done(error, null);
//     }
// }));

module.exports = passport;