import { VERSION, names, targets, supports, presets, lanes, opponents, getWatch, getDraft, getFirstPicks, readState, makeSearch } from "./draft.mjs?v=2";
import { adviceForCross, championMenu, friendlyPool, getCross, openingExamples, phaseSteps, planForCross, readMoves, writeMoves } from "./cross.mjs";
import { roster } from "./roster.mjs";

const state = readState(location.search);
const currentQuery = new URLSearchParams(location.search);
state.moves = readMoves(currentQuery.get("draft"));
state.extra = new Set((currentQuery.get("initial") ?? "").split(",").filter(id => Object.hasOwn(roster, id)).slice(0, 10));
state.useWatch = currentQuery.get("watch") !== "off";
const byId = id => document.getElementById(id);
const shareStatus = byId("share-status");
const sideOptions = [{ id: "blue", label: "블루" }, { id: "red", label: "레드" }];

function element(tag, className, content) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (content !== undefined) item.textContent = content;
  return item;
}

function portrait(id) {
  const picture = element("span", "portrait", roster[id]?.slice(0, 1) ?? "–");
  picture.setAttribute("aria-hidden", "true");
  if (id) {
    const img = element("img");
    img.alt = "";
    img.decoding = "async";
    img.src = "https://ddragon.leagueoflegends.com/cdn/" + VERSION + "/img/champion/" + id + ".png";
    img.addEventListener("error", () => img.remove(), { once: true });
    picture.append(img);
  }
  return picture;
}

function toggleButton(label, className, handler) {
  const button = element("button", className, label);
  button.type = "button";
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    handler();
    shareStatus.textContent = "";
    render();
  });
  return button;
}

function installChampionControls(container, choices) {
  return choices.map(id => {
    const button = toggleButton(undefined, "champ-toggle", () => {
      if (state.blocked.has(id)) state.blocked.delete(id);
      else state.blocked.add(id);
    });
    button.dataset.champion = id;
    button.append(portrait(id), element("span", "", names[id]));
    container.append(button);
    return { id, button };
  });
}

function installOptions(container, choices, stateKey) {
  return choices.map(({ id, label }) => {
    const button = toggleButton(label, "", () => {
      if (state[stateKey] !== id) {
        resetMoves("진영 또는 상대가 바뀌어 픽 순서를 초기화했습니다.");
        state[stateKey] = id;
      }
    });
    button.dataset[stateKey] = id;
    container.append(button);
    return { id, button };
  });
}

const champButtons = [
  ...installChampionControls(byId("target-controls"), targets),
  ...installChampionControls(byId("support-controls"), supports),
];
const sideButtons = installOptions(byId("side-controls"), sideOptions, "side");
const opponentButtons = installOptions(byId("opponent-controls"), opponents, "opponent");
const presetButtons = presets.map(preset => {
  const button = toggleButton(preset.label, "button preset", () => {
    resetMoves("밴 예시를 바꿔 픽 순서를 초기화했습니다.");
    state.blocked = new Set(preset.bans);
  });
  button.dataset.preset = preset.id;
  byId("presets").append(button);
  return { ...preset, button };
});

function renderOrder(lineup) {
  const { picks, note } = getFirstPicks(lineup, state.side, state.blocked);
  const prefix = state.side === "blue" ? "B" : "R";
  const order = element("ol", "pick-order");
  picks.forEach(({ id, lane }, i) => {
    const row = element("li");
    row.append(
      element("span", state.side === "red" ? "slot red" : "slot", prefix + (i + 1)),
      element("strong", "", names[id] ?? "가용 카드 확인"),
      element("span", "lane-name", lanes[lane]),
    );
    order.append(row);
  });
  byId("first-picks").replaceChildren(order);
  byId("pick-note").textContent = note;
}

function renderLineups(draft) {
  const cards = draft.map(({ picks, swap, note }, index) => {
    const card = element("article", "panel lineup");
    const header = element("header");
    header.append(
      element("h3", "", (index + 1) + "세트"),
      element("span", "", swap ? "미드·원딜 교대" : "기본 포지션"),
    );
    const list = element("ul");
    picks.forEach(({ id, lane, player }) => {
      const row = element("li");
      row.dataset.champion = id ?? "";
      const copy = element("div", "pick-copy");
      copy.append(element("strong", "", names[id] ?? "가용 카드 확인"), element("small", "", player));
      row.append(portrait(id), element("span", "lane-name", lanes[lane]), copy);
      list.append(row);
    });
    card.append(header, list, element("p", "lineup-note", note));
    return card;
  });
  byId("plan").replaceChildren(...cards);
}

