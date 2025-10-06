export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1>Wix Chatbot</h1>
        <p>Open <code>/widget</code> for the embeddable chat.</p>
        <p><a href="/widget">Go to /widget →</a></p>
      </div>
    </main>
  );
}
