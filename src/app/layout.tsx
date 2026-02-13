import "./globals.css";

export const metadata = {
  title: "Scout App",
  description: "App del grupo scout",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
