import { roster } from "./roster.mjs";

export const VERSION = "16.23.1";
export const lanes = ["탑", "정글", "미드", "원딜", "서폿"];
export const opponents = [{ id: "a", label: "A팀" }, { id: "b", label: "B팀" }, { id: "d", label: "D팀" }, { id: "none", label: "미정" }];
export const formats = [{ id: "sim", label: "동시 5밴" }, { id: "split", label: "3+2 밴" }];
export const championMenu = Object.keys(roster).sort((a, b) => roster[a].localeCompare(roster[b], "ko"));

const strategy = (label, bans, note) => ({ label, bans, note });

export const scouting = {
  a: "애 러 원딜 스웨인 13경기, mcrtpr 서폿 잔나 30경기·노틸러스 8경기, 외쳐갓도킹 미드 빅토르 23경기·벡스 19경기. 포지션은 드래프트 전 확인합니다.",
  b: "신안산선 정글 모르가나 22경기·아무무 17경기·녹턴 15경기·브라이어 14경기, 홍차 미드 신드라 16경기·벡스 17경기, 용뇽용룡뇽용 서폿 쓰레쉬 17경기. 금융무야호 원딜 징크스는 10경기입니다.",
  d: "수르롱 원딜 이즈리얼 13경기·자야 8경기, 토스화이팅 서폿 럭스 29경기, YUDABIN 탑 럼블 7경기·케일 5경기. [모름] 준원 챔프폭은 확인되지 않았습니다.",
};

const plans = {
  a: {
    blue: [
      strategy("바텀 보호·정글 견제", ["Swain", "Zac", "Janna", "Malphite", "Lillia"], "노틸러스를 열어 B1을 봅니다. 스웨인·잔나를 빼고 자크·릴리아로 캐치캐치 정글을 견제합니다."),
      strategy("민욱혜진 정글 확인", ["Ekko", "Diana", "Swain", "Janna", "Vex"], "민욱혜진이 정글로 확인됐을 때 에코·다이애나를 자릅니다. 외쳐갓도킹이 미드라면 벡스로 진입 대응을 줄입니다."),
    ],
    red: [
      strategy("바텀·미드 선점 견제", ["Swain", "Janna", "Zac", "Malphite", "Viktor"], "mcrtpr이 B1 노틸러스를 가져갈 때 징크스·세주아니를 봅니다. 외쳐갓도킹 미드가 예상될 때 빅토르 선점을 줄입니다."),
      strategy("캐치캐치 미드 확인", ["Ekko", "Kassadin", "Swain", "Janna", "Malphite"], "민욱혜진 정글·캐치캐치 미드가 확인되면 자크·릴리아 대신 에코·카사딘으로 전환합니다."),
    ],
  },
  b: {
    blue: [
      strategy("정글 두 장과 미드 견제", ["Morgana", "Amumu", "Syndra", "Ryze", "Malphite"], "모르가나의 보호와 아무무 이니시를 줄입니다. 노틸러스가 열리면 B1을 보고 녹턴·징크스 경쟁을 확인합니다."),
      strategy("신안산선 정글 집중", ["Morgana", "Amumu", "Briar", "Vi", "Syndra"], "정글 네 장을 쓰는 대신 벡스·쓰레쉬를 열어 둡니다. 상대 녹턴 선점을 고려해 B1 녹턴 또는 후속 세주아니를 준비합니다."),
    ],
    red: [
      strategy("상대 바텀 연결 끊기", ["Morgana", "Syndra", "Amumu", "Thresh", "Malphite"], "용뇽용룡뇽용이 서폿이면 쓰레쉬를 끊습니다. 우리도 쓰레쉬를 쓸 수 없으므로 노틸러스·알리스타까지 소모되면 룰루와 앞라인을 묶습니다."),
      strategy("홍차 미드 두 장", ["Syndra", "Vex", "Morgana", "Amumu", "Briar"], "홍차 미드가 확실하면 신드라·벡스를 같이 막고 쓰레쉬를 열어 둡니다. 상대 B1 징크스에는 케이틀린을 준비합니다."),
    ],
  },
  d: {
    blue: [
      strategy("수르롱 원딜·토스화이팅 서폿", ["Kayle", "Xayah", "Ezreal", "Lux", "Morgana"], "두 사람의 포지션이 이 배치일 때 바텀 폭을 줄입니다. 이즈리얼을 우리도 못 쓰니 원딜 후보를 미리 확인합니다."),
      strategy("YUDABIN 탑 집중", ["Kayle", "Rumble", "Camille", "Lux", "Xayah"], "상대 탑이 YUDABIN으로 확인되면 세 장을 노립니다. 이즈리얼을 열어 우리 원딜 백업도 남깁니다."),
    ],
    red: [
      strategy("상대 탑을 보고 R5", ["Kayle", "Xayah", "Ezreal", "Lux", "Camille"], "상대 탑 후보를 줄이고 R5에서 탑을 맞춥니다. 상대 B1 징크스면 노틸러스·케이틀린부터 봅니다."),
      strategy("퍄퍄퍄퍄퍄퍄 서폿 확인", ["Kayle", "Rumble", "Blitzcrank", "Thresh", "Xayah"], "퍄퍄퍄퍄퍄퍄가 서폿일 때 그랩 두 장을 막는 선택입니다. 우리 쓰레쉬도 빠지고 토스화이팅 럭스가 열립니다."),
    ],
  },
};

