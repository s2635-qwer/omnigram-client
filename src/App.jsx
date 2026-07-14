import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "./api.js";

/* ----------------------------------------------------------------
   OmniGram — 10개의 취향 SNS를 하나로 합친 "멤버십 패스포트"
   로컬 Express 서버 + JSON 파일 DB 기반 (VS Code / 로컬 실행용)
---------------------------------------------------------------- */

const CATEGORIES = [
  { id: "game",   name: "GamerGram",  icon: "🎮", color: "#8C6BFF", likeLabel: "👍 좋아요", commentLabel: "💬 댓글" },
  { id: "dev",    name: "DevGram",    icon: "💻", color: "#3FD9A4", likeLabel: "⭐ Star",   commentLabel: "💬 Review" },
  { id: "study",  name: "StudyGram",  icon: "📖", color: "#FF7A59", likeLabel: "👍 좋아요", commentLabel: "💬 댓글" },
  { id: "music",  name: "MusicGram",  icon: "🎵", color: "#FFCB4D", likeLabel: "❤️ 좋아요", commentLabel: "💬 댓글" },
  { id: "food",   name: "FoodGram",   icon: "🍱", color: "#FF8FB3", likeLabel: "😋 맛있겠다", commentLabel: "💬 댓글" },
  { id: "movie",  name: "MovieGram",  icon: "🎬", color: "#5FB0FF", likeLabel: "👍 좋아요", commentLabel: "💬 댓글" },
  { id: "campus", name: "CampusGram", icon: "📷", color: "#A7E85B", likeLabel: "👍 좋아요", commentLabel: "💬 댓글" },
  { id: "design", name: "DesignGram", icon: "🎨", color: "#D68CFF", likeLabel: "👍 좋아요", commentLabel: "💬 댓글" },
  { id: "travel", name: "TravelGram", icon: "🌎", color: "#4DD6C8", likeLabel: "👍 좋아요", commentLabel: "💬 댓글" },
  { id: "mood",   name: "MoodGram",   icon: "😄", color: "#FFD35C", likeLabel: "🫂 공감",   commentLabel: "💬 댓글" },
];

const FIELDS = {
  game: [
    { key: "gameName", label: "게임 이름", type: "text", placeholder: "예: 발로란트" },
    { key: "tier", label: "티어 인증", type: "text", placeholder: "예: 골드 3" },
    { key: "caption", label: "스크린샷 캡션", type: "textarea", placeholder: "오늘의 플레이를 자랑해보세요" },
    { key: "lookingForDuo", label: "같이 게임할 사람 구해요", type: "checkbox" },
  ],
  dev: [
    { key: "projectName", label: "프로젝트명", type: "text", placeholder: "예: omnigram-api" },
    { key: "githubUrl", label: "GitHub 링크", type: "text", placeholder: "https://github.com/..." },
    { key: "code", label: "코드 스니펫", type: "textarea", mono: true, placeholder: "코드를 붙여넣으세요" },
    { key: "caption", label: "설명 / 버그 질문", type: "textarea", placeholder: "무슨 코드인지 설명해주세요" },
  ],
  study: [
    { key: "minutes", label: "오늘 공부 시간(분)", type: "number", placeholder: "예: 120" },
    { key: "goal", label: "목표", type: "text", placeholder: "예: 토익 900점" },
    { key: "caption", label: "한마디", type: "textarea" },
  ],
  music: [
    { key: "song", label: "오늘 들은 노래 (제목 - 아티스트)", type: "text", placeholder: "예: Dynamite - BTS" },
    { key: "playlist", label: "플레이리스트", type: "text", placeholder: "예: 출근길 플레이리스트" },
    { key: "isCover", label: "커버곡이에요", type: "checkbox" },
    { key: "caption", label: "한마디", type: "textarea" },
  ],
  food: [
    { key: "foodName", label: "음식 이름", type: "text", placeholder: "예: 김치볶음밥" },
    { key: "ratingStars", label: "내 맛 점수 (1~5)", type: "number", min: 1, max: 5, placeholder: "5" },
    { key: "caption", label: "한마디", type: "textarea" },
  ],
  movie: [
    { key: "title", label: "영화/드라마 제목", type: "text" },
    { key: "rating", label: "평점 (1~5)", type: "number", min: 1, max: 5 },
    { key: "scene", label: "명장면 저장", type: "text", placeholder: "가장 좋았던 장면을 적어보세요" },
    { key: "caption", label: "리뷰", type: "textarea" },
  ],
  campus: [
    { key: "postType", label: "종류", type: "select", options: ["시간표", "과제", "급식", "학교 행사"] },
    { key: "caption", label: "내용", type: "textarea" },
  ],
  design: [
    { key: "tool", label: "툴", type: "select", options: ["Figma", "Photoshop", "Procreate", "기타"] },
    { key: "projectName", label: "작업명", type: "text" },
    { key: "caption", label: "설명", type: "textarea" },
  ],
  travel: [
    { key: "country", label: "국가", type: "text", placeholder: "예: 일본" },
    { key: "city", label: "도시", type: "text", placeholder: "예: 오사카" },
    { key: "caption", label: "여행 기록", type: "textarea" },
  ],
  mood: [
    { key: "mood", label: "오늘 기분", type: "select", options: ["😊 행복", "😴 피곤", "😭 슬픔", "😎 신남", "😡 화남", "😍 설렘"] },
    { key: "caption", label: "한마디 (선택)", type: "textarea" },
  ],
};

