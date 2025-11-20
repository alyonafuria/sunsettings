"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import AccountInfo from "@/components/account/AccountInfo";
import Gallery from "@/components/account/Gallery";
import ConnectWallet from "@/components/account/ConnectWallet";
import { useUserWallet } from "@/lib/useUserWallet";

export default function AccountPage() {
  const { address, isConnected, disconnect } = useUserWallet();
  const [connectStatus, setConnectStatus] = React.useState<
    "idle" | "pending" | "error"
  >("idle");
  const [connectError, setConnectError] = React.useState<Error | null>(null);
  const [openConnect, setOpenConnect] = React.useState(false);
  // const { disconnect } = useDisconnect(); // not used on this page

  type WalletItem = { image: string; time?: number };
  const [items, setItems] = React.useState<WalletItem[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);

  const refetch = React.useCallback(async () => {
    if (!isConnected || !address) {
      setItems([]);
      return;
    }
    setLoadingItems(true);
    try {
      const params = new URLSearchParams({ address });
      const res = await fetch(`/api/wallet-nfts?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      const arr: unknown = data?.items;
      type UnknownItem = { image?: unknown; time?: unknown };
      const itemsParsed: WalletItem[] = Array.isArray(arr)
        ? (arr as unknown[])
            .map((v) =>
              typeof v === "object" && v !== null ? (v as UnknownItem) : null
            )
            .filter((v): v is UnknownItem => !!v && typeof v.image === "string")
            .map((v) => ({
              image: String(v.image),
              time: typeof v.time === "number" ? v.time : undefined,
            }))
        : [];
      setItems(itemsParsed);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [isConnected, address]);

  React.useEffect(() => {
    refetch();
    const onVis: EventListener = () => {
      if (document.visibilityState === "visible") refetch();
    };
    const onMinted: EventListener = () => refetch();
    const onPhotoUploaded: EventListener = () =>
      setTimeout(() => refetch(), 1500);
    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", onVis);
      window.addEventListener("sunsettings:nftMinted", onMinted);
      window.addEventListener("sunsettings:photoUploaded", onPhotoUploaded);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("sunsettings:nftMinted", onMinted);
        window.removeEventListener(
          "sunsettings:photoUploaded",
          onPhotoUploaded
        );
      }
    };
  }, [refetch]);

  const connectPeraWallet = async () => {
    setConnectError(null);
    setConnectStatus("idle");
    setOpenConnect(true);
  };

  return (
    <div className="w-full h-full overflow-auto flex flex-col">
      {/* Top section: content-sized for mobile to avoid overlap */}
      <div className="shrink-0">
        <AccountInfo
          loading={loadingItems}
          avatarUrl={null}
          wallet={address ?? null}
          isConnected={isConnected}
          onLogout={() => disconnect()}
          title={"sunset catcher"}
          postTimes={items
            .map((it) => (typeof it.time === "number" ? it.time : undefined))
            .filter((n): n is number => typeof n === "number")}
        />
        {/* Removed Refresh link per request */}
      </div>

      {/* Bottom gallery or connect CTA */}
      <div className="flex-1 min_h-0">
        {isConnected ? (
          <Gallery loading={loadingItems} items={items.map((it) => it.image)} />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-center">
            <div>
              <Button
                type="button"
                size="sm"
                onClick={connectPeraWallet}
                disabled={connectStatus === "pending"}
              >
                {connectStatus === "pending"
                  ? "Connecting…"
                  : "Sign up / Log in"}
              </Button>
              <div className="mt-2 text_sm">to start catching sunsets</div>
              {connectError ? (
                <div className="mt-2 text-xs text-red-600">
                  {String(connectError.message || "Connection failed")}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <ConnectWallet openModal={openConnect} closeModal={() => setOpenConnect(false)} />
    </div>
  );
}

