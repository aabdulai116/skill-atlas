import type { Metadata } from "next";
import { PlanView } from "./PlanView";

export const metadata: Metadata = { title: "Plan · Skill Atlas" };

export default function PlanPage() {
  return <PlanView />;
}