const SESSION_KEY = "omnigram-session";

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function highlightCode(code) {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const keywords = /\b(function|const|let|var|return|if|else|for|while|import|export|class|from|new|async|await|def|public|private|static)\b/g;
  return escaped.replace(keywords, '<span style="color:#3FD9A4;font-weight:700">$1</span>');
}

/* ------------------------------ tiny bits ------------------------------ */

function StarRow({ value, size = 14 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }}>
      {"★".repeat(v)}
      <span style={{ opacity: 0.25 }}>{"★".repeat(5 - v)}</span>
    </span>
  );
}

function Chip({ children, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: color ? `${color}22` : "var(--surface-alt)",
        color: color || "var(--muted)",
        border: `1px solid ${color ? color + "55" : "var(--border)"}`,
      }}
    >
      {children}
    </span>
  );
}

/* the crest: 10 dots in a ring, one per community — the app's signature mark */
function Crest({ size = 56, spin = false }) {
  const r = size * 0.36;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r + size * 0.09} fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
      {CATEGORIES.map((c, i) => {
        const angle = (i / CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return (
          <circle key={c.id} cx={x} cy={y} r={size * 0.052} fill={c.color}>
            {spin && (
              <animate attributeName="r" values={`${size * 0.052};${size * 0.075};${size * 0.052}`} dur="2.4s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
            )}
          </circle>
        );
      })}
      <circle cx={cx} cy={cy} r={size * 0.14} fill="var(--gold)" />
    </svg>
  );
}

