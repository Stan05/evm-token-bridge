import { useWeb3React } from "@web3-react/core";
import Head from "next/head";
import React from "react";
import Account from "../components/Account";
import Bridge from "../components/Bridge";
import FeeCalculator from "../components/FeeCalculator";
import NativeCurrencyBalance from "../components/NativeCurrencyBalance";
import TransactionHistory from "../components/transactions/TransactionHistory";
import useEagerConnect from "../hooks/useEagerConnect";

function Home() {
  const { account, library } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();
  const isConnected = typeof account === "string" && !!library;

  return (
    <div>
      <Head>
        <title>EVM Token Bridge</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <nav>
          <Account triedToEagerConnect={triedToEagerConnect} />
        </nav>
      </header>

      <main>
        <h1>
          Welcome to{" "}
          <a
            href="https://github.com/Stan05/evm-token-bridge"
            style={{ color: "blue" }}
          >
            EVM Token Bridge
          </a>
        </h1>

        {isConnected && (
          <section className="main-header">
            <NativeCurrencyBalance />
            <FeeCalculator />

            <Bridge></Bridge>
            <TransactionHistory></TransactionHistory>
          </section>
        )}
      </main>

      <style jsx>{`
        nav {
          display: flex;
          justify-content: space-between;
        }

        main {
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default Home;
