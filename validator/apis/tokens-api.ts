import { Express, Request, Response } from "express";
import {
  SupportedTokenModel,
  SupportedToken,
} from "../repository/models/supported-token";
import SupportedTokenRepository from "../repository/models/supported-token-repository";

const supportedTokenRepository: SupportedTokenRepository =
  new SupportedTokenRepository();

export default async (app: Express) => {
  app.get("/tokens/:chainId", async (req: Request, res: Response, next) => {
    try {
      res.status(200);
      return res.json(
        await supportedTokenRepository.GetSupportedTokens(
          Number(req.params.chainId)
        )
      );
    } catch (err) {
      next(err);
    }
  });

  app.get(
    "/tokens/:chainId/:token",
    async (req: Request, res: Response, next) => {
      try {
        res.status(200);
        return res.json(
          await supportedTokenRepository.GetSupportedToken(
            Number(req.params.chainId),
            req.params.token
          )
        );
      } catch (err) {
        next(err);
      }
    }
  );

  app.post("/tokens", async (req: Request, res: Response, next) => {
    try {
      res.status(200);
      console.log(req.body());
      return res.json(
        await supportedTokenRepository.GetSupportedTokens(
          Number(req.params.chainId)
        )
      );
    } catch (err) {
      next(err);
    }
  });
};
