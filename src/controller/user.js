import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// const registerUser = asyncHandler(async (req, res) => {
// 	res.status(200).json({
// 		message: "ok",
// 	});
// });
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
export { registerUser };
