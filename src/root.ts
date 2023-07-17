import dotenv from "dotenv"; //global env?
dotenv.config();
import createError from "http-errors";
import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import iexec from "./routes/iexec.ts";
import queries from "./routes/queries.ts";
import smartContract from "./routes/smartContract.ts";
import userSession from "./routes/session.ts";

const app = express();
const port = 3000;

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/", async (_: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ status: "ok" });
  next();
});

app.use("/", userSession);
app.use("/", iexec);
app.use("/", smartContract);
app.use("/queries", queries);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
