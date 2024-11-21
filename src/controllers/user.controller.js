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


const changeCurrentPassword = asyncHandler(async (req, res) => {

   const { oldPassword , newPassword} = req.body

   const user =   await User.findById(req.user?._id)

   const isPasswordCorrect =   await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
   }

   user.password = newPassword; 
   await user.save({ validateBeforeSave: false });



   return res
    .status(200)
    .json(new ApiResponse(200, {} , "Password change successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {

  const user = req.user;

  if(!user) {
    new ApiError(400 , "there is no user")
  }

  return res.status(200).json(200, user, "Current user fetched successfully");

})

const updateAccountDetails = asyncHandler(async(req, res) => {

   const {fullName , email , } = req.body

   if(!fullName || !email) {
    throw new ApiError(400 , "All fields are required")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email
        }
      },
      {new: true}
    ).select("-password")

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"))



})

const updateUserAvatar = asyncHandler(async(req, res) => {

  const avatarLocalPath =  req.file?.path

  if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url)  {
    throw new ApiError(400, "Error while uploading on avatar")
  }

   const user =  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res.status(200).json(new ApiResponse(200, user, "avatar Image updated successfully"))





})

const updateUserCoverImage = asyncHandler(async(req, res) => {


  const UserCoverImage = req.file?.path

  if(!UserCoverImage.url) {
    throw new ApiError(400, "coverImage is missing")
  }

  const coverImage = await uploadOnCloudinary(UserCoverImage)


  const user =  await User.findById(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      {new: true}
  ).select("-password")

  return res.status(200).json(new ApiResponse(200, user, "Cover Image updated successfully"))


})  


const getUserChannelProfile = asyncHandler(async (req, res) => {

  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(), // Ensure consistent case handling
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers", // Corrected colon placement
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberTo", // Corrected colon placement
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscriberTo",
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      }
    }
  ]);

  console.log(channel)

  if (!channel.length) {
    throw new ApiError(404, "Channel not found");
  }

   return res.status(200).json(new ApiResponse(200, channel[0], "User Channel Fetched successfully"))
});




export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
}
