import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";

export default function TransportationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
