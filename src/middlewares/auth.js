import  jwt  from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";

export const verifyJwt = async (req, res, next) => {
	try {
		const token =
			req.cookies?.accessToken ||
			req.header("Authorization")?.replace("Bearer ", "");
		if (!token) throw new apiError(401, "Unauthorzed Request");
		const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		const user = await User.findById(decodedToken?._id).select(
			"-password -refreshToken"
		);
		if (!user) throw new apiError(401, "Invalid Acess Token");
		req.user = user;
		next();
	} catch (err) {
		throw new apiError(401, err);
	}
};
