import { firstPools, getDraft, getWatch, lanes } from "./draft.mjs?v=2";
import { roster } from "./roster.mjs";

const pick = (slot, side) => ({ slot, side, kind: "pick", label: slot });
const ban = (slot, side, number) => ({ slot, side, kind: "ban", label: (side === "red" ? "R" : "B") + " 밴 " + number });

export const phaseSteps = [
  {
    label: "1차 픽",
    steps: [pick("B1", "blue"), pick("R1", "red"), pick("R2", "red"), pick("B2", "blue"), pick("B3", "blue"), pick("R3", "red")],
  },
  {
    label: "2차 밴",
    steps: [ban("RB4", "red", 4), ban("BB4", "blue", 4), ban("RB5", "red", 5), ban("BB5", "blue", 5)],
  },
  { label: "2차 픽", steps: [pick("R4", "red"), pick("B4", "blue"), pick("B5", "blue"), pick("R5", "red")] },
];
export const steps = phaseSteps.flatMap(phase => phase.steps);

export const openingExamples = [
  { id: "Nautilus", response: "징크스·세주아니", next: "룰루를 R3 후보로 둡니다. 징크스와 앞라인을 먼저 잡아 B2·B3 정글 선점을 막습니다." },
  { id: "Leona", response: "노틸러스·징크스", next: "레오나가 빠져도 노틸러스가 열려 있으면 바텀부터 확보하고 R3 녹턴을 봅니다." },
  { id: "Jinx", response: "노틸러스·케이틀린", next: "녹턴을 R3로 보되, 상대가 B2·B3에서 녹턴을 가져가면 세주아니로 바꿉니다." },
  { id: "Nocturne", response: "세주아니·노틸러스", next: "정글과 서폿을 먼저 확보합니다. 징크스가 R3 전에 빠지면 케이틀린을 확인합니다." },
  { id: "Jayce", response: "노틸러스·징크스", next: "제이스의 포지션을 열어 두고, 탑이 보이면 R5에서 암베사·올라프 등 매치업을 봅니다." },
  { id: "Yasuo", response: "노틸러스·징크스", next: "1세트 바텀과 정글 순서는 유지하고, 3세트 미드는 요네 또는 효준의 마법 피해 챔피언을 봅니다." },
];

export const friendlyPool = firstPools;
export const championMenu = Object.keys(roster).sort((a, b) => roster[a].localeCompare(roster[b], "ko"));
const supportThreats = new Set(["Nautilus", "Leona", "Rell"]);
const jungleThreats = new Set(["Nocturne", "Sejuani", "MonkeyKing"]);
const carryThreats = new Set(["Jinx", "Caitlyn"]);
const banAlternatives = {
  a: ["Ekko", "Vex", "Mordekaiser", "Pantheon", "Lillia"],
  b: ["Vex", "Vladimir", "Vi", "Briar", "Shaco"],
  d: ["Camille", "Malzahar", "Mordekaiser", "Lux", "Morgana"],
};

export function getCross(state, moves = state.moves) {
  const watch = getWatch(state.opponent, state.side);
  const unavailable = new Set([...state.blocked, ...state.extra, ...(state.useWatch ? watch?.first ?? [] : [])]);
  const enemy = [];
  const locks = Array(lanes.length).fill(null);
  const played = [];

  for (const move of moves.slice(0, steps.length)) {
    const step = steps[played.length];
    if (!Object.hasOwn(roster, move.id) || unavailable.has(move.id)) break;
    const friendlyPick = step.kind === "pick" && step.side === state.side;
    if (friendlyPick) {
      if (!firstPools[move.lane]?.includes(move.id) || locks[move.lane]) break;
      locks[move.lane] = move.id;
    } else if (move.lane !== null) {
      break;
    } else if (step.kind === "pick") {
      enemy.push(move.id);
    }
    unavailable.add(move.id);
    played.push(move);
  }

  return { watch, unavailable, enemy, locks, played, step: steps[played.length] };
}

const openLane = (board, lane) => !board.locks[lane] && firstPools[lane].some(id => !board.unavailable.has(id));

export function planForCross(state, board) {
  const { enemy, locks, unavailable } = board;
  const enemyHasSupport = enemy.some(id => supportThreats.has(id));
  const primarySupportOpen = [...supportThreats].some(id => !unavailable.has(id));
  const jinxOpen = !unavailable.has("Jinx") || locks[3] === "Jinx";
  const luluOpen = locks[4] === "Lulu" || (!locks[4] && !unavailable.has("Lulu"));
  const peelPlan = enemyHasSupport && !primarySupportOpen && jinxOpen && luluOpen;
  const preferred = peelPlan ? { 1: ["Sejuani", "MonkeyKing"], 4: ["Lulu"] } : {};
  return { peelPlan, rounds: getDraft(unavailable, state.side, state.opponent, { locks, preferred }) };
}

