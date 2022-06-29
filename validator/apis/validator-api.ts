import { Express, Request, Response } from "express";
import { TransactionType } from "../repository/models/transaction";
import TransactionRepository from "../repository/transaction-repository";

const transactionRepository: TransactionRepository =
  new TransactionRepository();

export default async (app: Express) => {
  app.get(
    "/validator/lock/:sourceChainId/:targetChainId/:txHash/",
    async (req: Request, res: Response, next) => {
      try {
        res.status(200);
        return res.json(
          await transactionRepository.GetTransaction(
            req.params.txHash,
            TransactionType.LOCK,
            Number(req.params.sourceChainId),
            Number(req.params.targetChainId)
          )
        );
      } catch (err) {
        next(err);
      }
    }
  );

  app.get(
    "/validator/burn/:sourceChainId/:targetChainId/:txHash",
    async (req: Request, res: Response, next) => {
      try {
        res.status(200);
        return res.json(
          await transactionRepository.GetTransaction(
            req.params.txHash,
            TransactionType.BURN,
            Number(req.params.sourceChainId),
            Number(req.params.targetChainId)
          )
        );
      } catch (err) {
        next(err);
      }
    }
  );
};
