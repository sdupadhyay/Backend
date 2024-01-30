import dotenv from "dotenv";
dotenv.config({path:"./.env"});
import { app } from "./app.js";
import connectDB from "./db/index.js";
const port = process.env.PORT || 8000;
connectDB()
	.then(() => {
		app.listen(port, () => {
			console.log(`Surver is running at port No ${port}`);
		});
	})
	.catch((err) => console.log("Mongo DB Connection Failed", err));
