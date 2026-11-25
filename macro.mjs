import { roster } from "./roster.mjs";

export const routeOptions = [
  { id: "auto", label: "조합 기본" },
  { id: "bot", label: "미드·바텀 우선" },
  { id: "top", label: "탑·미드 우선" },
];

const blueRoute = ["파랑 버프", "두꺼비", "늑대", "칼날부리", "빨강 버프", "돌거북"];
const redRoute = ["빨강 버프", "돌거북", "칼날부리", "늑대", "두꺼비", "파랑 버프"];

export const jungleProfiles = {
  Nocturne: {
    plan: "첫 바퀴는 6캠을 기본으로 두고 궁까지 경험치를 지킵니다. 첫 궁은 아군이 이미 때릴 수 있는 대상이나 확실한 역갱에 씁니다.",
    games: "칼날부리 195 · 파랑 164 · 빨강 103경기",
    source: "nocturne",
  },
  Sejuani: {
    plan: "기본은 6캠입니다. 가까운 근접 아군이 CC를 잇고 웨이브도 괜찮을 때만 먼저 빠집니다. 보호형 서폿이면 강가에서 앞을 보는 역할을 맡습니다.",
    games: "파랑 175 · 빨강 118 · 칼날부리 26경기",
    source: "sejuani",
  },
  MonkeyKing: {
    plan: "첫 바퀴는 캠프와 라인 합류를 맞춥니다. 6레벨부터는 미드·서폿이 이어갈 수 있는 측면에서 회전격을 쓰고, 야스오가 닿는지를 먼저 콜합니다.",
    games: "파랑 466 · 빨강 363 · 칼날부리 196경기",
    source: "monkeyking",
  },
  LeeSin: {
    plan: "갱 호응과 퇴로가 확실하면 가까운 세 캠프 뒤 갱·역갱을 비교합니다. 상대 웨이브가 포탑으로 들어갔거나 우리 라인이 움직일 수 없으면 6캠을 이어갑니다.",
    games: "칼날부리 1,698 · 파랑 369 · 빨강 289경기",
    source: "leesin",
    short: true,
  },
  Briar: {
    plan: "캠프부터 정리하고 아군 호응을 확인합니다. 시야 밖이나 포탑 쪽에 광분을 열기 전에 E와 퇴로를 확인하고, 궁 적중 전 아군 도착 여부를 콜합니다.",
    games: "칼날부리 242 · 파랑 143 · 빨강 87경기",
    source: "briar",
  },
  XinZhao: {
    plan: "가까운 라인의 웨이브와 CC가 맞으면 3캠 뒤 짧은 갱·역갱을 봅니다. 강가 좁은 곳에 오래 남기보다 아군이 먼저 움직이는 쪽으로 정리합니다.",
    games: "파랑 294 · 빨강 268 · 칼날부리 161경기",
    source: "xinzhao",
    short: true,
  },
};

const defaults = {
  control: ["bot", "바텀을 밀 수 있을 때 포탑 압박과 첫 용 시야를 연결합니다."],
  protection: ["bot", "원딜 성장과 역갱을 우선합니다. 바텀이 움직일 수 없으면 용 앞 싸움을 미룹니다."],
  airborne: ["top", "탑·미드가 먼저 합류할 수 있는 쪽을 봅니다. 띄우기 조합의 본격 교전은 궁이 갖춰진 뒤입니다."],
  poke: ["bot", "이즈리얼이 바텀 웨이브를 정리하고 합류할 수 있으면 용 쪽 시야를 선점합니다."],
  pick: ["bot", "바텀 CC와 미드 합류를 같이 보기 쉽습니다. 탑·미드의 웨이브가 더 좋으면 위로 끝냅니다."],
};

export function routesFor(target) {
  return ["blue", "red"].map(side => {
    const topStartsBlue = side === "blue";
    const startFromTop = target === "bot";
    const fromBlueCamp = topStartsBlue === startFromTop;
    const camps = fromBlueCamp ? blueRoute : redRoute;
    const earlyCamps = fromBlueCamp ? redRoute.slice(0, 3) : blueRoute.slice(0, 3);
    return { side, camps, earlyCamps, start: startFromTop ? "탑 쪽 출발" : "바텀 쪽 출발" };
  });
}

