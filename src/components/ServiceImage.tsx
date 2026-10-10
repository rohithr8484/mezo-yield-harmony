import summarization from "@/assets/service-summarization.jpg";
import analytics from "@/assets/service-analytics.jpg";
import aml from "@/assets/service-aml.jpg";
import contracts from "@/assets/service-contracts.jpg";
import oracles from "@/assets/service-oracles.jpg";
import vemezo from "@/assets/service-vemezo.jpg";
import governance from "@/assets/service-governance.jpg";

const images = { summarization, analytics, aml, contracts, oracles, vemezo, governance };
export type ServiceImageKind = keyof typeof images;

export function ServiceImage({ kind, alt, className = "" }: { kind: ServiceImageKind; alt: string; className?: string }) {
  return <img src={images[kind]} alt={alt} loading="lazy" width={1200} height={608} className={`w-full rounded-lg object-cover ${className}`} />;
}