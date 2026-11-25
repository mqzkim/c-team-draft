import { compositionStats } from "./composition-stats.mjs";
import { roster } from "./roster.mjs";

const initiators = {
  Nautilus: "노틸러스 폭뢰", Leona: "레오나 흑점 폭발", Rell: "렐 W·R",
  Alistar: "알리스타 W·Q", Rakan: "라칸 R·W", Thresh: "쓰레쉬 사형 선고",
  Sejuani: "세주아니 빙하 감옥", MonkeyKing: "오공 회전격",
  LeeSin: "리 신 용의 분노", Yone: "요네 운명봉인",
};
const airborne = new Set(["MonkeyKing", "Nautilus", "Alistar", "Rell", "Rakan", "Lulu", "LeeSin"]);
const tanks = new Set(["Sejuani", "Leona", "Nautilus", "Alistar", "Rell"]);
const magicMids = new Set(["Sylas", "Ekko", "Viktor", "Orianna", "Kassadin", "Galio"]);
const protectSupports = new Set(["Lulu", "Karma", "Thresh", "Alistar", "Rakan"]);
const diveThreats = new Set(["Malphite", "Amumu", "Zac", "Rell", "Rakan", "MonkeyKing", "Vi", "Nocturne", "Yone"]);
const pokeThreats = new Set(["Jayce", "Ezreal", "Xerath", "Zoe", "Lux", "Hwei", "Varus"]);

function attackProfile(jungle, middle, carry, support, top) {
  const airborneAlly = [jungle, support].find(id => airborne.has(id));
  if (middle === "Yasuo" && airborneAlly) return "airborne";
  if (carry === "Caitlyn" && (initiators[support] || initiators[jungle])) return "control";
  if (["Jinx", "Vayne", "Smolder"].includes(carry) && protectSupports.has(support)) return "protection";
  if (top === "Jayce" && carry === "Ezreal") return "poke";
  return "pick";
}

