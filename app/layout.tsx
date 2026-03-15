import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata = {
  title: "Ekspresja.net - usługi artystyczne",
  description: "Ekspresja - zajęcia umuzykalniające metodą Gordona i warsztaty muzyczne.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
