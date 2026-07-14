const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    /* no body */
  }
  if (!res.ok) {
    const err = new Error((body && body.error) || `요청 실패 (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export const api = {
  signup: (username, password) =>
    request("/signup", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request("/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  getPosts: () => request("/posts"),

  createPost: (post) => request("/posts", { method: "POST", body: JSON.stringify(post) }),

  toggleLike: (postId, username) =>
    request(`/posts/${postId}/like`, { method: "POST", body: JSON.stringify({ username }) }),

  addComment: (postId, username, text) =>
    request(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ username, text }),
    }),

  analyzeFood: (foodName) =>
    request("/food-analysis", { method: "POST", body: JSON.stringify({ foodName }) }),
adminGetData: (key) =>
    request("/admin/data", { headers: { "x-admin-key": key } }),

  adminDeletePost: (key, id) =>
    request(`/admin/posts/${id}`, { method: "DELETE", headers: { "x-admin-key": key } }),

  adminDeleteUser: (key, username) =>
    request(`/admin/users/${username}`, { method: "DELETE", headers: { "x-admin-key": key } }),
};
