import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "").trim();
  
      if (!token) {
        throw new ApiError(401, "Unauthorized request: Token missing");
      }
  
      // Verify the token
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
      if (!decodedToken?._id) {
        throw new ApiError(401, "Invalid token payload");
      }
  
      // Fetch user and exclude sensitive fields
      const user = await User.findById(decodedToken._id).select("-password -refreshToken");
  
      if (!user) {
        throw new ApiError(401, "Invalid access token: User not found");
      }
  
      // Attach user to request object
      req.user = user;
  
      next();
      
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid access token");
    }
  });