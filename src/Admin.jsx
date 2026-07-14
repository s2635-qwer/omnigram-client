import { useState, useEffect } from "react";
import { api } from "./api.js";

const ADMIN_KEY_STORAGE = "omnigram-admin-key";

const CATEGORY_LABELS = {
  game: "🎮 GamerGram",
  dev: "💻 DevGram",
  study: "📖 StudyGram",
  music: "🎵 MusicGram",
  food: "🍱 FoodGram",
  movie: "🎬 MovieGram",
  campus: "📷 CampusGram",
  design: "🎨 DesignGram",
  travel: "🌎 TravelGram",
  mood: "😄 MoodGram",
};

export default function Admin() {
  const [key, setKey] = useState(sessionStorage.getItem(ADMIN_KEY_STORAGE) || "");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("posts");

  useEffect(() => {
    if (key) load(key);
  }, []);

  async function load(k) {
    setLoading(true);
    setError("");
    try {
      const data = await api.adminGetData(k);
      setUsers(data.users);
      setPosts(data.posts);
      setAuthed(true);
      sessionStorage.setItem(ADMIN_KEY_STORAGE, k);
      setKey(k);
    } catch (e) {
      setError(e.message || "인증에 실패했어요.");
      setAuthed(false);
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id) {
    if (!confirm("이 게시물을 삭제할까요?")) return;
    try {
      await api.adminDeletePost(key, id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  async function deleteUser(username) {
    if (!confirm(`"${username}" 계정과 그 계정의 모든 게시물을 삭제할까요?`)) return;
    try {
      await api.adminDeleteUser(key, username);
      setUsers((prev) => prev.filter((u) => u !== username));
      setPosts((prev) => prev.filter((p) => p.author !== username));
    } catch (e) {
      alert(e.message);
    }
  }

  const style = `
    * { box-sizing: border-box; }
    body { margin: 0; }
    .adm-root {
      --bg: #171220; --surface: #1F1929; --surface-alt: #291F38;
      --text: #F3EFE8; --muted: #A79BB8; --border: #362A47; --gold: #E8B94F;
      font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh;
    }
    .adm-login { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .adm-login-card { width: 320px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; text-align: center; }
    .adm-login-card h1 { font-size: 20px; margin: 0 0 6px; }
    .adm-login-card p { font-size: 12.5px; color: var(--muted); margin: 0 0 18px; }
    .adm-input { width: 100%; background: var(--surface-alt); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 9px 10px; font-size: 13px; margin-bottom: 10px; }
    .adm-btn { width: 100%; background: var(--gold); color: #221A0C; font-weight: 700; border: none; border-radius: 8px; padding: 10px 0; cursor: pointer; font-size: 13px; }
    .adm-error { color: #FF8B8B; font-size: 12px; margin-bottom: 10px; }
    .adm-header { padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .adm-header h1 { font-size: 18px; margin: 0; }
    .adm-body { padding: 20px 24px; }
    .adm-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .adm-tabs button { background: var(--surface); border: 1px solid var(--border); color: var(--muted); padding: 7px 14px; border-radius: 999px; font-size: 12.5px; cursor: pointer; font-weight: 600; }
    .adm-tabs button.active { background: var(--gold); color: #221A0C; border-color: var(--gold); }
    .adm-stat { display: inline-block; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 16px; margin-right: 10px; margin-bottom: 16px; }
    .adm-stat b { font-size: 18px; display: block; }
    .adm-stat span { font-size: 11px; color: var(--muted); }
    table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 12px; font-size: 12.5px; border-bottom: 1px solid var(--border); }
    th { color: var(--muted); font-weight: 600; background: var(--surface-alt); }
    tr:last-child td { border-bottom: none; }
    .adm-del { background: none; border: 1px solid #6b3030; color: #FF8B8B; border-radius: 6px; padding: 4px 10px; font-size: 11.5px; cursor: pointer; }
    .adm-logout { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
    .adm-empty { color: var(--muted); font-size: 13px; padding: 30px 0; text-align: center; }
  `;

  if (!authed) {
    return (
      <div className="adm-root">
        <style>{style}</style>
        <div className="adm-login">
          <div className="adm-login-card">
            <h1>🔐 OmniGram 관리자</h1>
            <p>.env에 설정한 ADMIN_PASSWORD를 입력하세요</p>
            {error && <div className="adm-error">{error}</div>}
            <input
              className="adm-input"
              type="password"
              placeholder="관리자 비밀번호"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(keyInput)}
            />
            <button className="adm-btn" onClick={() => load(keyInput)} disabled={loading}>
              {loading ? "확인 중..." : "입장하기"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-root">
      <style>{style}</style>
      <div className="adm-header">
        <h1>🔐 OmniGram 관리자 페이지</h1>
        <button
          className="adm-logout"
          onClick={() => {
            sessionStorage.removeItem(ADMIN_KEY_STORAGE);
            setAuthed(false);
            setKeyInput("");
          }}
        >
          로그아웃
        </button>
      </div>
      <div className="adm-body">
        <div className="adm-stat"><b>{users.length}</b><span>가입자 수</span></div>
        <div className="adm-stat"><b>{posts.length}</b><span>전체 게시물</span></div>

        <div className="adm-tabs">
          <button className={tab === "posts" ? "active" : ""} onClick={() => setTab("posts")}>게시물 관리</button>
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>회원 관리</button>
        </div>

        {tab === "posts" && (
          posts.length === 0 ? <div className="adm-empty">게시물이 없어요</div> : (
            <table>
              <thead>
                <tr>
                  <th>커뮤니티</th><th>작성자</th><th>내용</th><th>좋아요</th><th>댓글</th><th>작성 시각</th><th></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td>{CATEGORY_LABELS[p.category] || p.category}</td>
                    <td>{p.author}</td>
                    <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.data.caption || p.data.gameName || p.data.foodName || p.data.title || p.data.projectName || p.data.song || p.data.country || p.data.mood || "-"}
                    </td>
                    <td>{p.likes.length}</td>
                    <td>{p.comments.length}</td>
                    <td>{new Date(p.createdAt).toLocaleString("ko-KR")}</td>
                    <td><button className="adm-del" onClick={() => deletePost(p.id)}>삭제</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === "users" && (
          users.length === 0 ? <div className="adm-empty">가입자가 없어요</div> : (
            <table>
              <thead><tr><th>아이디</th><th>게시물 수</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u}>
                    <td>{u}</td>
                    <td>{posts.filter((p) => p.author === u).length}</td>
                    <td><button className="adm-del" onClick={() => deleteUser(u)}>계정 삭제</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}