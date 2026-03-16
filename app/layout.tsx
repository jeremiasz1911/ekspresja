import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { UISettingsProvider } from "@/components/settings/UISettingsProvider";

export const metadata = {
  title: "Ekspresja.net - usługi artystyczne",
  description: "Ekspresja - zajęcia umuzykalniające metodą Gordona i warsztaty muzyczne.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <UISettingsProvider>
          <AuthProvider>{children}</AuthProvider>
        </UISettingsProvider>
      </body>
    </html>
  );
}