function renderWatch() {
  const panel = byId("opponent-bans");
  const watch = getWatch(state.opponent, state.side);
  panel.classList.toggle("no-opponent", !watch);
  if (!watch) {
    panel.replaceChildren(element("p", "muted", "A·B·D팀 중 하나를 선택하면 상대별 밴 5개를 표시합니다."));
    return;
  }

  const groups = [watch.first, watch.second].map((bans, phase) => {
    const group = element("div", "ban-group");
    const list = element("ul", "ban-list");
    bans.forEach(id => {
      const row = element("li", "ban-item");
      row.append(portrait(id), element("span", "", names[id]));
      list.append(row);
    });
    group.append(element("h3", "", (phase + 1) + "차 밴"), list);
    return group;
  });
  panel.replaceChildren(...groups, element("p", "opponent-note", watch.note));
}

const draftStatus = byId("draft-status");

function resetMoves(message) {
  if (state.moves.length) draftStatus.textContent = message;
  state.moves = [];
}

function recordMove(move) {
  const candidate = [...state.moves, move];
  if (getCross(state, candidate).played.length !== candidate.length) return;
  state.moves = candidate;
  draftStatus.textContent = "";
  shareStatus.textContent = "";
  render();
}

function addOption(select, value, label) {
  const option = element("option", "", label);
  option.value = value;
  select.append(option);
}

function championPicker({ submitLabel, choices, initial, submit, lanesToPick = [], initialLane }) {
  const box = element("div", "direct-picker");
  const filter = element("input");
  filter.type = "search";
  filter.placeholder = "예: 노틸러스";
  const searchLabel = element("label", "", "챔피언 검색");
  searchLabel.append(filter);
  const picker = element("select");
  const champLabel = element("label", "", "챔피언");
  champLabel.append(picker);
  const action = element("button", "button button-outline", submitLabel);
  action.type = "button";
  const role = element("select");
  let selected = initial;

  if (lanesToPick.length) {
    lanesToPick.forEach(lane => addOption(role, String(lane), lanes[lane]));
    role.value = String(initialLane ?? lanesToPick[0]);
    const roleLabel = element("label", "", "우리 포지션");
    roleLabel.append(role);
    box.append(roleLabel);
  }

  function laneValue() {
    return lanesToPick.length ? Number(role.value) : null;
  }

  function fill() {
    const query = filter.value.trim().toLowerCase().replaceAll(" ", "");
    const available = choices(laneValue()).filter(id =>
      !query || roster[id].replaceAll(" ", "").includes(query) || id.toLowerCase().includes(query),
    );
    picker.replaceChildren();
    addOption(picker, "", "챔피언 선택");
    available.forEach(id => addOption(picker, id, roster[id]));
    if (available.includes(selected)) picker.value = selected;
    else if (query && available.length === 1) picker.value = available[0];
    action.disabled = !picker.value;
    picker.disabled = available.length === 0;
  }

  picker.addEventListener("change", () => {
    selected = picker.value;
    action.disabled = !selected;
  });
  filter.addEventListener("input", fill);
  role.addEventListener("change", fill);
  action.addEventListener("click", () => { if (picker.value) submit({ id: picker.value, lane: laneValue() }); });
  filter.addEventListener("keydown", event => {
    if (event.key === "Enter" && !action.disabled) {
      event.preventDefault();
      action.click();
    }
  });
  box.append(searchLabel, champLabel, action);
  fill();
  return box;
}

function renderRoadmap(board) {
  let index = 0;
  const groups = phaseSteps.map(phase => {
    const section = element("div", "roadmap-phase");
    const list = element("ol", "phase-slots");
    for (const step of phase.steps) {
      const move = board.played[index++];
      const row = element("li", "turn-slot" + (step.side === "red" ? " red" : "") + (step.kind === "ban" ? " is-ban" : ""));
      row.dataset.slot = step.slot;
      if (board.step?.slot === step.slot) row.setAttribute("aria-current", "step");
      row.append(element("span", "", step.label), element("strong", "", move ? roster[move.id] : "·"));
      list.append(row);
    }
    section.append(element("span", "phase-label", phase.label), list);
    return section;
  });
  byId("draft-roadmap").replaceChildren(...groups);
}

