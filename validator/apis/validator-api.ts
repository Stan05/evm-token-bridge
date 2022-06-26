import { Express, Request, Response } from "express";
import ValidatorRepository from "../repository/validator-repository";
const validatorRepository: ValidatorRepository = new ValidatorRepository();
export default async (app: Express) => {
  app.get(
    "/validator/lock/:txHash",
    async (req: Request, res: Response, next) => {
      try {
        res.status(200);
        return res.json(
          await validatorRepository.GetLockTransaction(req.params.txHash)
        );
      } catch (err) {
        next(err);
      }
    }
  );
};
