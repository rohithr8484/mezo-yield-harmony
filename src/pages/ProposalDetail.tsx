import { useEffect, useState } from "react";

import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { parseUnits } from "viem";

import PageLayout from "@/components/PageLayout";
import WalletButton from "@/components/WalletButton";
import { statusStyles, formatVotes, VOTING_FEE, MEZO_TOKEN, MUSD_TOKEN } from "@/lib/proposals";
import { findProposal, addVote, computeLiveTally, type LiveTally } from "@/lib/proposalStore";
import { payWithMUSD } from "@/lib/musdPayment";
import { payWithMEZO } from "@/lib/mezoPayment";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";

const MEZO_TESTNET_CHAIN_ID = 31611;
const PROPOSAL_FEE_RECIPIENT = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
const VOTING_TOKEN_DECIMALS = 18;


const ProposalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected, address, chain, chainId, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();

  const [voted, setVoted] = useState<"FOR" | "AGAINST" | "ABSTAIN" | null>(null);
  const [selectedVote, setSelectedVote] = useState<"FOR" | "AGAINST" | "ABSTAIN" | null>(null);
  const [pendingPayToken, setPendingPayToken] = useState<"MEZO" | "MUSD" | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  const isProcessingPayment = isSubmittingVote || isSwitchingChain;
  const connectedWalletName = connector?.name ?? "Wallet";
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected";

  const handleSelectVote = (voteType: "FOR" | "AGAINST" | "ABSTAIN") => {
    if (isProcessingPayment) return;
    setSelectedVote(voteType === selectedVote ? null : voteType);
  };

  const getPayButtonLabel = (payToken: "MEZO" | "MUSD") => {
    if (pendingPayToken !== payToken || !isProcessingPayment) {
      return payToken === "MUSD" ? "Pay with MUSD" : "Pay with MEZO";
    }

    if (isSwitchingChain) {
      return "Switching to Mezo Testnet...";
    }

    return `Confirm in ${connectedWalletName}...`;
  };

  const handlePayAndVote = async (payToken: "MEZO" | "MUSD") => {
    if (!selectedVote || isProcessingPayment) return;

    if (!isConnected) {
      setPendingPayToken(payToken);
      openConnectModal?.();
      return;
    }

    setPendingPayToken(payToken);
    setIsSubmittingVote(true);

    try {
      if (chainId !== MEZO_TESTNET_CHAIN_ID) {
        await switchChainAsync({ chainId: MEZO_TESTNET_CHAIN_ID });
      }

      let txHash: string;
      if (payToken === "MUSD") {
        const { stakeHash } = await payWithMUSD(parseUnits(VOTING_FEE, VOTING_TOKEN_DECIMALS), "0.5");
        txHash = stakeHash;
      } else {
        const { stakeHash } = await payWithMEZO(parseUnits(VOTING_FEE, VOTING_TOKEN_DECIMALS));
        txHash = stakeHash;
      }

      setVoted(selectedVote);
      setSelectedVote(null);
      toast.success(
        `${selectedVote} vote recorded after ${payToken} transfer confirmation in ${connectedWalletName}. Tx: ${txHash.slice(0, 10)}...`,
        { duration: 5000 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const rejected = message.includes("rejected") || message.includes("denied") || message.includes("cancelled");

      toast.error(
        rejected
          ? `The ${payToken} transfer request was cancelled in ${connectedWalletName}.`
          : `Couldn't complete the ${payToken} transfer request. Please connect ${connectedWalletName} on Mezo Testnet and try again.`
      );
    } finally {
      setIsSubmittingVote(false);
      setPendingPayToken(null);
    }
  };

  useEffect(() => {
    if (isConnected && pendingPayToken && selectedVote && !isProcessingPayment) {
      toast.info(
        `Connected via ${connectedWalletName} on ${chain?.name ?? "Unknown network"}. Click \"Pay with ${pendingPayToken}\" to open the wallet transfer request.`
      );
      setPendingPayToken(null);
    }
  }, [isConnected, pendingPayToken, selectedVote, isProcessingPayment, connectedWalletName, chain?.name]);

  const proposal = proposals.find((p) => p.id.toLowerCase() === id?.toLowerCase());

  if (!proposal) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Proposal not found</h1>
          <Link to="/governance" className="text-primary hover:underline">← Back to Proposals</Link>
        </div>
      </PageLayout>
    );
  }

  const quorumReached = proposal.quorum >= proposal.quorumRequired;
  const diffReached = proposal.differential >= proposal.differentialRequired;


  return (
    <PageLayout>
      <section className="py-12 md:py-16">
        <div className="container">
          <Link to="/governance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Proposals
          </Link>

          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-6">
              <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
                <div className="bg-secondary/50 border-b border-border px-6 py-4">
                  <h3 className="text-sm font-semibold text-foreground">Proposal overview</h3>
                </div>
                <div className="p-6 md:p-8">
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight mb-4">
                    {proposal.title}
                  </h1>

                  <div className="flex items-center gap-3 mb-8">
                    <img src={proposal.authorAvatar} alt="" className="h-6 w-6 rounded-full" />
                    <span className={`inline-block px-2.5 py-0.5 rounded border text-xs font-medium ${statusStyles[proposal.status]}`}>
                      {proposal.status}
                    </span>
                    <span className="text-xs text-muted-foreground">by {proposal.author}</span>
                  </div>

                  <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-3">Simple Summary</h4>
                      <p>{proposal.summary}</p>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-3">Motivation</h4>
                      <p>{proposal.motivation}</p>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-3">Specification</h4>
                      <p>{proposal.specification}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>


            <div className="space-y-6">
              <div className="rounded-2xl bg-card border border-border shadow-card p-6">
                <h3 className="text-lg font-display font-bold text-foreground mb-1">Your voting info</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {proposal.status === "Active" ? "Voting is live 🟢" : "Voting is closed 🔴"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Fee: {VOTING_FEE} MEZO or MUSD per vote
                </p>
                <div className="space-y-3">
                  {proposal.status === "Active" && (
                    <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Connected wallet app</p>
                        <p className="text-sm font-semibold text-foreground">{isConnected ? connectedWalletName : "Not connected"}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                        <div>Address: <span className="text-foreground">{shortAddress}</span></div>
                        <div>
                          Network: <span className="text-foreground">{chain?.name ?? "Not connected"}</span>
                          {isConnected && chainId !== MEZO_TESTNET_CHAIN_ID ? " — switch required" : ""}
                        </div>
                        <div>Fee recipient: <span className="text-foreground">{PROPOSAL_FEE_RECIPIENT.slice(0, 10)}...{PROPOSAL_FEE_RECIPIENT.slice(-6)}</span></div>
                      </div>
                      {!isConnected && <WalletButton />}
                    </div>
                  )}

                  {voted ? (
                    <div className="text-center py-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-foreground">You voted: {voted}</p>
                    </div>
                  ) : proposal.status === "Active" ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleSelectVote("FOR")}
                          disabled={isProcessingPayment}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${selectedVote === "FOR" ? "bg-emerald-500 text-white border-emerald-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20"}`}
                        >
                          For
                        </button>
                        <button
                          onClick={() => handleSelectVote("AGAINST")}
                          disabled={isProcessingPayment}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${selectedVote === "AGAINST" ? "bg-destructive text-white border-destructive" : "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"}`}
                        >
                          Against
                        </button>
                        <button
                          onClick={() => handleSelectVote("ABSTAIN")}
                          disabled={isProcessingPayment}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${selectedVote === "ABSTAIN" ? "bg-muted-foreground text-white border-muted-foreground" : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"}`}
                        >
                          Abstain
                        </button>
                      </div>
                      {selectedVote && (
                        <div className="space-y-2 pt-2">
                          <p className="text-xs text-muted-foreground text-center">
                            Open a wallet transfer request on Mezo Testnet to pay {VOTING_FEE} and cast your vote.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handlePayAndVote("MUSD")}
                              disabled={isProcessingPayment}
                              className="px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {getPayButtonLabel("MUSD")}
                            </button>
                            <button
                              onClick={() => handlePayAndVote("MEZO")}
                              disabled={isProcessingPayment}
                              className="px-3 py-2.5 rounded-xl bg-bitcoin/10 border border-bitcoin/30 text-sm font-semibold text-bitcoin hover:bg-bitcoin/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {getPayButtonLabel("MEZO")}
                            </button>
                          </div>
                          <div className="text-[10px] text-muted-foreground text-center space-y-0.5">
                            <div>MUSD contract: {MUSD_TOKEN}</div>
                            <div>MEZO contract: {MEZO_TOKEN}</div>
                            <div>Required network: Mezo Testnet (Chain ID: {MEZO_TESTNET_CHAIN_ID})</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Voting has ended for this proposal.</p>
                  )}
                </div>
              </div>


              {/* Proposal Info */}
              <div className="rounded-2xl bg-card border border-border shadow-card p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">State</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded border text-xs font-medium ${statusStyles[proposal.status]}`}>
                    {proposal.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quorum</span>
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    {quorumReached ? "Reached" : "Not reached"}
                    {quorumReached && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </span>
                </div>
                <div className="text-xs text-right text-muted-foreground">
                  <div className="font-medium text-foreground">{formatVotes(proposal.quorum)}</div>
                  <div>{formatVotes(proposal.quorumRequired)}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Differential</span>
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    {diffReached ? "Reached" : "Not reached"}
                    {diffReached && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </span>
                </div>
                <div className="text-xs text-right text-muted-foreground">
                  <div className="font-medium text-foreground">{formatVotes(proposal.differential)}</div>
                  <div>{formatVotes(proposal.differentialRequired)}</div>
                </div>

                {/* Contract addresses */}
                <div className="border-t border-border pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Voting fee contracts:</p>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <div>MEZO: {MEZO_TOKEN.slice(0, 10)}...{MEZO_TOKEN.slice(-6)}</div>
                    <div>MUSD: {MUSD_TOKEN.slice(0, 10)}...{MUSD_TOKEN.slice(-6)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ProposalDetail;
