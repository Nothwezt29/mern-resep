import React, { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [dark, setDark] = useState(false); // 🌙 dark mode state

  // 🔎 Fungsi cari resep (judul saja)
  const searchResep = async (customQuery, customPage = 1) => {
    const q = customQuery || query;
    if (!q) {
      alert("Masukkan kata kunci dulu, ya!");
      return;
    }

    try {
      setLoading(true);
      const API_URL = "http://10.198.61.157:5000";

      const res = await fetch(
        `${API_URL}/api/search?q=${q}&page=${customPage}&limit=16`
      );           
      const data = await res.json();

      setResults(data);
      setPage(customPage);

      if (data.length > 0) {
        speak(`Menampilkan ${data.length} hasil untuk ${q}`);
      } else {
        speak(`Tidak ditemukan resep untuk ${q}`);
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      speak("Terjadi kesalahan saat mencari resep.");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Reset pencarian
  const resetSearch = () => {
    setQuery("");
    setResults([]);
    setPage(1);
  };

  // 🎤 Mic (speech to text)
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Browser tidak mendukung fitur suara.");
      return;
    }

    const intro = new SpeechSynthesisUtterance(
      "Silakan ucapkan resep yang ingin dicari"
    );
    intro.lang = "id-ID";
    window.speechSynthesis.speak(intro);

    intro.onend = () => {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "id-ID";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.start();

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setQuery(text);
        searchResep(text, 1);
      };

      recognition.onerror = (event) => {
        alert(`Gagal mendengarkan suara: ${event.error}`);
      };
    };
  };

  // 🔊 Text to Speech
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "id-ID";
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
  };

  // ✨ Highlight kata kunci (khusus Title)
  const highlightText = (text, keyword) => {
    if (!text || !keyword) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="hl">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // 🎨 Skeleton Loader
  const SkeletonCard = () => (
    <div className="card skeleton">
      <div className="sk sk-1" />
      <div className="sk sk-2" />
      <div className="sk sk-3" />
    </div>
  );

  // 🌙 Toggle dark mode
  const toggleDark = () => setDark(!dark);

  return (
    <div className={`wrap ${dark ? "dark" : ""}`}>
      <style>{`
        :root {
          --bg1:#ffecd2; --bg2:#fcb69f;
          --primary:#ff7043; --primary-2:#ff9800;
          --accent:#43a047; --muted:#9e9e9e;
          --card:#ffffff; --text:#333; --sub:#555;
          --ring: rgba(255,112,67,.25);
          --radius:16px;
        }
        body.dark, .wrap.dark {
          --bg1:#1a1a1a; --bg2:#2a2a2a;
          --card:#2e2e2e; --text:#f5f5f5;
          --sub:#bbb; --primary:#ff5722;
          --primary-2:#ff9800; --accent:#4caf50;
          --muted:#757575; --ring: rgba(255,152,0,.35);
        }
        *{box-sizing:border-box} body{margin:0}
        .wrap{
          font-family:'Poppins','Segoe UI',sans-serif;
          min-height:100vh; padding:20px;
          background:linear-gradient(135deg,var(--bg1),var(--bg2));
          transition:background .3s ease;
        }
        .title{
          font-size:clamp(1.8rem,4vw,2.6rem);
          font-weight:800;text-align:center;margin:10px 0 22px;
          background:linear-gradient(45deg,var(--primary),var(--primary-2));
          -webkit-background-clip:text;background-clip:text;color:transparent;
        }
        .bar{
          max-width:820px;margin:0 auto 28px;padding:14px;
          background:var(--card);border-radius:var(--radius);
          box-shadow:0 6px 16px rgba(0,0,0,.12);
          display:flex;gap:10px;flex-wrap:wrap;align-items:center;
        }
        .input{flex:1 1 260px;min-width:0;padding:12px 14px;border-radius:12px;
          border:1px solid #e8e8e8;font-size:16px;outline:none;}
        .input:focus{border-color:var(--primary);box-shadow:0 0 0 4px var(--ring);}
        .btn{padding:12px 16px;border:none;border-radius:12px;font-weight:700;cursor:pointer}
        .btn-primary{background:var(--primary);color:#fff}
        .btn-accent{background:var(--accent);color:#fff}
        .btn-muted{background:var(--muted);color:#fff}
        .btn:disabled{opacity:.6;cursor:not-allowed}

        .grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
          max-width:1200px;margin:0 auto;}
        .card{background:var(--card);border-radius:20px;padding:20px;
          box-shadow:0 4px 12px rgba(0,0,0,.15);
          display:flex;flex-direction:column;overflow:hidden;
          transition:transform .22s ease,box-shadow .22s ease;}
        .card:hover{transform:translateY(-4px);box-shadow:0 12px 26px rgba(0,0,0,.22)}
        .emoji{font-size:2rem;text-align:center;margin-bottom:10px}
        .title3{color:var(--text);margin:0 0 10px;text-align:center}
        .scroll{flex:1;overflow:auto;padding-right:6px}
        .meta{color:var(--sub);font-size:14px}
        .speak{margin-top:10px;font-size:14px;padding:10px 12px}

        .skeleton .sk{border-radius:8px;background:#eee}
        .skeleton .sk-1{height:20px;width:70%;margin-bottom:10px}
        .skeleton .sk-2{height:14px;width:90%;margin-bottom:6px;background:#f3f3f3}
        .skeleton .sk-3{height:14px;width:80%;background:#f3f3f3}

        .empty{text-align:center;color:var(--sub);font-size:1.05rem;grid-column:1/-1;}

        .pager{margin-top:22px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap}
        .hl{background:#ffeb3b;color:#000;font-weight:700;padding:0 2px;border-radius:4px}

        /* Mobile fix */
        @media(max-width:640px){
          .card{max-height:unset}
          .speak{padding:8px 12px;font-size:13px}
        }
      `}</style>

      {/* Toggle dark mode */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <button
          className="btn btn-muted"
          onClick={toggleDark}
          style={{ background: dark ? "var(--primary-2)" : "var(--muted)" }}
        >
          {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Judul */}
      <h1 className="title">🍲 Cari Resep Masakan</h1>

      {/* Search Bar */}
      <div className="bar">
        <input
          className="input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Cari resep..."
        />
        <button className="btn btn-primary" onClick={() => searchResep(query, 1)}>
          Cari
        </button>
        <button className="btn btn-accent" onClick={startListening}>
          🎤
        </button>
        <button className="btn btn-muted" onClick={resetSearch}>
          🔄 Reset
        </button>
      </div>

      {/* Hasil pencarian */}
      <div className="grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : results.length === 0 ? (
            <p className="empty">🔍 Tidak ada hasil. Coba kata kunci lain.</p>
          ) : (
            results.map((item, index) => (
              <div key={item._id} className="card">
                <div className="emoji">
                  {["🍜", "🥘", "🍲", "🍗", "🥗", "🍛", "🍤"][index % 7]}
                </div>

                {/* Highlight hanya Title */}
                <h3 className="title3">{highlightText(item.Title, query)}</h3>

                <div className="scroll">
                  <p className="meta">
                    <b>Bahan:</b> {item.Ingredients || "-"}
                  </p>
                  <p className="meta">
                    <b>Langkah:</b> {item.Steps || "-"}
                  </p>
                </div>

                <p className="meta">
                  <b>❤️ Disukai:</b> {item.Loves || 0}
                </p>

                <button
                  className="btn speak"
                  style={{ background: "var(--primary-2)", color: "#fff" }}
                  onClick={() => speak(item.Title + ". " + (item.Steps || ""))}
                >
                  🔊 Baca Resep
                </button>
              </div>
            ))
          )}
      </div>

      {/* 📌 Pagination */}
      {results.length > 0 && (
        <div className="pager">
          <button
            className="btn btn-primary"
            onClick={() => searchResep(query, page - 1)}
            disabled={page === 1}
            style={{ background: page === 1 ? "#ccc" : "var(--primary)" }}
          >
            ⬅ Prev
          </button>
          <span className="btn-num active">Halaman {page}</span>
          <button
            className="btn btn-primary"
            onClick={() => searchResep(query, page + 1)}
          >
            Next ➡
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
