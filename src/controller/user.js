import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
// const registerUser = asyncHandler(async (req, res) => {
// 	res.status(200).json({
// 		message: "ok",
// 	});
// });
const generateAccesAndRefreshTokens = async (userId) => {
	try {
		const user = await User.findById(userId);
		const accessToken = user.generateAccessToken();
		const refreshToken = user.generateRefreshToken();
		user.refreshToken = refreshToken;
		await user.save({ validationBeforeSave: false });
		return { refreshToken, accessToken };
	} catch {
		throw new apiError(500, "Somthing went wrong");
	}
};
const registerUser = async (req, res) => {
	const { fullName, email, userName, password } = req.body;
	//res.status(200).json({ message: "Sucess" });
	if (
		[fullName, email, userName, password].some((field) => field?.trim() === "")
	) {
		throw new apiError(400, "All Field are Required");
	}
	const existedUser = await User.findOne({ $or: [{ userName }, { email }] });
	if (existedUser) throw new apiError(409, "Email or User name already exist");
	const avatarLocalPath = req.files?.avatar[0]?.path;
	let coverImageLocalPath;
	if (
		req.file &&
		Array.isArray(req.file.coverImage) &&
		req.file.coverImage[0].length > 0
	)
		coverImage = req.files?.coverImage[0]?.path;
	if (!avatarLocalPath) throw new apiError(400, "Avatar file is required");
	const avatar = await uploadOnCloudinary(avatarLocalPath);
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);
	if (!avatar) throw new apiError(400, "Avatar file is required");
	const user = await User.create({
		fullName,
		avatar: avatar?.url,
		coverImage: coverImage?.url || "",
		email,
		password,
		userName: userName?.toLowerCase(),
	});
	const createdUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);
	if (!createdUser)
		throw new apiError(500, "Something went wrong while registering user");
	return res
		.status(201)
		.json(new apiResponse(201, createdUser, "User Registered Sucessfully"));
};
const loginUser = async (req, res) => {
	const { email, userName, password } = req.body;
	if (!(userName || email))
		throw new apiError(400, "Username or email is required");
	const user = await User.findOne({ $or: [{ userName }, { email }] });
	if (!user) throw new apiError(400, "User Does not Exist");
	const isPasswordValid = await user.isPasswordCorrect(password);
	if (!isPasswordValid) throw new apiError(401, "Invalid Password");
	const { accessToken, refreshToken } = await generateAccesAndRefreshTokens(
		user._id
	);
	const loginUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);
	const options = {
		httpOnly: true,
		secure: true,
	};
	return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(
			new apiResponse(
				200,
				{ user: loginUser, accessToken, refreshToken },
				"User Logined Sucessfully"
			)
		);
};
const logoutUser = async (req, res) => {
	await User.findByIdAndUpdate(
		req.user._id,
		{ $set: { refreshToken: undefined } },
		{ new: true }
	);
	const options = {
		httpOnly: true,
		secure: true,
	};
	return res
		.status(200)
		.clearCookie("accessToken", options)
		.clearCookie("refreshToken", options)
		.json(new apiResponse(200, {}, "User Logout sucessfully"));
};
const refreshAccessToken = async (req, res) => {
	try {
		const incomingRefreshToken =
			req.cookies.refreshToken || req.body.refreshToken;
		if (!incomingRefreshToken) throw new apiError(401, "Unauthorised Request");
		const decodedToken = jwt.verify(
			incomingRefreshToken,
			process.env.REFRESH_TOKEN_SECRET
		);
		const user = await User.findById(decodedToken?._id);
		if (!user) throw new apiError(401, "Invalid Refresh Token");
		if (incomingRefreshToken !== user.refreshToken)
			throw new apiError(401, "Refresh Token is experied");
		const options = {
			httpOnly: true,
			secure: true,
		};
		const { refreshToken, accessToken } = await generateAccesAndRefreshTokens(
			user._id
		);
		return res
			.status(200)
			.clearCookie("accessToken", accessToken, options)
			.clearCookie("refreshToken", refreshToken, options)
			.json(
				new apiResponse(
					200,
					{ accessToken, refreshToken },
					"Access Token refresh"
				)
			);
	} catch (error) {
		throw new apiError(400, error?.message || "Invalid refresh token");
	}
};
export { registerUser, loginUser, logoutUser,refreshAccessToken };
