import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";

export default function CarriersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
