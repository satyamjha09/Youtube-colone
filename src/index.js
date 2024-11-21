import dotenv from 'dotenv';
dotenv.config();  // Ensure this is called at the top before accessing environment variables


import connectDB from './config/dbconnect.js';
import { app } from './app.js';

// Connect to the database
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("MONGO DB connection failed!!!", error);
  });
