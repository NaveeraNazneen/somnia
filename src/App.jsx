import { useState, useEffect, useRef } from "react";

const MOODS = ["😴", "😨", "😌", "😤", "🥰", "😵", "🌀", "✨"];
const MOOD_LABELS = ["Peaceful", "Scary", "Calm", "Intense", "Loving", "Confused", "Surreal", "Magical"];

const SAMPLE_DREAMS = [
  {
    id: 1,
    date: "2025-04-20",
    title: "The Endless Library",
    content: "I was running through a massive library that never ended. Books kept falling but I couldn't read them. Someone was chasing me but I never saw their face.",
    mood: 1,
    tags: ["running", "library", "unknown person", "books"],
    aiRead: "The endless library reflects a mind processing overwhelming information — possibly academic pressure. The unreadable books suggest feeling unqualified or blocked from knowledge you're reaching for. The faceless pursuer? That's anxiety wearing no identity yet."
  },
  {
    id: 2,
    date: "2025-04-18",
    title: "Flying Over Mountains",
    content: "I could fly but only barely, skimming just above the ground. Mountains appeared and I had to push so hard to clear them. Made it over the last one just in time.",
    mood: 7,
    tags: ["flying", "mountains", "effort", "barely made it"],
    aiRead: "Low-altitude flying signals ambition that feels constrained — you can rise but the air feels thin. Mountains are classic threshold symbols. That you *cleared* the last one? Your subconscious knows you have more in you than you think."
  }
];

