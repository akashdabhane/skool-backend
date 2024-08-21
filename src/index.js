import dotenv from "dotenv"
import { connectDB } from "./database/connection.js"
import { app } from "./app.js";


dotenv.config({ path: "./.env" });


// mongodb connecction
connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log('error', error);
            throw error
        })

        app.listen(process.env.PORT || 8000, () => {
            console.log(`server is running of port ${process.env.PORT || 8000}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!!", err)
    })
    