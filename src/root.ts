import createError from "http-errors";
import dotenv from "dotenv"; //global env?
import express, { Request, Response, NextFunction } from "express";
// import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import index from "./routes/index.ts";
import initSearch from "./routes/initSearch.ts";
import checkStatus from "./routes/checkStatus.ts";
import fetchResults from "./routes/fetchResults.ts";
import myTest from "./routes/myTest.ts";
import onPropose from "./routes/onPropose.ts";
import vote from "./routes/vote.ts";
import queries from "./routes/queries.ts";
import updateDataset from "./routes/updateDataset.ts";
import { DatabaseController } from "./controllers/DatabaseController.ts";
import { iExecController } from "./controllers/iExecController.ts";

dotenv.config();

DatabaseController.getInstance();
iExecController.getInstance();

const app = express();
const port = 3000;

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));

app.use("/", index);
app.use("/initSearch", initSearch);
app.use("/checkStatus", checkStatus);
app.use("/fetchResults", fetchResults);
app.use("/test", myTest);
app.use("/onPropose", onPropose);
app.use("/vote", vote);
app.use("/queries", queries);
app.use("/updateDataset", updateDataset);

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
