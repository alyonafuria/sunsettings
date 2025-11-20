import { useMemo } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { WalletId } from "@txnlab/use-wallet";

export type UserWallet = {
  address: string | null;
  isConnected: boolean;
  connectPera: () => Promise<void>;
  connectDefly: () => Promise<void>;
  disconnect: () => Promise<void>;
};

export function useUserWallet(): UserWallet {
  const { activeAddress, wallets } = useWallet();

  const connect = async (id: WalletId) => {
    const w = wallets?.find((x) => x.id === id);
    if (!w) throw new Error(`Wallet provider not found: ${id}`);
    await w.connect();
  };

  const disconnect = async () => {
    if (!wallets) return;
    // disconnect all to keep state clean
    await Promise.all(
      wallets.map(async (w: any) => {
        try {
          await w.disconnect?.();
        } catch {}
      })
    );
  };

  return useMemo(
    () => ({
      address: activeAddress ?? null,
      isConnected: !!activeAddress,
      connectPera: () => connect(WalletId.PERA as WalletId),
      connectDefly: () => connect(WalletId.DEFLY as WalletId),
      disconnect,
    }),
    [activeAddress]
  );
}

