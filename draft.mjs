export const VERSION = "16.23.1";

export const names = {
  Alistar: "알리스타", Ambessa: "암베사", Amumu: "아무무", Briar: "브라이어",
  Caitlyn: "케이틀린", Camille: "카밀", Ekko: "에코", Ezreal: "이즈리얼",
  Galio: "갈리오", Gangplank: "갱플랭크", Irelia: "이렐리아", Janna: "잔나",
  Jax: "잭스", Jayce: "제이스", Jinx: "징크스", Kaisa: "카이사", Karma: "카르마",
  Kassadin: "카사딘", Kayle: "케일", LeeSin: "리 신", Leona: "레오나", Lillia: "릴리아",
  Lulu: "룰루", Lux: "럭스", Malphite: "말파이트", Malzahar: "말자하", MissFortune: "미스 포츈",
  MonkeyKing: "오공", Mordekaiser: "모데카이저", Morgana: "모르가나", Nautilus: "노틸러스",
  Nocturne: "녹턴", Olaf: "올라프", Orianna: "오리아나", Pantheon: "판테온",
  Rakan: "라칸", Rell: "렐", Ryze: "라이즈", Sejuani: "세주아니", Shaco: "샤코",
  Smolder: "스몰더", Swain: "스웨인", Sylas: "사일러스", Syndra: "신드라",
  Thresh: "쓰레쉬", Vayne: "베인", Vex: "벡스", Vi: "바이", Viktor: "빅토르",
  Vladimir: "블라디미르", Xayah: "자야", XinZhao: "신 짜오", Yasuo: "야스오",
  Yone: "요네", Zac: "자크",
};

export const targets = ["Jinx", "Yasuo", "Jayce", "Nocturne", "Yone", "Caitlyn"];
export const supports = ["Leona", "Rell", "Nautilus", "Alistar", "Thresh"];
export const selectable = [...targets, ...supports];
const standardBans = ["Leona", "Rell"];

export const presets = [
  { id: "base", label: "기본", bans: standardBans },
  { id: "carry-jg", label: "징크스·녹턴", bans: [...standardBans, "Jinx", "Nocturne"] },
  { id: "four", label: "주력 4장", bans: [...standardBans, "Jinx", "Yasuo", "Jayce", "Nocturne"] },
  { id: "support", label: "서폿 5장", bans: [...supports, "Jinx", "Nocturne"] },
  { id: "mid", label: "야스오·요네", bans: [...standardBans, "Yasuo", "Yone"] },
  { id: "double-lane", label: "미드·원딜 4장", bans: [...standardBans, "Yasuo", "Yone", "Jinx", "Caitlyn"] },
];

export const lanes = ["탑", "정글", "미드", "원딜", "서폿"];

const watches = {
  a: {
    blue: [["Swain", "Zac", "Malphite"], ["Janna", "Lillia"]],
    red: [["Swain", "Zac", "Janna"], ["Malphite", "Lillia"]],
    note: "애 러 원딜 스웨인 13경기, mcrtpr 서폿 잔나 30경기·노틸러스 8경기. 민욱혜진이 정글이고 캐치캐치가 미드라면 자크나 릴리아 자리를 에코로 바꿀 수 있습니다.",
  },
  b: {
    both: [["Syndra", "Morgana", "Amumu"], ["Ryze", "Malphite"]],
    note: "신안산선 정글 모르가나 22경기·아무무 17경기, 홍차 미드 신드라 16경기. 상대가 쓰레쉬를 1세트에 가져가면 다음 세트 서폿은 룰루를 확인하세요.",
  },
  d: {
    both: [["Kayle", "Xayah", "Ezreal"], ["Morgana", "Lux"]],
    note: "수르롱 원딜 이즈리얼 13경기·자야 8경기, 토스화이팅 서폿 럭스 29경기, YUDABIN 탑 케일 5경기. 상대 서폿이 일찍 확정되면 2차 밴에 카밀·말자하를 검토하세요. [모름] 준원의 챔프폭은 확인되지 않았습니다.",
  },
};

export const opponents = [{ id: "none", label: "미정" }, { id: "a", label: "A팀" }, { id: "b", label: "B팀" }, { id: "d", label: "D팀" }];

export function getWatch(opponent, side) {
  const watch = Object.hasOwn(watches, opponent) ? watches[opponent] : null;
  if (!watch) return null;
  const [first, second] = watch.both ?? watch[side];
  return { first, second, note: watch.note };
}

const topPool = ["Jayce", "Ambessa", "Olaf", "Gangplank", "Jax", "Camille"];
const junglePool = ["Nocturne", "Sejuani", "MonkeyKing", "LeeSin", "Briar", "XinZhao"];
const devAdc = ["Jinx", "Caitlyn", "Vayne", "Ezreal", "Kaisa", "Smolder"];
const supportPool = ["Leona", "Nautilus", "Rell", "Alistar", "Thresh", "Lulu", "Rakan", "Karma"];