export function adviceForCross(state, board, livePlan) {
  const { step, enemy, locks, unavailable, played } = board;
  if (!step) return { options: [], reason: "양 팀 픽을 모두 기록했습니다. 2·3세트 예시는 이번 기록을 반영합니다." };
  if (step.side !== state.side) {
    const reason = step.kind === "ban"
      ? "상대가 이번에 밴한 챔피언을 기록하면 다음 픽에서 제외합니다."
      : "상대가 확정한 챔피언을 기록하세요. 픽 순서만으로 상대 포지션을 단정하지 않습니다.";
    return { options: [], reason };
  }

  if (step.kind === "ban") {
    const planned = new Set(livePlan.rounds.flatMap(round => round.picks.map(({ id }) => id)));
    const suggested = [...(board.watch?.second ?? []), ...(banAlternatives[state.opponent] ?? [])];
    const options = [...new Set(suggested)].filter(id => !unavailable.has(id) && !planned.has(id)).slice(0, 2);
    return {
      options: options.map(id => ({ id, lane: null })),
      reason: options.length
        ? "상대가 아직 확정하지 않은 포지션을 봅니다. 상대가 드러낸 역할에 따라 후보를 바꿔 고를 수 있습니다."
        : "상대가 아직 확정하지 않은 포지션의 후보 중, 우리 다음 세트에 필요한 카드를 피해서 고르세요.",
    };
  }

  const { peelPlan, rounds } = livePlan;
  const defaultPriority = [4, 3, 1, 2, 0];
  const firstEnemy = enemy[0];
  const enemyTookJungle = enemy.some(id => jungleThreats.has(id));
  const enemyTookCarry = enemy.some(id => carryThreats.has(id));
  const enemyTookSupport = enemy.some(id => supportThreats.has(id));
  const supportPlan = rounds[0].picks[4].id;
  let priority = defaultPriority;
  let reason = "서폿·원딜·정글 중 남은 주력 카드부터 잡습니다. 상대 픽이 들어오면 다음 순서를 다시 봅니다.";

  if (step.slot === "B1") {
    const protectionSupport = ["Lulu", "Karma", "Rakan"].includes(supportPlan);
    if (protectionSupport) {
      priority = [1, 3, 4, 2, 0];
      reason = "주력 이니시 서폿이 소모됐습니다. 정글 앞라인을 먼저 확보하고 서폿이 원딜을 지키게 합니다.";
    } else {
      reason = "노틸러스나 열린 주력 서폿을 선점합니다. 정글 후보가 사실상 한 장이면 정글을 먼저 가져갈 수 있습니다.";
    }
  } else if (step.slot === "R5") {
    priority = [0, 2, 1, 3, 4];
    reason = "마지막에 남겨둔 포지션을 상대 조합에 맞춥니다. 탑이 남았다면 확인된 상대 탑을 보고 암베사·올라프 등 열린 카드를 비교합니다.";
  } else if (["R4", "B4", "B5"].includes(step.slot)) {
    priority = step.slot === "R4" && openLane(board, 2) ? [2, 0, 1, 3, 4] : defaultPriority;
    reason = step.slot === "R4"
      ? "2차 밴을 반영해 미드 등 남은 필수 픽을 잡고, 가능한 경우 탑 매치업을 R5까지 남깁니다."
      : "2차 밴 이후 남은 두 포지션을 채웁니다. 이 순서 뒤에 상대 R5가 남아 있습니다.";
  } else if (peelPlan) {
    priority = [3, 1, 4, 2, 0];
    reason = "징크스와 앞라인 정글을 먼저 확보합니다. 룰루는 원딜 보호를 맡고, 상대가 먼저 가져가면 남은 서폿으로 바꿉니다.";
  } else if (state.side === "red" && ["R1", "R2"].includes(step.slot) && jungleThreats.has(firstEnemy)) {
    priority = [1, 4, 3, 2, 0];
    reason = "상대 선픽으로 정글 주력 카드가 빠졌습니다. 열린 정글과 서폿부터 확보하고 R3의 원딜 대안을 남깁니다.";
  } else if (enemyTookJungle && enemyTookCarry) {
    priority = [1, 3, 4, 2, 0];
    reason = "상대가 정글과 원딜 주력 카드를 가져갔습니다. 남은 정글·원딜을 먼저 잠그고 템포를 맞춥니다.";
  } else if (enemyTookCarry) {
    reason = "상대가 원딜을 선점했습니다. 우리 서폿과 케이틀린 등 남은 원딜을 연결하고, 정글은 상대 다음 픽을 본 뒤 다시 확인합니다.";
  } else if (enemyTookSupport) {
    reason = "상대가 주력 서폿을 선점했습니다. 열린 주력 서폿을 먼저 확인하고 바텀과 정글의 교전 방식을 맞춥니다.";
  }

  const next = steps[played.length + 1];
  const pair = next?.side === state.side && next.kind === "pick";
  const options = priority.filter(lane => !locks[lane] && rounds[0].picks[lane].id)
    .slice(0, pair ? 2 : 1).map(lane => ({ id: rounds[0].picks[lane].id, lane }));
  return { options, reason };
}

export function readMoves(value) {
  if (!value) return [];
  return value.split(",").slice(0, steps.length).map(item => {
    const [id, lane, extra] = item.split(".");
    return { id: extra !== undefined ? "" : id, lane: /^[0-4]$/.test(lane ?? "") ? Number(lane) : lane === undefined ? null : -1 };
  });
}

export function writeMoves(moves) {
  return moves.map(({ id, lane }) => id + (lane === null ? "" : "." + lane)).join(",");
}
