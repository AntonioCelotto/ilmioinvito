import type { Metadata } from "next";
import { OperatorPanel } from "@/components/operator-panel";
export const metadata: Metadata = { title: "Area operatori | Il Mio Invito", robots: { index: false, follow: false } };
export default function OperatorsPage() {
  return <main className="operator-page"><header className="operator-header"><a className="brand" href="/">ilmioinvito.com</a><nav aria-label="Area operatori"><a href="/dashboard">I miei inviti</a><a href="/">Torna al sito</a></nav></header><div className="operator-page-content"><p className="eyebrow">Il Mio Invito · Professionisti</p><h1>Area operatori</h1><OperatorPanel /></div></main>;
}
