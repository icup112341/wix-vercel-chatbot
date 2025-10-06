export const metadata = {
  title: "Wix Chatbot",
  description: "Embeddable chatbot widget"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