function renderCross(board, live) {
  const red = state.side === "red";
  const indicator = byId("cross-side");
  indicator.textContent = red ? "우리 레드 · 상대 B1" : "우리 블루 · 우리 B1";
  indicator.classList.toggle("red", red);
  byId("undo-move").disabled = !state.moves.length;
  byId("reset-moves").disabled = !state.moves.length;
  byId("apply-watch").checked = state.useWatch;
  byId("apply-watch").disabled = !!state.moves.length;

  const extraPicker = byId("extra-bans-picker");
  if (state.moves.length) {
    extraPicker.replaceChildren(element("p", "small muted", "1차 밴을 바꾸려면 픽 순서를 초기화하세요."));
  } else {
    extraPicker.replaceChildren(championPicker({
      submitLabel: "1차 밴 추가",
      choices: () => state.extra.size < 10 ? championMenu.filter(id => !board.unavailable.has(id)) : [],
      submit: ({ id }) => { state.extra.add(id); render(); },
    }));
  }
  byId("extra-bans").replaceChildren(...[...state.extra].map(id => {
    const remove = toggleButton(roster[id] + " 제거", "button preset", () => { state.extra.delete(id); });
    remove.disabled = !!state.moves.length;
    return remove;
  }));

  renderRoadmap(board);
  const panel = byId("draft-action");
  const { step } = board;
  if (!step) {
    panel.replaceChildren(element("h3", "", "1세트 밴픽 기록 완료"),
      element("p", "small muted", "기록한 양 팀 픽과 밴을 제외하고 2·3세트 후보를 아래에 표시했습니다."));
    return;
  }

  const friendly = step.side === state.side;
  const friendlyPick = friendly && step.kind === "pick";
  const advice = adviceForCross(state, board, live);
  const head = element("h3", "", (friendly ? "우리 " : "상대 ") + step.label + (step.kind === "pick" ? " 픽" : ""));
  const description = element("p", "small muted", (friendly ? "[추정] " : "") + advice.reason);
  const content = [head, description];

  if (advice.options.length) {
    const options = element("ol", "draft-options");
    advice.options.forEach(({ id, lane }, index) => {
      const item = element("li");
      if (!index || step.kind === "ban") {
        const button = element("button", "draft-pick-button");
        button.type = "button";
        button.dataset.quickPick = id;
        button.append(portrait(id), element("span", "", roster[id] + (lane === null ? " 밴" : " · " + lanes[lane])));
        button.addEventListener("click", () => recordMove({ id, lane }));
        item.append(button);
      } else {
        item.className = "draft-option";
        item.append(portrait(id), element("span", "", "다음 " + roster[id] + " · " + lanes[lane]));
      }
      options.append(item);
    });
    content.push(options);
  }

  if (step.slot === "B1" && !friendly) {
    const quick = element("div", "cross-toolbar");
    openingExamples.filter(({ id }) => !board.unavailable.has(id)).forEach(({ id }) => {
      const button = element("button", "button preset", roster[id]);
      button.type = "button";
      button.dataset.enemyPick = id;
      button.addEventListener("click", () => recordMove({ id, lane: null }));
      quick.append(button);
    });
    if (quick.childElementCount) content.push(quick);
  }

  const openRoles = friendlyPick ? lanes.map((_, lane) => lane).filter(lane =>
    !board.locks[lane] && friendlyPool[lane].some(id => !board.unavailable.has(id)),
  ) : [];
  if (!friendlyPick || openRoles.length) {
    content.push(championPicker({
      submitLabel: step.kind === "pick" ? "픽 기록" : "밴 기록",
      lanesToPick: openRoles,
      initialLane: advice.options[0]?.lane,
      initial: advice.options[0]?.id,
      choices: lane => (lane === null ? championMenu : friendlyPool[lane]).filter(id => !board.unavailable.has(id)),
      submit: recordMove,
    }));
  } else {
    content.push(element("p", "small muted", "남은 포지션의 준비 카드가 모두 소모됐습니다. 포지션 또는 이전 픽을 되돌려 다른 조합을 확인하세요."));
  }
  panel.replaceChildren(...content);
}

