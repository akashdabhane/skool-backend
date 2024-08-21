import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // mongodb connection string 
        const con = await mongoose.connect(`${process.env.MONGODB_URL}${process.env.DB_NAME}`);

        console.log(`MongoDB connected: ${con.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export { connectDB }
