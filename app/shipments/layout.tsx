import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";

export default function ShipmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
