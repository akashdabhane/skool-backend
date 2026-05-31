import dotenv from "dotenv"
import http from "http";
import { connectDB } from "./database/connection.js"
import { app } from "./app.js";
import { setupSocket } from "./socket.js";


dotenv.config({ path: "./.env" });


// mongodb connecction
connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log('error', error);
            throw error
        })

        const httpServer = http.createServer(app);
        setupSocket(httpServer);

        httpServer.listen(process.env.PORT || 8000, () => {
            console.log(`server is running of port ${process.env.PORT || 8000}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!!", err)
    })
    