import { Express, Request, Response } from "express";
import { TransactionType } from "../repository/models/transaction";
import TransactionService from "../service/transaction-service";

const transactionService: TransactionService = new TransactionService();

export default async (app: Express) => {
  app.get(
    "/transactions/:account",
    async (req: Request, res: Response, next) => {
      try {
        return res
          .json(await transactionService.GetTransactions(req.params.account))
          .status(200);
      } catch (err) {
        next(err);
      }
    }
  );

  // TODO: Ideally we should have authorization to prevent other users to mark random tx as claimed
  app.post(
    "/transactions/lock/claim",
    async (req: Request, res: Response, next) => {
      try {
        return res
          .json(
            await transactionService.ClaimTransaction(
              Number(req.body.sourceChainId),
              Number(req.body.targetChainId),
              req.body.bridgeTxHash,
              req.body.claimTxHash,
              TransactionType.LOCK
            )
          )
          .status(200);
      } catch (err) {
        next(err);
      }
    }
  );
  app.post(
    "/transactions/burn/claim",
    async (req: Request, res: Response, next) => {
      try {
        return res
          .json(
            await transactionService.ClaimTransaction(
              Number(req.body.sourceChainId),
              Number(req.body.targetChainId),
              req.body.bridgeTxHash,
              req.body.claimTxHash,
              TransactionType.BURN
            )
          )
          .status(200);
      } catch (err) {
        next(err);
      }
    }
  );
};