function getPlanText({ style, jungle, middle, carry, support, top, starter }) {
  const ad = roster[carry] ?? "원딜";
  const start = starter ?? "상대가 들어오는 타이밍";
  const early = carry === "Caitlyn"
    ? "바텀이 먼저 밀 수 있고 정글 위치를 확인했다면 포탑 앞에서 웨이브를 압박합니다. 억지 다이브보다 덫과 라인 복귀 시간을 활용하세요."
    : carry === "Vayne"
      ? "상대 사거리가 더 길면 짧은 교환과 웨이브 수급을 우선합니다. 서폿과 따로 전진하는 상황을 피하세요."
      : "바텀·미드가 먼저 움직일 수 있을 때 정글과 강가에 합류합니다. 우선권이 없으면 첫 교전에 늦게 진입할 각보다 안전한 웨이브를 챙기세요.";

  const later = ["Jinx", "Vayne", "Smolder"].includes(carry)
    ? ad + "의 주요 아이템이 갖춰지고 아군이 앞에서 시간을 벌 수 있을 때 정면에서 지속딜을 냅니다."
    : "아이템이 갖춰진 뒤에는 오브젝트 앞 입구부터 잡고, 시야 밖으로 혼자 추격하지 않습니다.";

  switch (style) {
    case "airborne": {
      const ally = [jungle, support].find(id => airborne.has(id));
      const trigger = initiators[ally] ?? "룰루 급성장";
      const self = ally === "Lulu" ? "상대가 원딜 쪽으로 들어왔을 때 " : "";
      return {
        title: "띄우기에서 궁극기로 연결",
        summary: trigger + "의 띄우기에 야스오 궁을 잇습니다. " + (carry === "MissFortune"
          ? "미스 포츈이 함께 공격할 수 있는 각이 가장 중요합니다."
          : ad + "가 합류할 수 있는 거리에서 교전을 엽니다."),
        early,
        window: self + "띄우기와 야스오 궁이 둘 다 준비되고 원딜이 닿을 때 교전합니다. 띄운 대상이 너무 멀면 궁을 보류합니다.",
        later,
        teamfight: "먼저 띄우고 누가 따라갈 수 있는지 콜합니다. 띄우기와 아군 피해가 한 대상에 이어질 때 시작하세요.",
        call: "“띄운다. 원딜 각 있으면 궁.”",
      };
    }
    case "control":
      return {
        title: "덫과 CC로 오브젝트 입구 장악",
        summary: "케이틀린의 긴 사거리와 덫이 강점입니다. " + (middle === "Viktor" ? "빅토르 중력장도 같은 입구에 겹칠 수 있습니다." : "아군 CC가 먼저 적중하면 덫을 연결할 거리가 생깁니다."),
        early,
        window: start + "로 묶거나 상대 이동 경로를 좁힐 수 있을 때 싸웁니다. 멀리 찍은 CC보다 케이틀린이 덫을 놓을 수 있는 대상을 택합니다.",
        later: "용·바론 앞에 먼저 도착해 들어올 길을 막습니다. 늦게 도착해 덫 없이 들어가야 하면 다른 길이나 다음 기회를 봅니다.",
        teamfight: "탱커가 입구를 막고 케이틀린은 덫이 닿는 거리에서 따라갑니다. 적 진입이 남아 있으면 투망과 시야를 남깁니다.",
        call: "“입구에 덫 먼저. 묶인 대상부터.”",
      };
    case "protection":
      return {
        title: "원딜을 지키며 앞라인부터",
        summary: ad + "가 공격할 시간을 만들면 힘이 납니다. 정글·탑이 앞을 보고 서폿은 상대가 원딜에게 닿는 순간을 대비합니다.",
        early,
        window: "우리 궁으로 한 번에 열 각이 없으면 상대 첫 진입을 받아칩니다. 앞라인이 시간을 벌 때 " + ad + "가 사거리 안의 적부터 공격합니다.",
        later,
        teamfight: carry === "Jinx"
          ? "징크스가 때릴 수 있는 앞라인부터 처리합니다. 징크스 패시브가 발동한 뒤에도 적 측면과 보호 스킬을 확인하고 추격하세요."
          : ad + "가 안전하게 공격할 수 있는 대상을 먼저 봅니다. 보호 스킬을 앞에서 다 쓰면 측면 진입에 취약해집니다.",
        call: "“서폿은 원딜 쪽. 앞라인부터.”",
      };
    case "poke":
      return {
        title: "포킹으로 체력을 빼고 진입",
        summary: "제이스·이즈리얼이 거리에서 상대 체력을 깎을 수 있습니다. 용·바론 앞 시야와 뒤로 빠질 길이 있을 때 유리합니다.",
        early,
        window: (starter ? starter + "가 있어도 " : "") + "한두 차례 견제 뒤, 상대 체력이나 이동기가 빠졌을 때만 각을 봅니다.",
        later: "오브젝트 입구를 먼저 밟고 포킹 거리를 유지합니다. 상대가 먼저 자리 잡았거나 측면이 비면 먼 거리에서 길을 다시 확보하세요.",
        teamfight: "진입보다 견제와 퇴로 확보를 앞에 둡니다. 상대 돌진 거리를 넘을 때는 옆 진입이 보이는지 확인합니다.",
        call: "“옆 시야부터. 피 빼고 들어가.”",
      };
    default:
      return {
        title: "한 명을 먼저 묶어 인원 우위",
        summary: starter
          ? start + "가 있는 상태에서 아군이 바로 따라갈 수 있는 대상을 잡습니다."
          : "확실한 선공 수단이 적습니다. 시야를 잡고 상대가 먼저 들어오는 순간에 피해를 모으세요.",
        early,
        window: jungle === "Nocturne" && starter
          ? start + " 적중 뒤에 녹턴 궁으로 합류합니다. 미드·원딜이 따라올 수 있을 때만 깊게 진입하세요."
          : "정글·서폿의 첫 교전 도구와 아군 딜러의 합류가 겹칠 때 강합니다.",
        later,
        teamfight: (top === "Jayce" ? "제이스가 먼저 견제할 시간이 있으면 씁니다. " : "")
          + "사거리 안의 첫 대상에 스킬을 모은 뒤, 상대 측면이 보이고 다음 핵심 스킬이 있을 때만 추격합니다.",
        call: "“묶인 한 명. 딜 각 없으면 빠져.”",
      };
  }
}

function getRisks(board, picks) {
  const [top, jungle, middle, carry, support] = picks;
  const names = ids => ids.filter(Boolean).map(id => roster[id]).join(" · ");
  const risks = [];
  if (![top, jungle, support].some(id => tanks.has(id))) {
    risks.push("버티는 앞라인이 얇습니다. 긴 정면 교전보다 먼저 시야를 잡거나 측면에서 짧게 싸우세요.");
  } else if (![top, jungle].some(id => tanks.has(id))) {
    risks.push("앞라인을 서폿에 많이 기대는 조합입니다. 서폿이 들어갈 때 원딜을 지킬 정글·탑 위치를 미리 정하세요.");
  }
  if (middle && !magicMids.has(middle)) {
    risks.push("주력 피해가 물리에 기울 수 있습니다. 상대가 방어력을 올리면 원딜 빌드와 효준의 마법 피해 미드 후보를 확인하세요.");
  }
  if (board.enemy.includes("Morgana")) {
    risks.push("상대 모르가나가 보입니다. 칠흑의 방패가 걸린 대상에 첫 CC를 몰기 전에 다른 대상이나 방패가 빠진 뒤를 봅니다.");
  } else if (board.enemy.includes("Janna")) {
    risks.push("상대 잔나가 보입니다. 밀어내기와 회오리가 남아 있으면 한 번에 깊게 들어가기보다 첫 스킬을 빼고 다음 진입을 봅니다.");
  }
  const dive = board.enemy.filter(id => diveThreats.has(id));
  const poke = board.enemy.filter(id => pokeThreats.has(id));
  if (dive.length) risks.push(names(dive) + "의 진입을 확인하기 전 원딜과 서폿이 겹쳐 서지 않습니다.");
  if (poke.length >= 2) risks.push("상대 원거리 견제 후보가 여러 장입니다. 좁은 입구에서 체력이 깎이기 전에 자리부터 잡거나 다른 진입각을 봅니다.");
  if (carry === "Vayne") risks.push("베인은 가까운 대상에 공격을 이어갈 공간이 필요합니다. 상대 장거리 견제와 측면 시야에 주의하세요.");
  return risks;
}

