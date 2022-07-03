import { Express, Request, Response } from "express";
import SupportedTokenService from "../service/supported-token-service";

const supportedTokenRepository: SupportedTokenService =
  new SupportedTokenService();

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
      return res
        .json(
          await supportedTokenRepository.CreateSupportedToken(
            Number(req.body.chainId),
            req.body.token
          )
        )
        .status(200);
    } catch (err) {
      next(err);
    }
  });
};
