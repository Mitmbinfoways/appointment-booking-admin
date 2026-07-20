import "./globals.css";
import GlobalProviders from "@/providers";

export const metadata = {
  title: "Appointment Booking Admin",
  description: "Appointment Booking Admin Panel styled after Akshar Apprals",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-white text-gray-900">
      <body className="min-h-screen flex flex-col antialiased">
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
