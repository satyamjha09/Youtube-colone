import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {

    try {

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken , refreshToken }


    } catch(error) {
        console.error(error);
        throw new ApiError(500, "Somthing went wrong while generateing refresh and asscess token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // first take creditianls from req.body

    const {fullName , username , email , password  }  = req.body;

    if(
        [fullName, email, username, password].some((field) => !field?.trim())
    ) {
        throw new ApiError(400 , "All fields are required")
    }

    const existedUser = await User.findOne({ 
        $or: [ { username } , { email } ]
    })

    if(existedUser) {
        throw new ApiError(409, "User already Exits")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    const coverImagePath = req.files?.coverImage[0]?.path;

    console.log("Avatar Path:", avatarLocalPath);
    console.log("Cover Image Path:", coverImagePath);

    console.log(avatarLocalPath)

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    if(!coverImagePath) {
        throw new ApiError(400, "cover image file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

    if(!avatar) {
        throw new ApiError(400, "Avatar image file is required")
    }

    if(!coverImage) {
        throw new ApiError(400, "cover image file is required")
    } 

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created")
    )

   
})

const loginUser = asyncHandler(async (req, res) => {

    const {email, username, password} = req.body;
    

    if(!(username || email)) {
        throw new ApiError(400, "username or password is required")

    }

    const user = await User.findOne({
        $or: [{username} , {email}]
    })

    if(!user) {
        throw new ApiError(400, "user does not access");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)


    if(!isPasswordValid) {
        throw new ApiError(400, "password is in correct")
    }

    const { accessToken , refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Secure only in production
        sameSite: "strict", // CSRF protection
    }

    return res
    .status(200) // Use 200 for success
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      success: true,
      message: "User logged in successfully",
      data: {
        user: loggedInUser,
        accessToken,
        refreshToken,
      },
    });
    
    

})

const logoutUser = asyncHandler(async (req, res) => {

    User.findByIdAndUpdate(
       req.user._id,
       {
         $set: {
            refreshToken: undefined
         }
       },
       {
          new: true
       }
        
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
            .status(201)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {} ,"User logged Out"))



     
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
  
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }
  
    try {
      // Verify the incoming refresh token
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
  
      // Find the user by ID
      const user = await User.findById(decodedToken?._id);
  
      if (!user) {
        throw new ApiError(401, "Invalid refresh token");
      }
  
      // Check if the refresh token matches the one in the database
      if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or invalid");
      }
  
      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefreshToken(user._id);
  
      // Update the user's refresh token in the database
      user.refreshToken = newRefreshToken;
      await user.save();
  
      // Cookie options
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // Optional: for CSRF protection
      };
  
      // Set new tokens in cookies and respond
      return res
        .status(200) // Use 200 for OK
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json({
          success: true,
          message: "Access token refreshed",
          data: { accessToken, refreshToken: newRefreshToken },
        });
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});
  

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
