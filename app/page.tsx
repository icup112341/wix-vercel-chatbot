export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1>AI Safety Training Chatbot</h1>
        <p>Interactive training for safe AI usage in business environments</p>
        <p>Open <code>/widget</code> for the embeddable chat.</p>
        <p><a href="/widget">Start AI Safety Training →</a></p>
      </div>
    </main>
  );
}
