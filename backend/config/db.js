import mongoose from "mongoose"

const connectDb = async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connect Database");
    } catch (error) {
        console.error("Database connection failed");
    }
}

export default connectDb;
