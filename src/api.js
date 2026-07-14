import { createClient } from "@supabase/supabase-js";

// Vite 환경 변수에서 Supabase 정보 가져오기
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase 클라이언트 초기화
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const api = {
  // 회원가입
  async signup(username, password) {
    const { data, error } = await supabase
      .from("users") // Supabase의 users 테이블 (혹은 설정한 테이블명)
      .insert([{ username, password }]);
    if (error) throw new Error(error.message);
    return data;
  },

  // 로그인
  async login(username, password) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();
    if (error || !data) throw new Error("아이디 또는 비밀번호가 틀렸습니다.");
    return data;
  },

  // 전체 게시글 가져오기
  async getPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // 게시글 작성
  async createPost({ category, author, data }) {
    const { data: newPost, error } = await supabase
      .from("posts")
      .insert([{ category, author, data, likes: [], comments: [], createdAt: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return newPost;
  },

  // 좋아요 토글
  async toggleLike(postId, username) {
    // 1. 기존 게시글 가져오기
    const { data: post } = await supabase.from("posts").select("likes").eq("id", postId).single();
    if (!post) return;

    let likes = post.likes || [];
    if (likes.includes(username)) {
      likes = likes.filter((u) => u !== username);
    } else {
      likes = [...likes, username];
    }

    // 2. 업데이트
    const { data: updated, error } = await supabase
      .from("posts")
      .update({ likes })
      .eq("id", postId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  },

  // 댓글 추가
  async addComment(postId, username, text) {
    const { data: post } = await supabase.from("posts").select("comments").eq("id", postId).single();
    if (!post) return;

    const comments = [...(post.comments || []), { author: username, text }];

    const { data: updated, error } = await supabase
      .from("posts")
      .update({ comments })
      .eq("id", postId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  },

  // 음식 분석 AI (가상 프록시나 엣지 함수가 없다면 클라이언트 단 임시 처리)
  async analyzeFood(foodName) {
    // 원래 로컬 백엔드 서버가 하던 역할을 프론트에서 임시 mock 데이터로 처리하거나
    // Supabase Edge Function을 활용해야 합니다. 우선 가상 데이터 반환으로 대체합니다.
    return {
      calorie: Math.floor(Math.random() * 400) + 200,
      taste: "풍부하고 깊은 맛",
      nutrition: "단백질 균형 우수"
    };
  }
};