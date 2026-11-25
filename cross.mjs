import { getPlans, getSelectedPlan, lanes, playersFor, poolsFor } from "./draft.mjs?v=3";
import { roster } from "./roster.mjs";

const pick = (slot, side) => ({ slot, side, kind: "pick", label: slot });
const ban = (slot, side, number) => ({ slot, side, kind: "ban", label: (side === "red" ? "R" : "B") + " 밴 " + number });

const early = [pick("B1", "blue"), pick("R1", "red"), pick("R2", "red"), pick("B2", "blue"), pick("B3", "blue"), pick("R3", "red")];
const late = [pick("R4", "red"), pick("B4", "blue"), pick("B5", "blue"), pick("R5", "red")];
const secondBans = [ban("RB4", "red", 4), ban("BB4", "blue", 4), ban("RB5", "red", 5), ban("BB5", "blue", 5)];

export function phasesFor(format) {
  if (format === "split") {
    return [{ label: "1차 픽", steps: early }, { label: "2차 밴", steps: secondBans }, { label: "2차 픽", steps: late }];
  }
  return [{ label: "블루 선픽", steps: early.slice(0, 1) }, { label: "첫 교환", steps: early.slice(1, 5) },
    { label: "마무리", steps: [early[5], ...late] }];
}

export const openerIds = ["Nautilus", "Leona", "Jinx", "Nocturne", "Sejuani", "Jayce", "Yasuo"];
const primarySupport = ["Leona", "Nautilus", "Rell"];
const jungleTargets = ["Nocturne", "Sejuani", "MonkeyKing", "LeeSin"];
const adcTargets = ["Jinx", "Caitlyn"];
const protection = ["Lulu", "Karma", "Rakan"];

export function getBoard(state, moves = state.moves) {
  const phases = phasesFor(state.format);
  const steps = phases.flatMap(phase => phase.steps);
  const unavailable = new Set([...state.ours, ...state.theirs]);
  const pool = poolsFor(state);
  const locks = Array(lanes.length).fill(null);
  const enemy = [];
  const played = [];

  for (const move of moves.slice(0, steps.length)) {
    const step = steps[played.length];
    if (!Object.hasOwn(roster, move.id) || unavailable.has(move.id)) break;
    if (step.kind === "pick" && step.side === state.side) {
      if (!pool[move.lane]?.includes(move.id) || locks[move.lane]) break;
      locks[move.lane] = move.id;
    } else if (move.lane !== null) {
      break;
    } else if (step.kind === "pick") {
      enemy.push(move.id);
    }
    unavailable.add(move.id);
    played.push(move);
  }
  return { phases, steps, played, unavailable, enemy, locks, pool, step: steps[played.length] };
}

function wasTaken(ids, board) {
  return board.enemy.some(id => ids.includes(id));
}

function stillOpen(ids, board) {
  return ids.some(id => !board.unavailable.has(id));
}

export function planFor(state, board) {
  const { locks, unavailable, pool } = board;
  const supportStolen = wasTaken(primarySupport, board) && !stillOpen(primarySupport, board);
  const luluFits = !state.swap && (!locks[3] || locks[3] === "Jinx" || locks[3] === "Vayne")
    && (locks[3] || !unavailable.has("Jinx") || unavailable.has("Caitlyn"));
  const luluOpen = locks[4] === "Lulu" || (!locks[4] && !unavailable.has("Lulu"));
  const preferLulu = luluFits && supportStolen && luluOpen;
  const support = locks[4] || (preferLulu ? "Lulu" : pool[4].find(id => !unavailable.has(id)));
  const frontLine = protection.includes(support);
  const yasuo = state.swap && (locks[2] === "Yasuo" || (!locks[2] && !unavailable.has("Yasuo")));
  const junglePref = yasuo ? ["MonkeyKing", ...pool[1]] : frontLine ? ["Sejuani", "MonkeyKing", ...pool[1]] : pool[1];
  const players = playersFor(state);
  const reserved = new Set(unavailable);

  const picks = pool.map((choices, lane) => {
    const preference = lane === 1 ? junglePref : lane === 4 && support ? [support, ...choices] : choices;
    const id = locks[lane] || preference.find(option => !reserved.has(option));
    if (id) reserved.add(id);
    return { lane, id, player: players[lane], locked: !!locks[lane] };
  });
  return { picks, preferLulu, frontLine };
}

const slotsBeforeMid = ["B1", "R1", "R2", "B2", "B3", "R3"];

