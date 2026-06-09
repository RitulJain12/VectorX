import express from "express"; 
import cors from 'cors' ;

const app = express();
require('dotenv').config();
const main =  require('./config/db')
const cookieParser =  require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');

const cors = require('cors')
const passport = require('./config/passport'); // Import passport config

const app = express(); 
app.use(passport.initialize());
app.use(cookieParser());
// CORS configuration - update origin to match your frontend
app.use(cors({
    origin: 'http://localhost:5173', // Your React app URL
    credentials: true 
}))
app.use(express.json()); 

// Routes
app.use('/user',authRouter);
app.get("/" , (req , res) => {
    res.send("workinggg.. ")
}); 
const InitalizeConnection = async ()=>{
    try{

        await Promise.all([main(),redisClient.connect()]);
        console.log("DB Connected");
        
        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })

    }
    catch(err){
        console.log("Error: "+err);
    }
}

InitalizeConnection();

