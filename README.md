# OmniGram (로컬 실행 버전)

10개의 취향 SNS(GamerGram, DevGram, StudyGram, MusicGram, FoodGram, MovieGram,
CampusGram, DesignGram, TravelGram, MoodGram)를 하나로 합친 커뮤니티 앱입니다.

- 프론트엔드: React + Vite
- 백엔드: Express + JSON 파일 DB (`server/data/db.json`)
- 회원가입/로그인, 게시글 작성, 좋아요/댓글이 모두 실제 서버에 저장됩니다.
- FoodGram의 칼로리/맛평가/영양분석은 서버에서 Anthropic API를 호출해 생성합니다.

## 1. 설치

```bash
npm install
```

## 2. Anthropic API 키 설정 (FoodGram AI 분석용, 선택)

```bash
cp .env.example .env
```

`.env` 파일을 열어 `ANTHROPIC_API_KEY`에 본인의 API 키를 입력하세요.
키를 설정하지 않아도 앱은 정상 동작하며, FoodGram 분석은 대체 로직(랜덤 추정치)으로 대신 채워집니다.

## 3. 실행

프론트엔드와 백엔드를 동시에 실행하려면:

```bash
npm run dev:all
```

그 다음 브라우저에서 http://localhost:5173 접속하세요.

따로 실행하고 싶다면:

```bash
npm run server   # http://localhost:4000 (API 서버)
npm run dev      # http://localhost:5173 (프론트엔드)
```

## 4. 다른 사람과 같이 쓰려면

같은 와이파이(같은 네트워크)에 있는 사람은 내 컴퓨터의 로컬 IP로 접속하면 같이 쓸 수 있어요.

1. 터미널에서 내 IP 확인 (Mac/Linux: `ifconfig`, Windows: `ipconfig`)
2. `vite.config.js`에 `server: { host: true }` 를 추가하고 다시 실행
3. 같은 네트워크의 다른 사람이 `http://<내 IP>:5173` 으로 접속

**인터넷 어디서나 접속 가능하게 하려면** Render, Railway, Fly.io 같은 곳에
백엔드(`server/`)와 프론트엔드를 각각 배포해야 합니다. 이 저장소 구조 그대로
올리면 되지만, 배포 방식은 사용하는 호스팅 서비스의 가이드를 따라야 해요.

## 5. 주의사항

- `server/data/db.json`이 실제 데이터베이스입니다. 지우면 모든 계정/게시물이 초기화됩니다.
- 비밀번호는 bcrypt로 해시되어 저장됩니다.
- 이건 학습/개인용 데모 수준의 백엔드입니다. 실 서비스로 운영하려면 진짜 DB(PostgreSQL,
  MongoDB 등)와 인증 토큰(JWT), HTTPS 등을 추가로 구성하는 걸 권장해요.
