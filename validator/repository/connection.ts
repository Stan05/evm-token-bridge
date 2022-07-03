import mongoose from "mongoose";

const databaseConnection = async () => {
  try {
    mongoose.connect("mongodb://0.0.0.0:27017", {});
    console.log("MongoDB Connected");
  } catch (error) {
    console.log("Error Connecting to MongoDB ============");
    console.log(error);
    process.exit(1);
  }
};

export default databaseConnection;
