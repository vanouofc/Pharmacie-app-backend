import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DB = process.env.DB_URL;


async function connect () {
    console.log("Nous cherchons la BD");
    await mongoose.connect(DB);
    console.log("OK");
};

export default connect;