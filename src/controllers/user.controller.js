import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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


export { 
    registerUser,
}