function openAlternative(board, plan) {
  const { picks } = plan;
  if (!board.locks[4] && picks[3].id === "Jinx" && !protectSupports.has(picks[4].id)
      && !board.unavailable.has("Lulu") && (picks[1].id === "Sejuani" || (!board.locks[1] && !board.unavailable.has("Sejuani")))) {
    return "상대가 원딜을 집중적으로 노리면 세주아니·룰루를 묶어 앞라인과 징크스 보호를 보강할 수 있습니다.";
  }
  if (!board.locks[4] && picks[3].id === "Caitlyn" && !initiators[picks[4].id]) {
    const option = ["Nautilus", "Thresh", "Alistar"].find(id => !board.unavailable.has(id));
    if (option) return roster[option] + "가 열려 있다면 케이틀린 덫을 잇는 CC를 보강할 수 있습니다.";
  }
  return null;
}

function sample(container, key) {
  return key ? container[key] ?? [0, 0] : [0, 0];
}

const pairs = [["바텀 듀오", "bottom", 3, 4], ["정글·서폿", "frontline", 1, 4], ["정글·미드", "midJungle", 1, 2]];

export function evaluateComposition(state, board, plan) {
  const picks = plan.picks.map(({ id }) => id);
  const [top, jungle, middle, carry, support] = picks;
  const style = attackProfile(jungle, middle, carry, support, top);
  const opener = (["Lulu", "Karma"].includes(support) ? initiators[jungle] : initiators[support] ?? initiators[jungle]) ?? initiators[middle];
  const ally = style === "airborne" ? [jungle, support].find(id => airborne.has(id)) : null;
  const starter = ally ? (initiators[ally] ?? "룰루 급성장으로 받아치기") : opener;
  const side = [top, middle].find(id => ["Jax", "Camille", "Yone", "Irelia"].includes(id));
  const mode = state.swap ? "swap" : "base";
  const complete = picks.every(Boolean);
  const text = getPlanText({ style, jungle, middle, carry, support, top, starter });
  const exactKey = complete ? picks.join("|") : null;
  const evidence = pairs.map(([title, label, left, right]) => {
    const ids = [picks[left], picks[right]];
    const key = ids.every(Boolean) ? ids.join("|") : null;
    const group = compositionStats.pairs[mode][label];
    return {
      title,
      name: ids.filter(Boolean).map(id => roster[id]).join(" · "),
      all: sample(group.all, key),
      team: sample(group.team, key),
      ranked: label === "bottom" ? sample(compositionStats.ranked.bottom, key) : null,
    };
  });

  return {
    style,
    title: text.title,
    summary: text.summary,
    timing: [
      { label: "초반 라인전", text: text.early },
      { label: "주요 궁극기 이후", text: text.window },
      { label: "아이템 전환 이후", text: text.later },
    ],
    teamfight: text.teamfight,
    call: text.call,
    risks: getRisks(board, picks),
    alternate: openAlternative(board, plan),
    signals: [
      { label: "선공 수단", value: starter ?? "상대 진입에 대응" },
      { label: "마법 피해 축", value: magicMids.has(middle) ? roster[middle] + " 미드" : "빌드·조합 확인" },
      { label: "사이드 운영", value: side ? roster[side] + "가 밀고 합류" : "웨이브 정리 후 먼저 합류" },
    ],
    complete,
    locked: plan.picks.filter(({ locked }) => locked).length,
    evidence,
    exact: { all: sample(compositionStats.exact[mode].all, exactKey), team: sample(compositionStats.exact[mode].team, exactKey) },
    comfort: picks.map((id, lane) => sample(compositionStats.comfort[mode][lane], id)[1]),
  };
}

export function formatSample([wins, n]) {
  if (!n) return "관측 0경기";
  const count = wins + "승 " + (n - wins) + "패 · " + n + "경기";
  if (n < 10) return count + " · 소표본";
  return (wins * 100 / n).toFixed(1) + "% · " + count;
}
