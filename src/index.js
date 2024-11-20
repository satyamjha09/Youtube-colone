import dotenv from 'dotenv'
import connectDB from './config/dbconnect.js';
import {app} from './app.js'



dotenv.config(); // This will automatically look for a file named '.env'



connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000 , () => {
            console.log(`Server is running at port: ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.error("MONGO DB connection failed !!!" , err);
    })