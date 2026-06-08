const redisClient = require("../config/redis");
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission")
let nodemailer = require('nodemailer');



const register = async (req, res) => {
    try {
        let { firstName, lastName, emailId, age, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ emailId: emailId.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                message: "Duplicate Not Allowed",
                error: "User with this email already exists" 
            });
        }
        password=await bcrypt.hash(password, 10);
        const user = new User({
            firstName,
            lastName,
            emailId: emailId.toLowerCase(),
            age,
            password,
            authMethod: 'local'
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { 
                _id: user._id,
                email: user.emailId,
                role: user.role 
            },
            process.env.JWT_KEY,
            { expiresIn: '7d' }
        );

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
            authMethod: user.authMethod
        };

        res.status(201).json({
            user: reply,
            message: "User registered successfully"
        });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ 
            message: "Something went wrong",
            error: err.message 
        });
    }
};
const login = async (req, res) => {
    try {
        let { emailId, password } = req.body;
        
        const user = await User.findOne({ emailId: emailId.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ 
                message: "Invalid Credential",
                error: "Invalid email or password" 
            });
        }

        // Check if user uses OAuth (no password)
        if (user.authMethod === 'google') {
            return res.status(401).json({ 
                message: "Invalid Credential",
                error: "Please login with Google" 
            });
        }
        
        // ✅ CORRECT: Use bcrypt.compare to check plain text password against hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: "Invalid Credential",
                error: "Invalid email or password" 
            });
        }

        // Generate token
        const token = jwt.sign(
            { 
                _id: user._id,
                email: user.emailId,
                role: user.role 
            },
            process.env.JWT_KEY,
            { expiresIn: '7d' }
        );

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
            authMethod: user.authMethod
        };

        res.status(200).json({
            user: reply,
            message: "Login successful"
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ 
            message: "Something went wrong",
            error: err.message 
        });
    }
};
const forgotpass = async (req, res) => {
    try {
        const { emailId } = req.body;
        const user = await User.findOne({ emailId: emailId.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ 
                message: "User not Found",
                error: "No user found with this email"
            });
        }

        // Generate token
        const token = jwt.sign(
            { 
                _id: user._id,
                email: user.emailId,
                role: user.role 
            },
            process.env.JWT_KEY,
            { expiresIn: '1d' }
        );

        // URL encode the token to handle dots safely
        const encodedToken = encodeURIComponent(token);

        // Define transporter INSIDE the function
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'aryaha0577@gmail.com',
                pass: process.env.EMAIL_PASS // Use your app password here
            }
        });

        let mailOptions = {
            from: process.env.EMAIL_USER || 'aryaha0577@gmail.com',
            to: emailId,
            subject: 'Reset Your Password - CodeAce.ai',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                    <p style="color: #666;">You requested to reset your password for CodeAce.ai. Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5173/forgotpassword/${user._id}/${encodedToken}" 
                           style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Reset Your Password
                        </a>
                    </div>
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This link will expire in 24 hours. If you didn't request this reset, please ignore this email.
                    </p>
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Or copy this link: http://localhost:5173/forgotpassword/${user._id}/${encodedToken}
                    </p>
                </div>
            `
        };

        // Send email
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log("Email error:", error);
                return res.status(500).json({
                    message: "Failed to send email",
                    error: error.message
                });
            } else {
                console.log("Email sent:", info.response);
                return res.status(200).json({
                    message: "Password reset email sent successfully",
                    error: ""
                });
            }
        });

    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ 
            message: "Something went wrong",
            error: err.message 
        });
    }
};
const ResetPassword = async (req, res) => {
    try {
        const { password, token, id } = req.body;
        // console.log(token);
        // Verify the token first
        jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ 
                    message: "Invalid or expired token",
                    error: "Token verification failed"
                });
            }
            
            try {
                // Hash the new password
                const hash = await bcrypt.hash(password, 10);
                // Update user password
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: id }, 
                    { password: hash }
                );
                console.log(updatedUser);
                
                if (!updatedUser) {
                    return res.status(404).json({
                        message: "User not found",
                        error: "No user with this ID exists"
                    });
                }
                const Yes=await User.findOne({password:hash});
                console.log(Yes.password==hash);
                res.status(200).json({ 
                    message: "Password changed successfully",
                    error: ""
                });
                console.log(hash);
            } catch (updateError) {
                console.error("Update error:", updateError);
                res.status(500).json({ 
                    message: "Failed to update password",
                    error: updateError.message
                });
            }
        });
        
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ 
            message: "Something went wrong",
            error: err.message 
        });
    }
}
const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....

    res.cookie("token",null,{expires: new Date(Date.now())});
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}
const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send(err);
    }
}
const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}
module.exports = {register, login,logout,adminRegister,deleteProfile,forgotpass,ResetPassword};