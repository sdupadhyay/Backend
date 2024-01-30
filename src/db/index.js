// import dotenv from "dotenv";
// dotenv.config();
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async () => {
	try {
		await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
		console.log("Mongo db connected");
	} catch (err) {
		console.log("Mongo DB ERROR:", err);
	}
};
export default connectDB;