function laneOrders(plan, target, style) {
  const [top, jungle, mid, carry, support] = plan.picks.map(pick => pick.id);
  const spill = target === "top" ? "탑 강가를 먼저 봅니다." : "바텀 강가를 먼저 봅니다.";
  const topLine = top === "Jayce"
    ? "웨이브를 넣을 수 있을 때 포킹과 강가 시야를 연결합니다. 상대 정글 미확인이면 시야 없이 더 깊이 밀지 않습니다."
    : ["Jax", "Camille", "Olaf"].includes(top)
      ? "웨이브를 밀고 먼저 이동할지 콜합니다. 이후 사이드를 맡을 땐 텔과 복귀 경로를 확인하고 오브젝트 전에 합류합니다."
      : "큰 웨이브가 들어오면 먼저 라인을 받고 합류 시간을 알립니다. 탑 쪽 출발이면 상대 이동기와 갱 호응도 콜합니다.";
  const midLine = ["Viktor", "Orianna"].includes(mid)
    ? "웨이브를 정리한 뒤 강가 입구를 먼저 막습니다. 양옆 시야가 끊기면 혼자 먼저 내려가지 않습니다."
    : ["Yasuo", "Yone", "Irelia"].includes(mid)
      ? "선푸시가 될 때만 강가에 붙습니다. 궁 연계와 원딜 합류가 준비된 뒤 들어가고, 미드가 갇히면 먼저 못 간다고 콜합니다."
      : "미드 웨이브와 상대 이동을 먼저 콜하고 정글과 같은 입구로 들어갑니다. 상대 미드가 먼저 나가면 인원수에 반영합니다.";
  const botLine = carry === "Caitlyn"
    ? "적 정글 위치가 확인됐을 때만 웨이브를 깊게 밀고 시야를 붙입니다. 용 쪽 입구에서 아군 CC에 덫을 이을 거리를 잡습니다."
    : style === "protection" || ["Jinx", "Vayne", "Smolder"].includes(carry)
      ? "첫 귀환과 큰 웨이브 수급을 챙깁니다. 서폿이 시야를 나갈 때 웨이브를 안전하게 받고, 싸움이 열리면 닿는 앞라인부터 때립니다."
      : "웨이브를 정리하고 아군 시야 쪽으로 이동합니다. 먼저 진입한 우리 정글에게 거리상 바로 도착할 수 있는지 콜합니다.";
  const supportLine = ["Lulu", "Karma", "Thresh"].includes(support)
    ? "정글과 함께 강가 입구부터 확인합니다. 원딜이 혼자 남는 로밍은 웨이브가 안전할 때만 하고, 보호 스킬을 상대 첫 진입에 남깁니다."
    : "원딜 웨이브가 안전하거나 같이 움직일 수 있을 때 정글과 시야를 잡습니다. CC를 열기 전에 우리 원딜과 미드가 닿는지 콜합니다.";
  const jungleLine = (jungleProfiles[jungle]?.plan ?? "준비된 정글을 확인하고 인접 라인의 합류에 맞춥니다.") + " " + spill;
  const planTop = target === "top"
    ? " 첫 위 강가에 붙을 수 있는지는 정글 3캠 시점에 알려줍니다."
    : " 정글이 아래로 끝나면 탑 강가 싸움은 혼자 열지 않습니다.";
  const planMid = target === "top" ? " 첫 이동은 위 강가를 봅니다." : " 첫 이동은 아래 강가를 봅니다.";
  const planBot = target === "top"
    ? " 정글이 위에 있으면 상대 정글이 보일 때까지 강가 밖에서 긴 교전을 피합니다."
    : " 정글이 아래에 도착하기 전에 먼저 밀 수 있는지 알려줍니다.";
  return [topLine + planTop, jungleLine, midLine + planMid, botLine + planBot, supportLine].map((text, lane) => ({
    lane, player: plan.picks[lane].player, champion: roster[plan.picks[lane].id], text,
  }));
}

export function getMacro(state, plan, report, preference) {
  const [defaultTarget, reason] = defaults[report.style] ?? defaults.pick;
  const target = preference === "top" || preference === "bot" ? preference : defaultTarget;
  const routeReason = target === defaultTarget ? reason : target === "top"
    ? "실제 탑·미드가 먼저 도착할 수 있다면 위 강가에서 캠프·갱·역갱을 연결합니다."
    : "실제 미드·바텀이 먼저 도착할 수 있다면 아래 강가의 갱·역갱과 시야를 연결합니다.";
  return {
    target, routeReason,
    routes: routesFor(target).map(route => ({ ...route, current: route.side === state.side })),
    jungler: jungleProfiles[plan.picks[1].id],
    lines: laneOrders(plan, target, report.style),
  };
}

