import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";

export default function ProofOfDeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