export function getDraft(blocked, side, opponent) {
  const watch = getWatch(opponent, side);
  const unavailable = new Set([...blocked, ...(watch?.first ?? []), ...(watch?.second ?? [])]);

  function take(preferred, pool = []) {
    const id = [...preferred, ...pool].find(candidate => !unavailable.has(candidate));
    if (!id) return null;
    unavailable.add(id);
    return id;
  }

  return [0, 1, 2].map(index => {
    const top = take([topPool[index]], topPool);
    const jungle = take([junglePool[index]], junglePool);
    const swap = index === 2 && ["Yasuo", "Yone"].some(id => !unavailable.has(id));
    const hyoMid = [
      ["Sylas", "Ekko", "Viktor", "Orianna"],
      ["Viktor", "Orianna", "Ekko", "Kassadin", "Galio"],
      ["Orianna", "Ekko", "Galio", "Kassadin", "Viktor"],
    ][index];
    const middle = swap ? take(["Yasuo", "Yone"]) : take(hyoMid);
    const adcPriority = [
      ["Jinx", "Caitlyn"],
      ["Caitlyn", "Vayne", "Ezreal", "Kaisa"],
      ["Smolder", "Ezreal", "Vayne", "Kaisa"],
    ][index];
    const bottom = swap
      ? take(middle === "Yasuo" ? ["MissFortune", "Kaisa", "Ezreal"] : ["Kaisa", "MissFortune", "Ezreal"])
      : take(adcPriority, devAdc);
    const supportPriority = [supportPool, ["Thresh", "Lulu", "Rakan", "Karma"], ["Lulu", "Rakan", "Karma"]][index];
    const support = take(supportPriority, supportPool);

    const players = ["탑가는 경문이", "검은살치살", swap ? "DevJoon" : "효준", swap ? "효준" : "DevJoon", "mqz"];
    const picks = [top, jungle, middle, bottom, support].map((id, lane) => ({ id, lane, player: players[lane] }));
    return { picks, swap, note: getFightNote({ middle, jungle, bottom, support }) };
  });
}

function getFightNote({ middle, jungle, bottom, support }) {
  if (middle === "Yasuo") {
    if (jungle === "MonkeyKing") return "오공이 띄운 적에게 야스오가 궁을 잇고, 미스 포츈이 닿는 거리에서 교전합니다.";
    if (jungle === "LeeSin") return "리 신이 띄운 대상에 야스오가 합류합니다. 미스 포츈이 따라갈 수 있는 각에서 시작합니다.";
    return "야스오가 연결할 띄우기와 원딜이 따라갈 거리가 확보되면 교전합니다.";
  }
  if (middle === "Yone") return "요네가 측면에서 합류할 각을 보고, 정글과 서폿이 만든 교전에 카이사가 이어갑니다.";
  if (support === "Lulu" || support === "Karma") return "정글이 먼저 교전을 열고 서폿은 원딜이 공격할 공간을 지킵니다.";
  if (bottom === "Caitlyn") return "정글이나 서폿이 묶은 대상에 케이틀린이 덫을 놓고, 목표물 앞 입구를 장악합니다.";
  if (jungle === "Nocturne") return "서폿이 연 대상에 녹턴이 합류합니다. 원딜이 바로 공격할 수 있는 거리를 확인합니다.";
  if (bottom === "Vayne") return "베인이 안전하게 때릴 수 있는 앞라인부터 공격하고, 미드는 진입하는 상대를 견제합니다.";
  return "정글과 서폿이 진입 시점을 맞추고, 미드와 원딜이 따라갈 수 있는 거리에서 시작합니다.";
}

export function getFirstPicks(lineup, side, blocked) {
  const support = lineup.picks[4].id;
  const fragileSupport = ["Lulu", "Karma", "Rakan"].includes(support);
  const jungleContested = blocked.has("Nocturne") && fragileSupport;
  const priority = jungleContested ? [1, 3, 4] : fragileSupport ? [3, 4, 1] : [4, 3, 1];
  return {
    picks: priority.map(lane => lineup.picks[lane]),
    note: side === "red"
      ? "R5는 상대 탑이 보인 뒤 매치업에 쓰세요. 정글 대체가 한 장이면 첫 두 픽으로 당깁니다."
      : "B1 이후 상대 픽을 보고 B2·B3를 확정하세요. 정글 후보가 한 장이면 B1을 정글에 씁니다.",
  };
}

export function readState(search) {
  const query = new URLSearchParams(search);
  const side = query.get("side") === "red" ? "red" : "blue";
  const opponent = opponents.some(option => option.id === query.get("vs")) ? query.get("vs") : "none";
  const selected = query.has("off") ? query.get("off").split(",") : presets[0].bans;
  const blocked = new Set(selectable.filter(id => selected.includes(id)));
  return { side, opponent, blocked };
}

export function makeSearch({ side, opponent, blocked }) {
  const query = new URLSearchParams();
  if (side !== "blue") query.set("side", side);
  if (opponent !== "none") query.set("vs", opponent);
  const chosen = selectable.filter(id => blocked.has(id));
  if (chosen.length !== standardBans.length || !standardBans.every(id => blocked.has(id))) {
    query.set("off", chosen.join(","));
  }
  return query.toString();
}
