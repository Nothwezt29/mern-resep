import React, { useState, useEffect, useRef } from "react";
import "./App.css"; // ← CSS DIPISAH

function App() {
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [seenTitles, setSeenTitles] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [dark, setDark] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastBackendPage, setLastBackendPage] = useState(0);

  const PAGE_SIZE = 16;

  const fetchIdRef = useRef(0);
  const resultsRef = useRef(results);
  const seenRef = useRef(seenTitles);
  const lastBackendPageRef = useRef(lastBackendPage);
  const hasMoreRef = useRef(hasMore);
  const pageRef = useRef(page);
  const queryRef = useRef(query);

  useEffect(() => { resultsRef.current = results; }, [results]);
  useEffect(() => { seenRef.current = seenTitles; }, [seenTitles]);
  useEffect(() => { lastBackendPageRef.current = lastBackendPage; }, [lastBackendPage]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { queryRef.current = query; }, [query]);

  const normalize = (s) =>
    (s || "").toLowerCase().replace(/[^a-z0-9]/gi, "").trim();

  const handleStart = (name) => {
    if (!name) return alert("Masukkan nama dulu, ya!");
    localStorage.setItem("username", name);
    sessionStorage.setItem("sessionActive", "true");
    setUsername(name);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    sessionStorage.removeItem("sessionActive");
    setUsername("");
    setResults([]);
    setSeenTitles(new Set());
    setHasMore(true);
    setLastBackendPage(0);
    setPage(1);
    setQuery("");
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem("sessionActive");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    if (sessionStorage.getItem("sessionActive") && localStorage.getItem("username")) {
      setUsername(localStorage.getItem("username"));
    }

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const searchResep = async (customQuery, uiPage = 1) => {
    const q = (customQuery || queryRef.current || "").trim();

    fetchIdRef.current += 1;
    const myFetchId = fetchIdRef.current;

    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    if (!q) {
      alert("Masukkan kata kunci dulu, ya!");
      return;
    }

    if (q !== queryRef.current) {
      setQuery(q);
      setResults([]);
      resultsRef.current = [];

      const freshSet = new Set();
      setSeenTitles(freshSet);
      seenRef.current = freshSet;

      setLastBackendPage(0);
      lastBackendPageRef.current = 0;

      setHasMore(true);
      hasMoreRef.current = true;

      setPage(1);
      pageRef.current = 1;
    }

    const neededCount = uiPage * PAGE_SIZE;

    if (resultsRef.current.length >= neededCount && lastBackendPageRef.current > 0) {
      const start = (uiPage - 1) * PAGE_SIZE;
      const pageItems = resultsRef.current.slice(start, start + PAGE_SIZE);

      setPage(uiPage);
      pageRef.current = uiPage;

      speak(`Menampilkan ${pageItems.length} resep ${q} di halaman ${uiPage}.`);
      return;
    }

    if (!hasMoreRef.current) {
      const total = resultsRef.current.length;
      const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
      setPage(Math.min(uiPage, maxPage));
      speak("Semua hasil resep sudah ditampilkan.");
      return;
    }

    try {
      setLoading(true);
      const API_URL = "https://mern-resep-backend-production.up.railway.app";

      let backendPage = lastBackendPageRef.current + 1;
      let localResults = [...resultsRef.current];
      let localSeen = new Set(seenRef.current);
      let backendExhausted = false;

      while (localResults.length < neededCount && !backendExhausted) {
        const res = await fetch(
          `${API_URL}/api/search?q=${encodeURIComponent(q)}&page=${backendPage}&limit=${PAGE_SIZE}`
        );
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          backendExhausted = true;
          break;
        }

        for (const d of data) {
          const key = normalize(d.Title);
          if (key && !localSeen.has(key)) {
            localSeen.add(key);
            localResults.push(d);
          }
        }

        if (data.length < PAGE_SIZE) backendExhausted = true;
        else backendPage++;
      }

      if (myFetchId !== fetchIdRef.current) return;

      setResults(localResults);
      resultsRef.current = localResults;

      setSeenTitles(localSeen);
      seenRef.current = localSeen;

      setLastBackendPage(backendPage);
      lastBackendPageRef.current = backendPage;

      setHasMore(!backendExhausted);
      hasMoreRef.current = !backendExhausted;

      const maxPageAvailable = Math.max(1, Math.ceil(localResults.length / PAGE_SIZE));
      const targetPage = Math.min(uiPage, maxPageAvailable);

      setPage(targetPage);
      pageRef.current = targetPage;

      const startI = (targetPage - 1) * PAGE_SIZE;
      const finalItems = localResults.slice(startI, startI + PAGE_SIZE);

      speak(`Menampilkan ${finalItems.length} resep ${q} di halaman ${targetPage}.`);

    } catch (err) {
      console.error(err);
      speak("Terjadi kesalahan saat mencari resep.");
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setQuery("");
    queryRef.current = "";
    setResults([]);
    setSeenTitles(new Set());
    setPage(1);
    setLastBackendPage(0);
    setHasMore(true);
  };

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
      recognition.start();

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setQuery(text);
        searchResep(text, 1);
      };
    };
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "id-ID";
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
  };

  const highlightText = (text, keyword) => {
    if (!text || !keyword) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    return text.split(regex).map((p, i) =>
      regex.test(p) ? <span key={i} className="hl">{p}</span> : p
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setResults([]);
      searchResep(queryRef.current, 1);
    }
  };

  if (!username) {
    return (
      <div className="wrap login">
        <h1>👩‍🍳 Masukkan Nama Kamu</h1>

        <input
          className="input-name"
          placeholder="Nama kamu..."
          onKeyDown={(e) =>
            e.key === "Enter" &&
            e.target.value.trim() &&
            handleStart(e.target.value)
          }
        />

        <button
          className="btn-start"
          onClick={() => {
            const val = document.querySelector(".input-name").value.trim();
            handleStart(val);
          }}
        >
          Mulai
        </button>
      </div>
    );
  }

  const SkeletonCard = () => (
    <div className="card skeleton">
      <div className="sk sk-1" />
      <div className="sk sk-2" />
      <div className="sk sk-3" />
    </div>
  );

  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = results.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className={`wrap ${dark ? "dark" : ""}`}>
      <div className="navbar">
        <div className="nav-inner">

          <div className="nav-left">
            <button className="btn btn-muted" onClick={() => window.speechSynthesis.pause()}>
              ⏸ Pause
            </button>

            <button className="btn btn-accent" onClick={() => window.speechSynthesis.resume()}>
              ▶ Lanjut
            </button>

            <button className="btn btn-stop" onClick={() => window.speechSynthesis.cancel()}>
              🔴 Stop
            </button>

            <button className="btn btn-muted" onClick={() => setDark(!dark)}>
              {dark ? "🌕 Light" : "🌙 Dark"}
            </button>
          </div>

          <button className="logout-nav" onClick={handleLogout}>
            🚪 Logout
          </button>

        </div>
      </div>


      <h1 className="title">🍲 Hai, {username}! Cari Resep Masakan</h1>

      <div className="bar">
        <input
          className="input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="🔍 Cari resep..."
        />

        <button
          className="btn btn-primary"
          onClick={() => {
            setResults([]);
            resultsRef.current = [];
            setSeenTitles(new Set());
            seenRef.current = new Set();
            setLastBackendPage(0);
            lastBackendPageRef.current = 0;
            setHasMore(true);
            hasMoreRef.current = true;
            searchResep(queryRef.current, 1);
          }}
        >
          Cari
        </button>

        <button className="btn btn-accent" onClick={startListening}>
          🎤
        </button>

        <button className="btn btn-muted" onClick={resetSearch}>
          🔄 Reset
        </button>
      </div>

      <div className="grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : pageItems.length === 0 ? (
          <p className="empty">🔍 Tidak ada hasil. Coba kata kunci lain.</p>
        ) : (
          pageItems.map((item, index) => (
            <div key={item._id} className="card">
              <div className="emoji">
                {["🍜", "🥘", "🍲", "🍗", "🥗", "🍛", "🍤"][index % 7]}
              </div>

              <h3 className="title3">
                {highlightText(item.Title, queryRef.current)}
              </h3>

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
                onClick={() =>
                  speak(
                    item.Title + ". " +
                    "Bahan bahan: " + (item.Ingredients || "") + ". " +
                    "Langkah langkah: " + (item.Steps || "")
                  )
                }
              >
                🔊 Baca Resep
              </button>
            </div>
          ))
        )}
      </div>

      {results.length > 0 && (
        <div className="pager">
          <button
            className="btn btn-primary"
            onClick={() => {
              const prevPage = Math.max(1, pageRef.current - 1);
              searchResep(queryRef.current, prevPage);
            }}
            disabled={pageRef.current === 1}
          >
            ⬅ Prev
          </button>

          <span className="btn-num active">Halaman {pageRef.current}</span>

          <button
            className="btn btn-primary"
            onClick={() => {
              const nextPage = pageRef.current + 1;
              searchResep(queryRef.current, nextPage);
            }}
            disabled={
              !hasMoreRef.current &&
              resultsRef.current.length <= pageRef.current * PAGE_SIZE
            }
          >
            Next ➡
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