export const objectives = [
  {
    id: "scuttle", label: "바위 게", timer: "첫 2:55", side: "위·아래 강가", early: true,
    prepare: "첫 바퀴가 끝나기 전, 인접 두 라인에 먼저 움직일 수 있는지 묻습니다. 상대 정글이 안 보이면 같은 쪽 경쟁을 열어 둡니다.",
    start: "정글 체력과 인접 라인 도착이 맞으면 칩니다. 적 정글과 인접 라이너가 같이 오면 먼저 빠질 길을 잡습니다.",
    trade: "반대 바위 게가 열리고 이동이 안전하면 전환합니다. 둘 다 힘들면 귀환이나 살아 있는 아군 캠프를 선택합니다.",
  },
  {
    id: "dragon", label: "원소 용", timer: "첫 5:00", side: "미드·바텀 쪽",
    prepare: "미드·바텀 웨이브와 서폿·정글 귀환을 먼저 맞춥니다. 적 정글과 서폿의 마지막 확인, 우리 강타를 따로 콜합니다.",
    start: "인원, 시야, 합류로와 강타를 확인합니다. 상대가 영혼을 완성할 용이면 단순 교환과 방어 준비를 따로 비교합니다.",
    trade: "일반 스택이면 위 캠프나 이미 열려 있는 유충·전령, 또는 안전한 포탑을 비교합니다. 영혼 용은 아래 위험 옵션에서 따로 판단합니다.",
  },
  {
    id: "grubs", label: "공허 유충", timer: "첫 8:00", side: "탑·미드 쪽",
    prepare: "탑과 미드가 먼저 합류 가능한지 확인합니다. 바텀 서폿이 올라간다면 원딜 웨이브와 상대 서폿 움직임도 같이 봅니다.",
    start: "복귀해야 하는 웨이브가 있으면 먼저 한 마리나 확보 가능한 수만 콜합니다. 상대가 합류하면 세 마리를 고집하지 않습니다.",
    trade: "용이 열려 있고 바텀·미드 합류가 먼저라면 용을 검토합니다. 아니면 안전한 웨이브·포탑을 챙깁니다.",
  },
  {
    id: "herald", label: "전령", timer: "첫 15:00", side: "탑·미드 쪽",
    prepare: "먹기 전에 어느 라인에 전령을 쓸지 정합니다. 우리 웨이브가 있고 아군이 따라올 수 있는 포탑을 우선합니다.",
    start: "위쪽 시야와 합류를 확인하고 칩니다. 획득 뒤 웨이브가 도착할 때 풀어 포탑·공간으로 전환합니다.",
    trade: "아래 시야·용·반대 포탑 중 확실한 이득을 선택합니다. 영혼 스택을 내주는지 먼저 확인합니다.",
  },
  {
    id: "baron", label: "바론", timer: "첫 20:00", side: "탑·미드 쪽",
    prepare: "미드·사이드 웨이브, 상대 텔레포트와 부활, 우리 딜러 체력과 강타를 체크합니다. 한 명이 상대 진입을 볼 역할을 맡습니다.",
    start: "적 정글 접근이 차단되고 다 때릴 필요가 없는 포지션을 정한 뒤 칩니다. 적이 붙으면 끝낼지 돌아서 싸울지 정글이 한 번에 콜합니다.",
    trade: "바론을 막을 여지가 있으면 원거리 확인으로 시간을 법니다. 교환이라면 상대가 돌아오기 전에 확보할 수 있는 포탑·용만 콜합니다.",
  },
  {
    id: "elder", label: "장로", timer: "영혼 획득 뒤", side: "미드·바텀 쪽", urgent: true,
    prepare: "영혼 획득 후 게임 타이머로 시간을 맞춥니다. 집 타이밍을 먼저 겹치고, 포탑을 지킬 웨이브와 강가 시야를 같이 준비합니다.",
    start: "강타와 맞춰 넣을 피해를 콜합니다. 시야 없이 한 명씩 들어가기보다 같이 접근해 상대 정글을 밀거나 먼저 싸울 각을 봅니다.",
    trade: "장로는 일반 교환 공식을 쓰기 어렵습니다. 진입이 불가능하면 안전한 시야·본진 웨이브부터 지키고 아군이 모일 시간과 경로를 확보합니다.",
  },
];