export function adviceFor(state, board, plan) {
  const { step, enemy, locks, played, pool } = board;
  if (!step) return { options: [], note: "이번 경기의 선택이 끝났습니다. 다음 경기에서는 모든 챔피언이 다시 열립니다." };
  if (step.side !== state.side) {
    return { options: [], note: step.kind === "ban"
      ? "상대 2차 밴을 기록하면 이후 후보에서 즉시 제외합니다."
      : "상대가 가져간 챔피언을 기록하세요. 픽 순서만으로 상대 포지션을 단정하지 않습니다." };
  }

  if (step.kind === "ban") {
    const preferred = getSelectedPlan(state)?.bans.slice(3) ?? [];
    const alternates = getPlans(state).flatMap(entry => entry.bans);
    const ours = new Set(plan.picks.map(({ id }) => id));
    const options = [...new Set([...preferred, ...alternates])].filter(id => !board.unavailable.has(id) && !ours.has(id)).slice(0, 2)
      .map(id => ({ id, lane: null }));
    return { options, note: "상대가 아직 공개하지 않은 포지션을 견제하세요. 확정된 픽과 우리 조합 후보는 추천에서 제외합니다." };
  }

  const general = [4, 3, 1, 2, 0];
  const enemyJungle = wasTaken(jungleTargets, board);
  const enemyAdc = wasTaken(adcTargets, board);
  let priority = general;
  let note = "서폿·원딜·정글 중 앞으로 상대가 가져갈 수 있는 카드부터 확보합니다.";

  if (step.slot === "B1") {
    const needJungle = plan.frontLine || !stillOpen(["Nocturne", "Sejuani"], board);
    const contestedNocturne = state.opponent === "b" && state.planIndex === 1 && !board.unavailable.has("Nocturne")
      && primarySupport.filter(id => !board.unavailable.has(id)).length >= 2;
    if (needJungle || contestedNocturne) {
      priority = [1, 4, 3, 2, 0];
      note = contestedNocturne
        ? "서폿 후보가 둘 이상 열렸습니다. 신안산선과 겹치는 녹턴을 먼저 확보하고 서폿을 후속 픽으로 남깁니다."
        : "정글 쪽 선택지가 줄었습니다. 남은 앞라인·교전 카드를 먼저 잡고 서폿과 원딜을 연결합니다.";
    } else {
      note = "레오나나 노틸러스 등 열린 주력 서폿을 먼저 봅니다. 상대 R1·R2 뒤에 B2·B3 방향을 바꿀 수 있습니다.";
    }
  } else if (step.slot === "R5") {
    priority = [0, 2, 1, 3, 4];
    note = "남은 포지션을 상대 조합에 맞춥니다. 탑을 남겼다면 확인된 상대 탑을 보고 암베사·올라프 등 열린 후보를 비교하세요.";
  } else if (!slotsBeforeMid.includes(step.slot)) {
    priority = step.slot === "R4" && !locks[2] ? [2, 0, 1, 3, 4] : general;
    note = step.slot === "R4" ? "남은 급한 라인을 채우고, 가능하면 탑을 R5까지 남깁니다."
      : "남은 두 포지션을 채우고 상대의 마지막 R5 카운터를 고려합니다.";
  } else if (plan.preferLulu) {
    priority = [3, 1, 4, 2, 0];
    note = "상대가 주력 서폿을 가져갔습니다. 징크스 계열 원딜과 정글 앞라인을 먼저 확보하고, 룰루 보호를 이어 봅니다.";
  } else if (["R1", "R2"].includes(step.slot) && jungleTargets.includes(enemy[0])) {
    priority = [1, 4, 3, 2, 0];
    note = "상대 B1이 정글 후보라면 남은 정글과 주력 서폿을 우선합니다. 원딜은 징크스와 케이틀린 두 장을 확인합니다.";
  } else if (enemyJungle && enemyAdc) {
    priority = [1, 3, 4, 2, 0];
    note = "상대가 정글·원딜 후보를 동시에 선점했습니다. 세주아니와 케이틀린 등 두 포지션의 대안을 먼저 확보합니다.";
  } else if (enemyAdc) {
    note = "상대가 원딜 후보를 먼저 가져갔습니다. 열린 서폿과 케이틀린·베인 등 남은 원딜의 구성을 확인합니다.";
  } else if (enemyJungle && locks[4]) {
    priority = [1, 3, 4, 2, 0];
    note = "우리 서폿은 확보했습니다. 상대가 가져간 정글 후보보다 남은 정글 대안을 앞에 둡니다.";
  }

  const next = board.steps[played.length + 1];
  const paired = next?.side === state.side && next.kind === "pick";
  const options = priority.filter(lane => !locks[lane] && plan.picks[lane].id && pool[lane].length)
    .slice(0, paired ? 2 : 1).map(lane => plan.picks[lane]);
  return { options, note };
}

export function lineupNote(state, plan) {
  const [, jungle, middle, carry, support] = plan.picks.map(({ id }) => id);
  if (plan.picks.some(pick => !pick.id)) return "준비한 후보가 소진된 라인입니다. 포지션 교대나 다른 준비 카드가 필요한지 확인하세요.";
  if (state.swap && middle === "Yasuo" && jungle === "MonkeyKing") return "오공이 띄운 적에게 야스오가 이어갑니다. 미스 포츈 등 원딜이 합류할 수 있는 거리에서 시작합니다.";
  if (protection.includes(support)) return "정글과 탑이 먼저 교전 각을 만들고, 서폿은 원딜이 공격할 공간을 지킵니다.";
  if (carry === "Caitlyn") return "앞라인이 묶은 대상에 케이틀린 덫을 연결합니다. 목표물 앞 입구를 먼저 확보하세요.";
  if (carry === "Vayne") return "베인이 가까운 상대부터 안전하게 공격할 수 있도록, 서폿이 상대 다이브에 대응합니다.";
  return "정글과 서폿이 교전 시점을 맞추고, 원딜이 따라올 거리에서 시작합니다.";
}
