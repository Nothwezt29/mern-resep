import React, { useState, useEffect } from "react";
import "./IntroPage.css";

function IntroPage({ onStart }) {
  const [name, setName] = useState("");

  const handleStart = () => {
    if (name.trim()) {
      localStorage.setItem("username", name.trim());
      onStart(name.trim());
    } else {
      alert("Masukkan nama dulu ya 🍳");
    }
  };

  return (
    <div className="intro-wrap">
      <div className="intro-card">
        <div className="big-icon">🍳</div>
        <h1>Selamat datang di Dapur Pintar!</h1>
        <p>Halo! Boleh tahu nama kamu?</p>

        <input
          type="text"
          placeholder="Masukkan nama kamu..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="intro-input"
        />

        <button onClick={handleStart} className="intro-btn">
          Mulai Memasak!
        </button>

        <p className="small-text">Yuk, cari resep favoritmu hari ini 🍜</p>
      </div>
    </div>
  );
}

export default IntroPage;