export const objectiveCalls = [
  { time: "60초 전", task: "목표와 반대편 대안을 정합니다. 정글은 강타, 서폿은 와드·스위퍼, 각 라인은 귀환과 웨이브를 콜합니다." },
  { time: "30초 전", task: "미드와 인접 라인이 먼저 밀 수 있는지 확인합니다. 정글·서폿이 붙어서 입구와 퇴로를 보며 혼자 시야를 열지 않습니다." },
  { time: "15초 전", task: "우리 도착 수, 확인한 적, 추가로 올 수 있는 적을 셉니다. 상대 정글 위치와 텔레포트·부활, 우리 강타를 다시 확인합니다." },
  { time: "치기 직전", task: "정글이 시작·보류·교환 중 하나를 콜합니다. 시야, 인원, 체력·궁, 강타가 바뀌면 현재 판단을 중단하고 다시 콜합니다." },
];

export const trackingCalls = [
  { when: "초반 캠프가 열리기 전", owner: "본 사람", text: "침입·와드에 보인 쪽만 콜합니다. 라인에 늦게 도착했다는 단서는 추정으로 남깁니다." },
  { when: "우리 3캠 뒤와 첫 강가 진입 전", owner: "정글 + 인접 라인", text: "마지막 시각과 방향을 갱신하고 각 라인이 먼저 움직일 수 있는지 묻습니다. 예상 동선으로 역갱을 확정하지 않습니다." },
  { when: "갱·강가·귀환으로 새로 보일 때", owner: "본 사람 즉시", text: "핑과 함께 시각·위치·방향을 말합니다. 귀환이나 반대편 이동이 가능해진 뒤에는 이전 확인을 현재 위치로 반복하지 않습니다." },
  { when: "오브젝트 30초·15초 전과 첫 공격 전", owner: "정글 요약 · 서폿 시야 · 각 라인 도착", text: "확인이 끊겼으면 적 정글 미확인으로 갱신합니다. 순간이동이나 부활 뒤 실제 도착할 수 있는 적을 최대 인원에 포함합니다." },
];

export function assessObjective(objective, snapshot) {
  const { allies, enemy, possible, location, vision, priority, smite, finish, zone, trade, critical } = snapshot;
  const counts = [allies, enemy, possible];
  if (!counts.every(n => Number.isInteger(n) && n >= 0 && n <= 5)) {
    return { status: "hold", label: "인원부터 확인", message: "도착 가능한 우리, 확인된 적, 추가 합류 가능한 적을 입력하세요." };
  }
  const maximum = enemy + possible;
  if (maximum > 5) return { status: "hold", label: "중복 인원 확인", message: "확인한 적과 추가 합류 후보를 중복 없이 세면 최대 5명입니다." };
  if ((location === "near" && enemy === 0) || (location === "unknown" && possible === 0)) {
    return { status: "hold", label: "적 정글을 인원에 반영", message: "접근 가능한 적 정글은 확인된 적 또는 추가 합류 인원에 포함합니다." };
  }
  const numbers = "우리 " + allies + "명 · 적 확인 " + enemy + "명 · 최대 " + maximum + "명. ";
  if (!allies || allies < enemy) {
    if (objective.urgent || critical) {
      return { status: "hold", label: "같이 접근해 방어 준비", message: numbers + "초기 인원이 부족합니다. 한 명씩 진입하지 말고 아군이 모일 입구와 시간을 확보하세요." };
    }
    return trade
      ? { status: "trade", label: "반대편 교환 검토", message: numbers + "같은 자리에서 붙기 어렵습니다. 이미 확인한 반대편 확정 이득을 보세요." }
      : { status: "hold", label: "보류", message: numbers + "인원이 부족하고 확정 교환이 없습니다. 안전한 웨이브와 귀환을 봅니다." };
  }
  if (allies <= maximum) {
    return { status: "hold", label: "합류 확인 후 재판단", message: numbers + "상대의 추가 합류까지 들어오면 수적 우위가 없습니다. 먼저 들어오는 적을 보거나 아군을 기다리세요." };
  }
  const missing = [
    !vision && "입구·퇴로 시야",
    !priority && "인접 라인 합류",
    !smite && (!objective.early || maximum > 0) && "우리 강타",
    !finish && !objective.early && "처치에 필요한 피해와 시간",
  ].filter(Boolean);
  if (missing.length) return { status: "hold", label: "준비 보류", message: numbers + missing.join(" · ") + " 확인이 필요합니다." };
  if (location !== "away" && !zone) {
    return { status: "hold", label: "적 정글 진입부터 확인", message: numbers + "맞강타 전에 적 정글을 확인하거나 진입로를 차단하세요." };
  }
  return { status: "go", label: "시작 가능", message: numbers + "현재 입력 기준입니다. 인원이나 진입로가 바뀌면 바로 멈추고 다시 콜하세요." };
}
