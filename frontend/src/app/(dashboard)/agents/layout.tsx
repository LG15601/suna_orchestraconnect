import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Conversation | Orchestra Connect",
  description: "Interactive agent conversation powered by Orchestra Connect",
  openGraph: {
    title: "Agent Conversation | Orchestra Connect",
    description: "Interactive agent conversation powered by Orchestra Connect",
    type: "website",
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}