import "./globals.css";

export const metadata = {
  title: "GS Pablo Apóstol App",
  description: "App del Grupo Scout Pablo Apóstol",
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