export function getPlans(state) {
  return Object.hasOwn(plans, state.opponent) ? plans[state.opponent][state.side] : [];
}

export function getSelectedPlan(state) {
  return getPlans(state)[state.planIndex] ?? null;
}

export const enemyCases = [
  strategy("레오나·렐 + 주력 3장", ["Leona", "Rell", "Jinx", "Nocturne", "Jayce"], "노틸러스가 남습니다. 암베사·세주아니·케이틀린으로 빈자리를 채웁니다."),
  strategy("서폿 5장", ["Leona", "Rell", "Nautilus", "Alistar", "Thresh"], "룰루·라칸·카르마까지 엽니다. 룰루를 쓸 때 정글 앞라인을 먼저 확보합니다."),
  strategy("주력 4장 + 렐", ["Jinx", "Yasuo", "Jayce", "Nocturne", "Rell"], "레오나는 밴이 아니므로 블루 선점 또는 레드 상대 B1을 열어 둡니다."),
  strategy("바텀 겹밴", ["Leona", "Rell", "Nautilus", "Jinx", "Caitlyn"], "알리스타·쓰레쉬와 베인·이즈리얼을 확인합니다. 교대 조합으로도 바꿔 볼 수 있습니다."),
  strategy("정글 2장", ["Leona", "Rell", "Nocturne", "Sejuani", "Jayce"], "오공을 우선 보고 상대가 먼저 가져가면 리 신을 확인합니다."),
  strategy("미드 교대 견제", ["Leona", "Rell", "Alistar", "Yasuo", "Yone"], "효준 미드·DevJoon 원딜 배치를 우선합니다."),
];

const top = ["Jayce", "Ambessa", "Olaf", "Gangplank", "Jax", "Camille"];
const jungle = ["Nocturne", "Sejuani", "MonkeyKing", "LeeSin", "Briar", "XinZhao"];
const support = ["Leona", "Nautilus", "Rell", "Alistar", "Thresh", "Lulu", "Rakan", "Karma"];
const regular = [top, jungle, ["Sylas", "Ekko", "Viktor", "Orianna", "Kassadin", "Galio"],
  ["Jinx", "Caitlyn", "Vayne", "Ezreal", "Kaisa", "Smolder"], support];
const swapped = [top, jungle, ["Yasuo", "Yone", "Irelia"], ["MissFortune", "Kaisa", "Ezreal", "Xayah"], support];

export function poolsFor(state) {
  return state.swap ? swapped : regular;
}

export function playersFor(state) {
  return ["탑가는 경문이", "검은살치살", state.swap ? "DevJoon" : "효준", state.swap ? "효준" : "DevJoon", "mqz"];
}

export function limitFor(state) {
  return state.format === "split" ? 3 : 5;
}

export function applyPlan(state, index = 0) {
  state.planIndex = index;
  state.ours = (getSelectedPlan(state)?.bans ?? []).slice(0, limitFor(state));
  state.moves = [];
}

function readIds(value, limit) {
  return [...new Set((value ?? "").split(",").filter(id => Object.hasOwn(roster, id)))].slice(0, limit);
}

export function readState(search) {
  const query = new URLSearchParams(search);
  const state = {
    side: query.get("side") === "red" ? "red" : "blue",
    opponent: opponents.some(({ id }) => id === query.get("vs")) ? query.get("vs") : "a",
    format: query.get("format") === "split" ? "split" : "sim",
    swap: query.get("roles") === "swap",
    planIndex: query.get("plan") === "1" ? 1 : 0,
    moves: [],
  };
  const limit = limitFor(state);
  state.ours = query.has("ours") ? readIds(query.get("ours"), limit) : (getSelectedPlan(state)?.bans ?? []).slice(0, limit);
  state.theirs = readIds(query.get("theirs"), limit);
  if (state.format === "split") state.theirs = state.theirs.filter(id => !state.ours.includes(id));
  state.moves = (query.get("draft") ?? "").split(",").filter(Boolean).slice(0, 14).map(token => {
    const [id, lane, extra] = token.split(".");
    return { id: extra !== undefined ? "" : id, lane: /^[0-4]$/.test(lane ?? "") ? Number(lane) : lane === undefined ? null : -1 };
  });
  return state;
}

export function makeSearch(state) {
  const query = new URLSearchParams();
  if (state.side === "red") query.set("side", "red");
  if (state.opponent !== "a") query.set("vs", state.opponent);
  if (state.format === "split") query.set("format", "split");
  if (state.swap) query.set("roles", "swap");
  if (state.planIndex) query.set("plan", String(state.planIndex));
  const defaultOurs = (getSelectedPlan(state)?.bans ?? []).slice(0, limitFor(state));
  if (state.ours.join(",") !== defaultOurs.join(",")) query.set("ours", state.ours.join(","));
  if (state.theirs.length) query.set("theirs", state.theirs.join(","));
  if (state.moves.length) query.set("draft", state.moves.map(({ id, lane }) => id + (lane === null ? "" : "." + lane)).join(","));
  return query.toString();
}
