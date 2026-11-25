import type { Metadata } from "next";
import { AtlasView } from "./AtlasView";

export const metadata: Metadata = { title: "Atlas · Skill Atlas" };

export default function AtlasPage() {
  return <AtlasView />;
}
