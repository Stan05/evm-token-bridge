import express from "express";
import cors from "cors";
import validatorApi from "./apis/validator-api";
import tokensApi from "./apis/tokens-api";
import runValidator from "./listener";
import databaseConnection from "./repository/connection";

// Constants
const PORT = 8080;
const HOST = "0.0.0.0";

const StartServer = async () => {
  const app = express();
  app.use(cors());

  await validatorApi(app);
  await tokensApi(app);

  await databaseConnection();
  app
    .listen(PORT, HOST, async () => {
      await runValidator();
      console.log(`listening to port ${HOST}:${PORT}`);
    })
    .on("error", (err) => {
      console.log(err);
    });
};

StartServer();
