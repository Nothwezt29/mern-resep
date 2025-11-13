import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const API = "https://mern-resep-backend-production.up.railway.app";

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/search?q=${query}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Cari Resep</h2>

      <input
        type="text"
        placeholder="Cari ayam, sapi, mie..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: 10, width: "70%", fontSize: 16 }}
      />

      <button
        onClick={handleSearch}
        style={{ padding: "10px 20px", marginLeft: 10 }}
      >
        Cari
      </button>

      {loading && <p>Loading...</p>}

      <ul>
        {results.map((item) => (
          <li key={item._id} style={{ marginBottom: 20 }}>
            <strong>{item.Title}</strong>
            <br />
            <a href={item.URL} target="_blank">Lihat Resep Asli</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
