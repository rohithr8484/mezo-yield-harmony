import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is x402 and how does it work?",
    a: "x402 is an open HTTP 402 payment protocol. The server replies 402 Payment Required with the price in MUSD on Mezo Testnet, your wallet signs a Permit2 authorization and sends the payment, and the client retries with the X-PAYMENT header. The banner triggers a real MUSD transfer so you can see the transaction in MetaMask activity.",
  },
  {
    q: "Why do I need Mezo Testnet (Chain ID 31611)?",
    a: "Every payment in this marketplace — MUSD, MEZO, BTC and x402 — settles on Mezo Testnet. The app automatically prompts MetaMask to switch networks before signing.",
  },
  {
    q: "Which tokens are accepted for paid services?",
    a: "Marketplace APIs and oracle feeds are priced in MEZO. Governance access can be paid with MUSD, MEZO or BTC. The x402 demo specifically uses MUSD via Permit2.",
  },
  {
    q: "Where can I see my transaction after paying?",
    a: "Every successful payment shows a transaction hash linked to the Mezo explorer (explorer.test.mezo.org). MetaMask will also list the MUSD/MEZO/BTC transfer under Activity.",
  },
  {
    q: "Do AI services (Sentiment, Summarization) use my API keys?",
    a: "No. Both AI tools run through the Lovable AI Gateway with the google/gemini-3-flash-preview model — no third-party keys are required from you.",
  },
  {
    q: "What about gas fees?",
    a: "On Mezo Testnet gas is paid in BTC and is negligible. For x402 calls, the protocol settles in a single MUSD transfer so the user only signs once.",
  },
  {
    q: "Is this production-ready?",
    a: "This deployment targets Mezo Testnet for demos and integration testing. Smart contracts (VotingDataHelper, MarketplaceAdmin, VeNFTMarketplace, etc.) are listed in the Contracts section above for review.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 bg-secondary/50" id="faq">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Everything you need to know
          </h2>
          <p className="text-muted-foreground text-base">
            Payments, x402, Mezo Testnet, and how the marketplace settles on-chain.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-xl border border-border bg-card px-5 shadow-card data-[state=open]:shadow-card-hover"
            >
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline py-5">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
