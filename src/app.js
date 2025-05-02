import express from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";

const app = express();
//router imports
import healthCheckRouter from "./routes/healthcheck.routes.js"
import authRouter from "./routes/auth.routes.js"
import projectRouter from './routes/project.routes.js'
import noteRouter from './routes/note.routes.js'
import taskRouter from './routes/task.routes.js'
import multer from "multer";
const multerFormDataHandler = multer()

app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(cookieParser());

// app.use("/api/v1/healthcheck", healthCheckRouter)
app.use("/api/v1/auth", multerFormDataHandler.none(), authRouter);
app.use("/api/v1/project", multerFormDataHandler.none(), projectRouter);
app.use("/api/v1/notes", multerFormDataHandler.none(), noteRouter);
app.use("/api/v1/tasks", multerFormDataHandler.none(), taskRouter);



export default app;
