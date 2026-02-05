import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - E-Office FSM Undip",
  description: "Sistem Informasi Surat Menyurat FSM Undip",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}