"use client";

import * as React from "react";
import { useWallet, Wallet, WalletId } from "@txnlab/use-wallet-react";

interface ConnectWalletProps {
  openModal: boolean;
  closeModal: () => void;
}

export default function ConnectWallet({ openModal, closeModal }: ConnectWalletProps) {
  const { wallets, activeAddress } = useWallet();

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD;

  React.useEffect(() => {
    const dialog = document.getElementById("connect_wallet_modal") as HTMLDialogElement | null;
    if (!dialog) return;
    if (openModal && !dialog.open) dialog.showModal();
    if (!openModal && dialog.open) dialog.close();
  }, [openModal]);

  return (
    <dialog
      id="connect_wallet_modal"
      className={`modal modal-bottom sm:modal-middle ${openModal ? "modal-open" : ""}`}
      onClose={closeModal}
    >
      <div className="modal-box max-w-lg bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-800">💼</span>
            Select wallet provider
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition text-sm"
            onClick={closeModal}
            aria-label="Close wallet modal"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Choose the wallet you want to connect. Supported: Pera, Defly, and others.
        </p>

        <div className="space-y-4">
          {activeAddress && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
              Connected: <span className="font-mono">{activeAddress}</span>
            </div>
          )}

          {!activeAddress &&
            wallets?.map((wallet) => (
              <button
                data-test-id={`${wallet.id}-connect`}
                className={
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition"
                }
                key={`provider-${wallet.id}`}
                onClick={() => {
                  // Close immediately on selection; start connection in background
                  closeModal();
                  void wallet.connect();
                }}
              >
                {!isKmd(wallet) && (
                  <img
                    alt={`wallet_icon_${wallet.id}`}
                    src={wallet.metadata.icon}
                    className="w-9 h-9 object-contain rounded-md border border-gray-100 bg-white"
                  />
                )}
                <span className="font-medium text-sm text-left flex-1 text-gray-900">
                  {isKmd(wallet) ? "LocalNet Wallet" : wallet.metadata.name}
                </span>
                {wallet.isActive && <span className="text-emerald-600 text-sm">Connected</span>}
              </button>
            ))}
        </div>

        <div className="modal-action mt-6 flex gap-3">
          <button
            data-test-id="close-wallet-modal"
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm hover:bg-gray-100 transition"
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