const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function DreamJournal() {
  const [screen, setScreen] = useState("home"); // home | log | entry | patterns | analyze
  const [dreams, setDreams] = useState(SAMPLE_DREAMS);
  const [form, setForm] = useState({ title: "", content: "", mood: 0, tags: "" });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [patternResult, setPatternResult] = useState(null);
  const [particles, setParticles] = useState([]);
  const textRef = useRef();

  useEffect(() => {
    const p = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      dur: Math.random() * 8 + 4,
      delay: Math.random() * 5,
    }));
    setParticles(p);
  }, []);

  const callAI = async (prompt) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text || "The dream speaks beyond words...";
  };

  const handleLog = async () => {
    if (!form.title || !form.content) return;
    setLoading(true);
    const tagList = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    const prompt = `You are a poetic dream analyst with depth of a Jungian therapist but warmth of a wise friend. Analyze this dream in 2-3 sentences. Be insightful, metaphorical, but grounded. Don't be generic.

Dream title: "${form.title}"
Dream: "${form.content}"
Emotional tone: ${MOOD_LABELS[form.mood]}

Give a reading that feels personal and a little uncanny.`;
    
    let aiRead = "";
    try {
      aiRead = await callAI(prompt);
    } catch {
      aiRead = "Your dream holds secrets worth returning to...";
    }

    const newDream = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      title: form.title,
      content: form.content,
      mood: form.mood,
      tags: tagList,
      aiRead
    };
    setDreams(prev => [newDream, ...prev]);
    setForm({ title: "", content: "", mood: 0, tags: "" });
    setLoading(false);
    setSelected(newDream);
    setScreen("entry");
  };

  const handlePatternAnalysis = async () => {
    setAnalyzing(true);
    setScreen("patterns");
    const dreamSummary = dreams.map(d =>
      `Date: ${d.date}, Title: "${d.title}", Content: "${d.content}", Mood: ${MOOD_LABELS[d.mood]}, Tags: ${d.tags.join(", ")}`
    ).join("\n\n");

    const prompt = `You are a dream pattern analyst. Analyze these ${dreams.length} dream journal entries and identify:
1. Recurring symbols or themes (2-3)
2. Emotional pattern over time (1-2 sentences)
3. One bold psychological insight the dreamer probably hasn't consciously noticed
4. A poetic one-line message from their subconscious

Dreams:
${dreamSummary}

Format as JSON: { "symbols": ["symbol1 - meaning", "symbol2 - meaning"], "emotionalPattern": "...", "insight": "...", "message": "..." }
Return ONLY valid JSON, no markdown.`;

    try {
      const result = await callAI(prompt);
      const clean = result.replace(/```json|```/g, "").trim();
      setPatternResult(JSON.parse(clean));
    } catch {
      setPatternResult({
        symbols: ["Running — processing urgency or escape", "Unknown figures — unresolved relationships"],
        emotionalPattern: "A subtle shift from anxious dreamscapes toward more expansive, magical ones.",
        insight: "You repeatedly encounter thresholds you almost don't cross — but always do. Your subconscious trusts you more than you trust yourself.",
        message: "You are always arriving, never lost."
      });
    }
    setAnalyzing(false);
  };

  const moodCounts = MOOD_LABELS.map((label, i) => ({
    label,
    emoji: MOODS[i],
    count: dreams.filter(d => d.mood === i).length
  })).filter(m => m.count > 0);

  const allTags = dreams.flatMap(d => d.tags);
  const tagFreq = allTags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
  const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0015 0%, #0d001f 40%, #060010 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#e8dff5",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Starfield */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#c9b8e8",
            opacity: 0.4,
            animation: `twinkle ${p.dur}s ${p.delay}s infinite alternate`
          }} />
        ))}
      </div>

      <style>{`
        @keyframes twinkle { from { opacity: 0.1; } to { opacity: 0.7; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .dream-card:hover { transform: translateY(-3px); border-color: #9b6fd4 !important; }
        .btn-primary:hover { background: #8b5cf6 !important; transform: scale(1.02); }
        .tag-pill:hover { background: rgba(155,111,212,0.4) !important; }
        * { box-sizing: border-box; }
        textarea:focus, input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #4a2080; border-radius: 2px; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* ——— HOME SCREEN ——— */}
        {screen === "home" && (
          <div style={{ animation: "fadeUp 0.6s ease" }}>
            <div style={{ textAlign: "center", padding: "48px 0 32px" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🌙</div>
              <h1 style={{ fontSize: 32, fontWeight: 400, letterSpacing: "0.02em", margin: "0 0 8px", color: "#f0e8ff" }}>
                Somnia
              </h1>
              <p style={{ color: "#9b87c2", fontSize: 15, margin: 0, fontStyle: "italic" }}>
                your dreams, decoded
              </p>
            </div>

            {/* Stats bar */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Dreams", value: dreams.length, icon: "📖" },
                { label: "This Week", value: dreams.filter(d => new Date(d.date) > new Date(Date.now() - 7*86400000)).length, icon: "🗓️" },
                { label: "Top Mood", value: moodCounts[0]?.emoji || "✨", icon: null }
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(155,111,212,0.2)",
                  borderRadius: 12, padding: "14px 12px", textAlign: "center"
                }}>
                  <div style={{ fontSize: 20 }}>{s.icon || s.value}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#c4a8ff", lineHeight: 1 }}>
                    {s.icon ? s.value : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "#7a6899", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Log dream button */}
            <button className="btn-primary" onClick={() => setScreen("log")} style={{
              width: "100%", padding: "18px", background: "#6d28d9",
              border: "none", borderRadius: 16, color: "white", fontSize: 17,
              cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
              transition: "all 0.2s", marginBottom: 12,
              boxShadow: "0 0 40px rgba(109,40,217,0.3)"
            }}>
              + Log a Dream
            </button>

            <button onClick={handlePatternAnalysis} style={{
              width: "100%", padding: "14px", background: "transparent",
              border: "1px solid rgba(155,111,212,0.35)", borderRadius: 16, color: "#c4a8ff",
              fontSize: 15, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
              transition: "all 0.2s", marginBottom: 28
            }}>
              ✦ Read My Patterns
            </button>

            {/* Recent dreams */}
            <h3 style={{ fontSize: 13, letterSpacing: "0.15em", color: "#6b5a8a", textTransform: "uppercase", margin: "0 0 12px" }}>
              Recent Dreams
            </h3>
            {dreams.map((d, i) => (
              <div key={d.id} className="dream-card" onClick={() => { setSelected(d); setScreen("entry"); }}
                style={{
                  background: "rgba(255,255,255,0.035)", border: "1px solid rgba(155,111,212,0.15)",
                  borderRadius: 14, padding: "16px", marginBottom: 10, cursor: "pointer",
                  transition: "all 0.2s", animation: `fadeUp ${0.4 + i*0.08}s ease`
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{MOODS[d.mood]}</span>
                      <span style={{ fontSize: 15, color: "#e8dff5", fontWeight: 500 }}>{d.title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#7a6899", lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {d.content}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: "#4a3870", marginLeft: 12, whiteSpace: "nowrap" }}>
                    {formatDate(d.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ——— LOG DREAM SCREEN ——— */}
        {screen === "log" && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "32px 0 24px" }}>
              <button onClick={() => setScreen("home")} style={{
                background: "none", border: "none", color: "#9b87c2", cursor: "pointer", fontSize: 22, padding: 0
              }}>←</button>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: "#f0e8ff" }}>New Dream</h2>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, letterSpacing: "0.12em", color: "#6b5a8a", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Title
              </label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Give it a name..."
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(155,111,212,0.2)",
                  borderRadius: 10, padding: "12px 14px", color: "#e8dff5", fontSize: 15,
                  fontFamily: "inherit", transition: "border-color 0.2s"
                }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, letterSpacing: "0.12em", color: "#6b5a8a", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                What happened
              </label>
              <textarea ref={textRef} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Describe everything you remember, no matter how strange..."
                rows={6}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(155,111,212,0.2)",
                  borderRadius: 10, padding: "12px 14px", color: "#e8dff5", fontSize: 15,
                  fontFamily: "inherit", resize: "vertical", lineHeight: 1.6
                }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, letterSpacing: "0.12em", color: "#6b5a8a", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                Mood / Tone
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {MOODS.map((m, i) => (
                  <button key={i} onClick={() => setForm(p => ({ ...p, mood: i }))}
                    style={{
                      background: form.mood === i ? "rgba(109,40,217,0.5)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${form.mood === i ? "#6d28d9" : "rgba(155,111,212,0.2)"}`,
                      borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontSize: 13,
                      color: form.mood === i ? "#fff" : "#9b87c2", fontFamily: "inherit",
                      transition: "all 0.2s", display: "flex", gap: 6, alignItems: "center"
                    }}>
                    {m} {MOOD_LABELS[i]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, letterSpacing: "0.12em", color: "#6b5a8a", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Symbols / Tags <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0 }}>(comma separated)</span>
              </label>
              <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                placeholder="water, mother, old house, running..."
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(155,111,212,0.2)",
                  borderRadius: 10, padding: "12px 14px", color: "#e8dff5", fontSize: 15, fontFamily: "inherit"
                }} />
            </div>

            <button className="btn-primary" onClick={handleLog} disabled={loading || !form.title || !form.content}
              style={{
                width: "100%", padding: "18px", background: loading ? "#3d1d70" : "#6d28d9",
                border: "none", borderRadius: 16, color: loading ? "#9b87c2" : "white", fontSize: 17,
                cursor: loading ? "default" : "pointer", fontFamily: "inherit",
                transition: "all 0.2s", boxShadow: "0 0 40px rgba(109,40,217,0.3)"
              }}>
              {loading ? "✦ Reading your dream..." : "✦ Save & Interpret"}
            </button>
          </div>
        )}

        {/* ——— DREAM ENTRY SCREEN ——— */}
        {screen === "entry" && selected && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "32px 0 24px" }}>
              <button onClick={() => setScreen("home")} style={{
                background: "none", border: "none", color: "#9b87c2", cursor: "pointer", fontSize: 22, padding: 0
              }}>←</button>
              <span style={{ fontSize: 11, color: "#4a3870", letterSpacing: "0.1em" }}>{formatDate(selected.date)}</span>
            </div>

            <div style={{ textAlign: "center", padding: "0 0 28px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{MOODS[selected.mood]}</div>
              <h1 style={{ fontSize: 26, fontWeight: 400, color: "#f0e8ff", margin: 0 }}>{selected.title}</h1>
              <span style={{ fontSize: 12, color: "#6b5a8a", letterSpacing: "0.1em" }}>{MOOD_LABELS[selected.mood]}</span>
            </div>

            <div style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(155,111,212,0.15)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: "#c9b8e8" }}>{selected.content}</p>
            </div>

            {selected.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {selected.tags.map(t => (
                  <span key={t} className="tag-pill" style={{
                    background: "rgba(109,40,217,0.2)", border: "1px solid rgba(155,111,212,0.3)",
                    borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#b49dd4", cursor: "default",
                    transition: "background 0.2s"
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            {selected.aiRead && (
              <div style={{
                background: "linear-gradient(135deg, rgba(109,40,217,0.15), rgba(60,20,120,0.2))",
                border: "1px solid rgba(155,111,212,0.3)", borderRadius: 14, padding: 20
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>✦</span>
                  <span style={{ fontSize: 12, letterSpacing: "0.15em", color: "#9b6fd4", textTransform: "uppercase" }}>
                    Dream Reading
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: "#d4c4f0", fontStyle: "italic" }}>
                  {selected.aiRead}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ——— PATTERNS SCREEN ——— */}
        {screen === "patterns" && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "32px 0 24px" }}>
              <button onClick={() => setScreen("home")} style={{
                background: "none", border: "none", color: "#9b87c2", cursor: "pointer", fontSize: 22, padding: 0
              }}>←</button>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: "#f0e8ff" }}>Pattern Reading</h2>
            </div>

            {analyzing ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, animation: "spin 3s linear infinite", display: "inline-block" }}>🌀</div>
                <p style={{ color: "#9b87c2", marginTop: 20, fontStyle: "italic", animation: "pulse 2s infinite" }}>
                  Reading the patterns across your dreams...
                </p>
              </div>
            ) : patternResult ? (
              <div>
                {/* Message from subconscious */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(109,40,217,0.2), rgba(60,20,120,0.25))",
                  border: "1px solid rgba(155,111,212,0.4)", borderRadius: 16, padding: 24,
                  textAlign: "center", marginBottom: 20
                }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#6b5a8a", textTransform: "uppercase", marginBottom: 12 }}>
                    From Your Subconscious
                  </div>
                  <p style={{ margin: 0, fontSize: 20, color: "#f0e8ff", fontStyle: "italic", lineHeight: 1.5 }}>
                    "{patternResult.message}"
                  </p>
                </div>

                {/* Recurring symbols */}
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: "#6b5a8a", textTransform: "uppercase", margin: "0 0 12px" }}>
                    Recurring Symbols
                  </h3>
                  {patternResult.symbols?.map((s, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.035)", border: "1px solid rgba(155,111,212,0.15)",
                      borderRadius: 12, padding: "14px 16px", marginBottom: 8
                    }}>
                      <span style={{ fontSize: 14, color: "#c9b8e8", lineHeight: 1.6 }}>✦ {s}</span>
                    </div>
                  ))}
                </div>

                {/* Emotional pattern */}
                <div style={{
                  background: "rgba(255,255,255,0.035)", border: "1px solid rgba(155,111,212,0.15)",
                  borderRadius: 12, padding: 18, marginBottom: 20
                }}>
                  <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: "#6b5a8a", textTransform: "uppercase", margin: "0 0 10px" }}>
                    Emotional Arc
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: "#c9b8e8", lineHeight: 1.7 }}>{patternResult.emotionalPattern}</p>
                </div>

                {/* Bold insight */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(30,10,70,0.6), rgba(70,20,140,0.3))",
                  border: "1px solid rgba(200,160,255,0.3)", borderRadius: 14, padding: 20, marginBottom: 24
                }}>
                  <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: "#9b6fd4", textTransform: "uppercase", margin: "0 0 10px" }}>
                    ✦ Deeper Insight
                  </h3>
                  <p style={{ margin: 0, fontSize: 15, color: "#e8dff5", lineHeight: 1.8, fontStyle: "italic" }}>
                    {patternResult.insight}
                  </p>
                </div>

                {/* Top tags */}
                {topTags.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: "#6b5a8a", textTransform: "uppercase", margin: "0 0 12px" }}>
                      Your Dream Vocabulary
                    </h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {topTags.map(([tag, count]) => (
                        <span key={tag} style={{
                          background: `rgba(109,40,217,${Math.min(0.15 + count * 0.1, 0.5)})`,
                          border: "1px solid rgba(155,111,212,0.3)", borderRadius: 20,
                          padding: "6px 14px", fontSize: 13, color: "#c4a8ff"
                        }}>
                          {tag} {count > 1 && <span style={{ opacity: 0.6, fontSize: 11 }}>×{count}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

      </div>

      {/* Bottom nav */}
      {(screen === "home" || screen === "patterns") && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(10,0,21,0.9)", backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(155,111,212,0.15)",
          display: "flex", justifyContent: "center", gap: 48, padding: "12px 0 20px",
          zIndex: 10
        }}>
          {[
            { icon: "🌙", label: "Journal", s: "home" },
            { icon: "✦", label: "Patterns", s: "patterns", action: handlePatternAnalysis }
          ].map(nav => (
            <button key={nav.s} onClick={nav.action || (() => setScreen(nav.s))}
              style={{
                background: "none", border: "none", cursor: "pointer", textAlign: "center",
                color: screen === nav.s ? "#c4a8ff" : "#4a3870", transition: "color 0.2s"
              }}>
              <div style={{ fontSize: 22 }}>{nav.icon}</div>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", marginTop: 4, fontFamily: "inherit" }}>
                {nav.label}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}