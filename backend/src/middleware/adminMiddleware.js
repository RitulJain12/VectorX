const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis")

const adminMiddleware = async (req,res,next)=>{

    try{
    //    console.log("Hello admin");
        const {token} = req.cookies;
        if(!token)
            throw new Error("Token is not persent");
        console.log("Hello admin");
        const payload = jwt.verify(token,process.env.JWT_KEY);

        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if(payload.role!='admin')
            throw new Error("Invalid Token");

        if(!result){
            throw new Error("User Doesn't Exist");
        }

        // Redis ke blockList mein persent toh nahi hai

        const IsBlocked = await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            throw new Error("Invalid Token");

        req.result = result;

        console.log("Bye Admin");
        next();
    }
    catch(err){
        res.status(401).send("Error: "+ err.message)
    }

}


module.exports = adminMiddleware;