function installOpeningCases() {
  const container = byId("opening-cases");
  for (const { id, response, next } of openingExamples) {
    const button = element("button", "panel case-button");
    button.type = "button";
    button.dataset.openingCase = id;
    const head = element("span", "case-head");
    head.append(portrait(id), element("span", "", "상대 B1 " + roster[id]));
    button.append(head, element("span", "case-response", "R1·R2 " + response), element("span", "small muted", next));
    button.addEventListener("click", () => {
      state.side = "red";
      state.blocked = new Set(presets[0].bans.filter(banned => banned !== id));
      state.extra.clear();
      state.moves = [{ id, lane: null }];
      draftStatus.textContent = "상대 B1 " + roster[id] + " 예시를 적용했습니다.";
      render();
      byId("draft-action").querySelector("h3").setAttribute("tabindex", "-1");
      byId("draft-action").querySelector("h3").focus();
    });
    container.append(button);
  }
}

byId("undo-move").addEventListener("click", () => {
  state.moves.pop();
  draftStatus.textContent = "";
  render();
});
byId("reset-moves").addEventListener("click", () => {
  resetMoves("픽 순서를 처음부터 다시 확인합니다.");
  render();
});
byId("apply-watch").addEventListener("change", event => {
  state.useWatch = event.target.checked;
  render();
});
installOpeningCases();

function render() {
  const board = getCross(state);
  if (state.moves.length !== board.played.length) {
    state.moves = board.played;
    draftStatus.textContent = "현재 밴과 충돌한 기록부터 다시 입력할 수 있습니다.";
  }
  const recorded = new Set(board.played.map(({ id }) => id));
  champButtons.forEach(({ id, button }) => {
    button.setAttribute("aria-pressed", String(state.blocked.has(id)));
    button.disabled = recorded.has(id);
    button.title = button.disabled ? "이미 이번 밴픽 순서에 기록된 챔피언" : "";
  });
  sideButtons.forEach(({ id, button }) => button.setAttribute("aria-pressed", String(state.side === id)));
  opponentButtons.forEach(({ id, button }) => button.setAttribute("aria-pressed", String(state.opponent === id)));
  presetButtons.forEach(({ bans, button }) => {
    const selected = bans.length === state.blocked.size && bans.every(id => state.blocked.has(id));
    button.setAttribute("aria-pressed", String(selected));
  });

  const live = planForCross(state, board);
  const draft = state.moves.length || state.extra.size || !state.useWatch ? live.rounds : getDraft(state.blocked, state.side, state.opponent);
  const selected = [...state.blocked].map(id => names[id]);
  byId("selection-status").textContent = selected.length ? "사용 불가 " + selected.length + "장 · " + selected.join(" · ") : "사용 불가로 선택한 챔피언이 없습니다.";
  if (state.moves.length) {
    byId("first-picks").replaceChildren(element("p", "small muted", "교차 픽에 입력한 상대 선택을 반영하고 있습니다."));
    byId("pick-note").textContent = board.step ? "아래 순서표에서 다음 턴을 확인하세요." : "1세트 밴픽을 모두 기록했습니다.";
  } else {
    renderOrder(draft[0]);
  }
  renderCross(board, live);
  renderLineups(draft);
  renderWatch();

  const query = new URLSearchParams(makeSearch(state));
  if (state.moves.length) query.set("draft", writeMoves(state.moves));
  if (state.extra.size) query.set("initial", [...state.extra].join(","));
  if (!state.useWatch) query.set("watch", "off");
  const nextUrl = new URL(location.href);
  nextUrl.search = query;
  if (nextUrl.href !== location.href) history.replaceState(null, "", nextUrl);
}

byId("share").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.hash = state.moves.length ? "cross-draft" : "simulator";
  try {
    await navigator.clipboard.writeText(url.href);
    shareStatus.textContent = "현재 밴·픽 기록과 진영이 담긴 링크를 복사했습니다.";
  } catch {
    const field = element("input", "share-field");
    field.type = "url";
    field.readOnly = true;
    field.value = url.href;
    field.setAttribute("aria-label", "공유 링크");
    shareStatus.replaceChildren(field);
    field.select();
    field.focus();
  }
});

render();