/* ------------------------------ Auth screen ------------------------------ */

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const u = username.trim();
    setError("");
    if (!u || !password) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await api.signup(u, password);
      } else {
        await api.login(u, password);
      }
      onAuth(u);
    } catch (e) {
      setError(e.message || "오류가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="og-auth">
      <div className="og-auth-card">
        <Crest size={64} spin />
        <h1 className="og-auth-title">OmniGram</h1>
        <p className="og-auth-sub">취향이 같은 사람들만 모인 10개의 커뮤니티, 하나의 멤버십으로 입장하세요.</p>

        <div className="og-auth-tabs">
          <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>회원가입</button>
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>로그인</button>
        </div>

        <label className="og-field-label">아이디</label>
        <input className="og-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="사용할 아이디" />
        <label className="og-field-label">비밀번호</label>
        <input
          className="og-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        {error && <div className="og-auth-error">{error}</div>}

        <button className="og-btn og-btn-block" onClick={submit} disabled={busy}>
          {busy ? "처리 중..." : mode === "signup" ? "가입하고 시작하기" : "로그인"}
        </button>

        <div className="og-auth-dots">
          {CATEGORIES.map((c) => (
            <span key={c.id} title={c.name} style={{ background: c.color }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ App ------------------------------ */

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState(null);
  const [activeCat, setActiveCat] = useState("all");
  const [draft, setDraft] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [foodBusy, setFoodBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const bootRef = useRef(false);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) setCurrentUser(saved);
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const data = await api.getPosts();
      setPosts(data);
      setLoadError("");
    } catch (e) {
      setPosts([]);
      setLoadError("서버에 연결할 수 없어요. `npm run server`로 백엔드를 실행했는지 확인해주세요.");
    }
  }

  function handleAuth(username) {
    setCurrentUser(username);
    localStorage.setItem(SESSION_KEY, username);
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }

  function updateDraft(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function submitPost() {
    if (activeCat === "all" || !currentUser) return;
    const fields = FIELDS[activeCat];
    const hasSomething = fields.some((f) => draft[f.key]);
    if (!hasSomething) return;

    let data = { ...draft };
    if (activeCat === "food" && data.foodName) {
      setFoodBusy(true);
      try {
        const ai = await api.analyzeFood(data.foodName);
        data = { ...data, ai };
      } finally {
        setFoodBusy(false);
      }
    }

    try {
      const newPost = await api.createPost({ category: activeCat, author: currentUser, data });
      setPosts((prev) => [newPost, ...(prev || [])]);
      setDraft({});
    } catch (e) {
      alert(e.message || "게시에 실패했어요.");
    }
  }

  async function toggleLike(postId) {
    if (!currentUser) return;
    try {
      const updated = await api.toggleLike(postId, currentUser);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    } catch (e) {}
  }

  async function addComment(postId) {
    if (!currentUser) return;
    const text = (commentInput[postId] || "").trim();
    if (!text) return;
    try {
      const updated = await api.addComment(postId, currentUser, text);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      setCommentInput((c) => ({ ...c, [postId]: "" }));
    } catch (e) {}
  }

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (activeCat === "all") return posts;
    return posts.filter((p) => p.category === activeCat);
  }, [posts, activeCat]);

  const studyLeaderboard = useMemo(() => {
    if (!posts) return [];
    const map = {};
    posts.filter((p) => p.category === "study").forEach((p) => {
      const m = Number(p.data.minutes) || 0;
      map[p.author] = (map[p.author] || 0) + m;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [posts]);

  const studyStreak = useMemo(() => {
    if (!posts || !currentUser) return 0;
    const days = new Set(
      posts.filter((p) => p.category === "study" && p.author === currentUser).map((p) => p.createdAt.slice(0, 10))
    );
    let streak = 0;
    let cursor = new Date();
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [posts, currentUser]);

  const travelStamps = useMemo(() => {
    if (!posts || !currentUser) return [];
    const set = new Set(
      posts.filter((p) => p.category === "travel" && p.author === currentUser).map((p) => p.data.country).filter(Boolean)
    );
    return Array.from(set);
  }, [posts, currentUser]);

  const todaysGames = useMemo(() => {
    if (!posts || !currentUser) return [];
    const today = new Date().toISOString().slice(0, 10);
    return posts
      .filter((p) => p.category === "game" && p.author === currentUser && p.createdAt.slice(0, 10) === today)
      .map((p) => p.data.gameName)
      .filter(Boolean);
  }, [posts, currentUser]);

  const cat = CATEGORIES.find((c) => c.id === activeCat);
  const styleVars = { "--accent": cat ? cat.color : "#8C6BFF" };

  const globalStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,900;1,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; }
    .omnigram-root {
      --bg: #171220;
      --surface: #1F1929;
      --surface-alt: #291F38;
      --text: #F3EFE8;
      --muted: #A79BB8;
      --border: #362A47;
      --gold: #E8B94F;
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }

    /* ---- auth screen ---- */
    .og-auth {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 40px 20px;
      background:
        radial-gradient(circle at 15% 20%, #8C6BFF22, transparent 40%),
        radial-gradient(circle at 85% 15%, #3FD9A422, transparent 40%),
        radial-gradient(circle at 50% 90%, #FF7A5922, transparent 45%),
        var(--bg);
    }
    .og-auth-card {
      width: 100%; max-width: 360px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px 28px;
      text-align: center;
      box-shadow: 0 30px 60px -20px #00000066;
    }
    .og-auth-title { font-family: 'Fraunces', serif; font-weight: 900; font-size: 30px; margin: 14px 0 6px; letter-spacing: -0.5px; }
    .og-auth-sub { font-size: 13px; color: var(--muted); line-height: 1.5; margin: 0 0 22px; }
    .og-auth-tabs { display: flex; background: var(--surface-alt); border-radius: 10px; padding: 4px; margin-bottom: 18px; }
    .og-auth-tabs button { flex: 1; border: none; background: none; color: var(--muted); font-weight: 700; font-size: 13px; padding: 8px 0; border-radius: 8px; cursor: pointer; font-family: inherit; }
    .og-auth-tabs button.active { background: var(--gold); color: #221A0C; }
    .og-auth-error { color: #FF8B8B; font-size: 12px; margin: 6px 0 4px; text-align: left; }
    .og-btn-block { width: 100%; margin-top: 12px; padding: 11px 0; font-size: 14px; }
    .og-auth-dots { display: flex; justify-content: center; gap: 6px; margin-top: 24px; }
    .og-auth-dots span { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

    /* ---- app shell ---- */
    .og-shell { display: flex; min-height: 100vh; }
    .og-rail {
      width: 76px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column; align-items: center;
      padding: 16px 0; gap: 6px;
    }
    .og-rail-icon {
      width: 46px; height: 46px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; border-radius: 12px; cursor: pointer;
      background: transparent; border: 1px solid transparent; transition: all .15s ease;
    }
    .og-rail-icon:hover { background: var(--surface-alt); }
    .og-rail-icon.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, transparent); }
    .og-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .og-header { padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .og-wordmark { font-family: 'Fraunces', serif; font-weight: 700; font-size: 21px; letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px; }
    .og-body { flex: 1; display: flex; overflow: hidden; }
    .og-feed { flex: 1; overflow-y: auto; padding: 20px 24px 60px; display: flex; flex-direction: column; gap: 16px; }
    .og-side { width: 260px; border-left: 1px solid var(--border); padding: 20px; overflow-y: auto; background: var(--surface); }
    .og-composer { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
    .og-field-label { font-size: 12px; color: var(--muted); font-weight: 600; margin-bottom: 4px; display: block; }
    .og-input, .og-textarea, .og-select {
      width: 100%; background: var(--surface-alt); border: 1px solid var(--border); color: var(--text);
      border-radius: 8px; padding: 8px 10px; font-size: 13px; font-family: inherit; margin-bottom: 10px;
    }
    .og-textarea { resize: vertical; min-height: 60px; }
    .og-input:focus, .og-textarea:focus, .og-select:focus { outline: 2px solid var(--accent); border-color: var(--accent); }
    .og-btn { background: var(--gold); color: #221A0C; font-weight: 700; border: none; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-size: 13px; font-family: inherit; }
    .og-btn:disabled { opacity: 0.5; cursor: default; }
    .og-btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
    .og-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
    .og-card-top { padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
    .og-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--accent); color: #16121F; font-weight: 700; font-size: 13px; font-family: 'Fraunces', serif; }
    .og-card-hero { padding: 0 16px 12px; }
    .og-card-actions { padding: 8px 16px; border-top: 1px solid var(--border); display: flex; gap: 14px; align-items: center; }
    .og-action { background: none; border: none; color: var(--muted); font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600; font-family: inherit; }
    .og-action.liked { color: var(--accent); }
    .og-comments { padding: 10px 16px 14px; border-top: 1px solid var(--border); }
    .og-comment { font-size: 12.5px; margin-bottom: 6px; color: var(--text); }
    .og-comment b { color: var(--muted); font-weight: 700; margin-right: 6px; }
    .og-code-block { background: #0F0B17; border-radius: 8px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; overflow-x: auto; white-space: pre; line-height: 1.6; }
    .og-empty { color: var(--muted); font-size: 13px; text-align: center; padding: 60px 0; }
    .og-side h4 { font-family: 'Fraunces', serif; font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 10px; }
    .og-logout { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; }
    .og-banner { background: #4a2b2b; color: #ffd7d7; font-size: 12.5px; padding: 10px 24px; border-bottom: 1px solid var(--border); }
  `;

  if (!currentUser) {
    return (
      <div className="omnigram-root" style={styleVars}>
        <style>{globalStyle}</style>
        <AuthScreen onAuth={handleAuth} />
      </div>
    );
  }

  return (
    <div className="omnigram-root" style={styleVars}>
      <style>{globalStyle}</style>
      {loadError && <div className="og-banner">⚠ {loadError}</div>}
      <div className="og-shell">
        <div className="og-rail">
          <div className={"og-rail-icon" + (activeCat === "all" ? " active" : "")} title="전체 피드" onClick={() => setActiveCat("all")}>🏠</div>
          {CATEGORIES.map((c) => (
            <div
              key={c.id}
              className={"og-rail-icon" + (activeCat === c.id ? " active" : "")}
              title={c.name}
              onClick={() => setActiveCat(c.id)}
              style={activeCat === c.id ? { borderColor: c.color } : {}}
            >
              {c.icon}
            </div>
          ))}
        </div>

        <div className="og-main">
          <div className="og-header">
            <div className="og-wordmark">
              <Crest size={30} />
              {cat ? `${cat.icon} ${cat.name}` : "OmniGram · 전체 피드"}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Chip color={cat ? cat.color : "#8C6BFF"}>👤 {currentUser}</Chip>
              <button className="og-logout" onClick={logout}>로그아웃</button>
            </div>
          </div>

          <div className="og-body">
            <div className="og-feed">
              {activeCat !== "all" && (
                <div className="og-composer">
                  {activeCat === "game" && todaysGames.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <span className="og-field-label">오늘 플레이한 게임 자동 기록</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {todaysGames.map((g, i) => (<Chip key={i} color={cat.color}>{g}</Chip>))}
                      </div>
                    </div>
                  )}
                  {FIELDS[activeCat].map((f) => (
                    <div key={f.key}>
                      <label className="og-field-label">{f.label}</label>
                      {f.type === "textarea" && (
                        <textarea
                          className="og-textarea"
                          placeholder={f.placeholder}
                          style={f.mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}
                          value={draft[f.key] || ""}
                          onChange={(e) => updateDraft(f.key, e.target.value)}
                        />
                      )}
                      {f.type === "text" && (
                        <input className="og-input" placeholder={f.placeholder} value={draft[f.key] || ""} onChange={(e) => updateDraft(f.key, e.target.value)} />
                      )}
                      {f.type === "number" && (
                        <input type="number" min={f.min} max={f.max} className="og-input" placeholder={f.placeholder} value={draft[f.key] || ""} onChange={(e) => updateDraft(f.key, e.target.value)} />
                      )}
                      {f.type === "select" && (
                        <select className="og-select" value={draft[f.key] || ""} onChange={(e) => updateDraft(f.key, e.target.value)}>
                          <option value="">선택하세요</option>
                          {f.options.map((o) => (<option key={o} value={o}>{o}</option>))}
                        </select>
                      )}
                      {f.type === "checkbox" && (
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 10, cursor: "pointer" }}>
                          <input type="checkbox" checked={!!draft[f.key]} onChange={(e) => updateDraft(f.key, e.target.checked)} />
                          {f.label}
                        </label>
                      )}
                    </div>
                  ))}
                  <button className="og-btn" onClick={submitPost} disabled={foodBusy}>
                    {foodBusy ? "AI 분석 중..." : `${cat.icon} 게시하기`}
                  </button>
                </div>
              )}

              {posts !== null && filteredPosts.length === 0 && (
                <div className="og-empty">
                  {activeCat === "all" ? "아직 게시물이 없어요. 왼쪽에서 커뮤니티를 골라 첫 게시물을 올려보세요!" : `아직 ${cat.name}에 게시물이 없어요. 첫 게시물의 주인공이 되어보세요!`}
                </div>
              )}

              {(filteredPosts || []).map((p) => {
                const pcat = CATEGORIES.find((c) => c.id === p.category);
                const liked = p.likes.includes(currentUser);
                return (
                  <div key={p.id} className="og-card">
                    <div className="og-card-top">
                      <div className="og-avatar" style={{ background: pcat.color }}>{p.author.slice(0, 1).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {p.author}
                          {p.category === "study" && p.author === currentUser && studyStreak > 1 && (
                            <span style={{ marginLeft: 6, fontSize: 11, color: pcat.color }}>🔥 {studyStreak}일 연속</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{pcat.icon} {pcat.name} · {timeAgo(p.createdAt)}</div>
                      </div>
                      {p.category === "game" && p.data.lookingForDuo && <Chip color={pcat.color}>듀오 구함</Chip>}
                    </div>

                    <div className="og-card-hero">
                      {p.category === "game" && (
                        <>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{p.data.gameName}</span>
                            {p.data.tier && <Chip color={pcat.color}>🏆 {p.data.tier}</Chip>}
                          </div>
                          {p.data.caption && <p style={{ margin: 0, fontSize: 13.5 }}>{p.data.caption}</p>}
                        </>
                      )}
                      {p.category === "dev" && (
                        <>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.data.projectName}</div>
                          {p.data.githubUrl && <div style={{ fontSize: 12, color: pcat.color, marginBottom: 8, wordBreak: "break-all" }}>🔗 {p.data.githubUrl}</div>}
                          {p.data.code && <div className="og-code-block" dangerouslySetInnerHTML={{ __html: highlightCode(p.data.code) }} />}
                          {p.data.caption && <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>{p.data.caption}</p>}
                        </>
                      )}
                      {p.category === "study" && (
                        <>
                          <div style={{ fontSize: 22, fontWeight: 700, color: pcat.color, fontFamily: "'JetBrains Mono', monospace" }}>
                            {p.data.minutes || 0}분 <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, fontFamily: "'Inter'" }}>공부했어요</span>
                          </div>
                          {p.data.goal && <div style={{ marginTop: 4 }}><Chip color={pcat.color}>🎯 {p.data.goal}</Chip></div>}
                          {p.data.caption && <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>{p.data.caption}</p>}
                        </>
                      )}
                      {p.category === "music" && (
                        <>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>🎧 {p.data.song}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                            {p.data.playlist && <Chip color={pcat.color}>{p.data.playlist}</Chip>}
                            {p.data.isCover && <Chip color={pcat.color}>커버곡</Chip>}
                          </div>
                          {p.data.caption && <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>{p.data.caption}</p>}
                        </>
                      )}
                      {p.category === "food" && (
                        <>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{p.data.foodName}</div>
                          {p.data.ratingStars && <StarRow value={p.data.ratingStars} />}
                          {p.data.ai && (
                            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                              <Chip color={pcat.color}>🔥 약 {p.data.ai.calorie}kcal</Chip>
                              <Chip color={pcat.color}>😋 {p.data.ai.taste}</Chip>
                              <Chip color={pcat.color}>🥗 {p.data.ai.nutrition}</Chip>
                            </div>
                          )}
                          {p.data.caption && <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>{p.data.caption}</p>}
                        </>
                      )}
                      {p.category === "movie" && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{p.data.title}</span>
                            <StarRow value={p.data.rating} size={15} />
                          </div>
                          {p.data.scene && <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--muted)" }}>📌 {p.data.scene}</div>}
                          {p.data.caption && <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>{p.data.caption}</p>}
                        </>
                      )}
                      {p.category === "campus" && (
                        <>
                          {p.data.postType && <Chip color={pcat.color}>{p.data.postType}</Chip>}
                          {p.data.caption && <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>{p.data.caption}</p>}
                        </>
                      )}
                      {p.category === "design" && (
                        <>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                            {p.data.tool && <Chip color={pcat.color}>{p.data.tool}</Chip>}
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{p.data.projectName}</span>
                          </div>
                          {p.data.caption && <p style={{ margin: 0, fontSize: 13.5 }}>{p.data.caption}</p>}
                        </>
                      )}
                      {p.category === "travel" && (
                        <>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>🧳 {p.data.country}{p.data.city ? ` · ${p.data.city}` : ""}</div>
                          {p.data.caption && <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>{p.data.caption}</p>}
                        </>
                      )}
                      {p.category === "mood" && (
                        <div style={{ textAlign: "center", padding: "10px 0" }}>
                          <div style={{ fontSize: 42 }}>{(p.data.mood || "").split(" ")[0]}</div>
                          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{(p.data.mood || "").split(" ")[1]}</div>
                          {p.data.caption && <p style={{ margin: "8px 0 0", fontSize: 13.5 }}>{p.data.caption}</p>}
                        </div>
                      )}
                    </div>

                    <div className="og-card-actions">
                      <button className={"og-action" + (liked ? " liked" : "")} onClick={() => toggleLike(p.id)}>
                        {pcat.likeLabel} {p.likes.length > 0 ? p.likes.length : ""}
                      </button>
                      <button className="og-action" onClick={() => setOpenComments((o) => ({ ...o, [p.id]: !o[p.id] }))}>
                        {pcat.commentLabel} {p.comments.length > 0 ? p.comments.length : ""}
                      </button>
                    </div>

                    {openComments[p.id] && (
                      <div className="og-comments">
                        {p.comments.map((c, i) => (<div key={i} className="og-comment"><b>{c.author}</b>{c.text}</div>))}
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <input
                            className="og-input"
                            style={{ marginBottom: 0 }}
                            placeholder={pcat.commentLabel + " 남기기"}
                            value={commentInput[p.id] || ""}
                            onChange={(e) => setCommentInput((c) => ({ ...c, [p.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && addComment(p.id)}
                          />
                          <button className="og-btn-ghost" onClick={() => addComment(p.id)}>등록</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {(activeCat === "study" || activeCat === "travel" || activeCat === "mood") && (
              <div className="og-side">
                {activeCat === "study" && (
                  <>
                    <h4>친구 랭킹</h4>
                    {studyLeaderboard.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)" }}>아직 기록이 없어요</div>}
                    {studyLeaderboard.map(([name, mins], i) => (
                      <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                        <span>{i + 1}. {name}</span>
                        <span style={{ color: cat.color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{mins}분</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>내 연속 출석: <b style={{ color: cat.color }}>{studyStreak}일</b></div>
                  </>
                )}
                {activeCat === "travel" && (
                  <>
                    <h4>내 여권 스탬프</h4>
                    {travelStamps.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)" }}>아직 방문 기록이 없어요</div>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {travelStamps.map((c) => (<Chip key={c} color={cat.color}>🌎 {c}</Chip>))}
                    </div>
                  </>
                )}
                {activeCat === "mood" && (
                  <>
                    <h4>오늘의 감정 분포</h4>
                    {(() => {
                      const today = new Date().toISOString().slice(0, 10);
                      const todays = (posts || []).filter((p) => p.category === "mood" && p.createdAt.slice(0, 10) === today);
                      const counts = {};
                      todays.forEach((p) => { if (p.data.mood) counts[p.data.mood] = (counts[p.data.mood] || 0) + 1; });
                      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                      if (entries.length === 0) return <div style={{ fontSize: 12, color: "var(--muted)" }}>아직 오늘 기록이 없어요</div>;
                      return entries.map(([m, c]) => (
                        <div key={m} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                          <span>{m}</span>
                          <span style={{ color: cat.color, fontWeight: 700 }}>{c}명</span>
                        </div>
                      ));
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
