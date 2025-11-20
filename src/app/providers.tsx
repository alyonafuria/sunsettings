"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider } from "@txnlab/use-wallet-react";
import { WalletManager, WalletId, NetworkConfigBuilder, NetworkId } from "@txnlab/use-wallet";
import * as React from "react";

const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  const manager = React.useMemo(() => {
    const ALGOD_BASE_SERVER = process.env.NEXT_PUBLIC_ALGOD_SERVER || "https://testnet-api.algonode.cloud";
    const ALGOD_PORT = process.env.NEXT_PUBLIC_ALGOD_PORT || "443";
    const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
    const networks = new NetworkConfigBuilder()
      .testnet({
        algod: {
          baseServer: ALGOD_BASE_SERVER,
          port: ALGOD_PORT,
          token: ALGOD_TOKEN,
        },
      })
      .build();
    return new WalletManager({
      wallets: [
        WalletId.PERA,
        WalletId.DEFLY,
      ],
      networks,
      defaultNetwork: NetworkId.TESTNET,
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider manager={manager}>{props.children}</WalletProvider>
    </QueryClientProvider>
  );
}

