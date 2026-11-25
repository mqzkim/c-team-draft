import { VERSION, applyPlan, championMenu, enemyCases, formats, getPlans, getSelectedPlan, lanes, limitFor, makeSearch, opponents, readState, scouting } from "./draft.mjs?v=3";
import { adviceFor, getBoard, lineupNote, openerIds, planFor } from "./cross.mjs?v=3";
import { roster } from "./roster.mjs";
import { evaluateComposition, formatSample } from "./composition.mjs";
import { compositionStats } from "./composition-stats.mjs";

const state = readState(location.search);
const byId = id => document.getElementById(id);
const status = byId("ban-status");
const draftStatus = byId("draft-status");
const sideOptions = [{ id: "blue", label: "블루" }, { id: "red", label: "레드" }];
const roleOptions = [{ id: "base", label: "기본" }, { id: "swap", label: "미드·원딜 교대" }];

function element(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}

function button(label, className, handler) {
  const el = element("button", className, label);
  el.type = "button";
  el.addEventListener("click", handler);
  return el;
}

function portrait(id) {
  const picture = element("span", "portrait", roster[id]?.slice(0, 1) ?? "–");
  picture.setAttribute("aria-hidden", "true");
  if (id) {
    const image = element("img");
    image.alt = "";
    image.decoding = "async";
    image.src = "https://ddragon.leagueoflegends.com/cdn/" + VERSION + "/img/champion/" + id + ".png";
    image.addEventListener("error", () => image.remove(), { once: true });
    picture.append(image);
  }
  return picture;
}

function normalizeInitial() {
  const limit = limitFor(state);
  state.ours = state.ours.slice(0, limit);
  state.theirs = state.theirs.slice(0, limit);
  if (state.format === "split") state.theirs = state.theirs.filter(id => !state.ours.includes(id));
}

function revise(message, change) {
  const hadPicks = state.moves.length > 0;
  change();
  state.moves = [];
  normalizeInitial();
  status.textContent = message + (hadPicks ? " 픽 기록도 초기화했습니다." : "");
  draftStatus.textContent = "";
  render();
}

function installOptions(table, id, onChange) {
  const container = byId(id);
  return table.map(row => {
    const toggle = button(row.label, "", () => onChange(row.id));
    toggle.dataset.option = row.id;
    if (id === "side-controls") toggle.dataset.side = row.id;
    container.append(toggle);
    return { id: row.id, toggle };
  });
}

const sideButtons = installOptions(sideOptions, "side-controls", id => {
  if (id === state.side) return;
  revise("진영에 맞춰 우리 기본 밴을 적용했습니다.", () => { state.side = id; applyPlan(state); });
});
const opponentButtons = installOptions(opponents, "opponent-controls", id => {
  if (id === state.opponent) return;
  revise("상대에 맞춰 우리 기본 밴을 적용했습니다.", () => { state.opponent = id; applyPlan(state); });
});
const formatButtons = installOptions(formats, "format-controls", id => {
  if (id === state.format) return;
  const selected = getSelectedPlan(state);
  const followsPlan = selected && state.ours.join(",") === selected.bans.slice(0, limitFor(state)).join(",");
  revise("밴 방식을 변경했습니다. 현재 밴 슬롯을 다시 확인하세요.", () => {
    state.format = id;
    if (followsPlan) applyPlan(state, state.planIndex);
  });
});
const swapButtons = installOptions(roleOptions, "swap-controls", id => {
  const swap = id === "swap";
  if (swap !== state.swap) revise("포지션을 변경했습니다.", () => { state.swap = swap; });
});

function addOption(select, value, label) {
  const option = element("option", "", label);
  option.value = value;
  select.append(option);
}

function championPicker({ label, choices, initial, submit, openRoles = [], initialLane, prefix = "" }) {
  const box = element("div", "direct-picker");
  const filter = element("input");
  filter.type = "search";
  filter.placeholder = "챔피언 이름";
  const searchLabel = element("label", "", prefix + "챔피언 검색");
  searchLabel.append(filter);
  const select = element("select");
  const selectLabel = element("label", "", prefix + "챔피언");
  selectLabel.append(select);
  const action = button(label, "button button-outline", () => {
    if (select.value) submit({ id: select.value, lane: selectedLane() });
  });
  const role = element("select");
  let previous = initial;

  if (openRoles.length) {
    openRoles.forEach(lane => addOption(role, String(lane), lanes[lane]));
    role.value = String(initialLane ?? openRoles[0]);
    const roleLabel = element("label", "", "우리 포지션");
    roleLabel.append(role);
    box.append(roleLabel);
  }

  function selectedLane() {
    return openRoles.length ? Number(role.value) : null;
  }

  function filterChoices() {
    const query = filter.value.trim().toLowerCase().replaceAll(" ", "");
    const available = choices(selectedLane()).filter(id =>
      !query || roster[id].replaceAll(" ", "").includes(query) || id.toLowerCase().includes(query),
    );
    select.replaceChildren();
    addOption(select, "", "챔피언 선택");
    available.forEach(id => addOption(select, id, roster[id]));
    if (available.includes(previous)) select.value = previous;
    else if (query && available.length === 1) select.value = available[0];
    action.disabled = !select.value;
    select.disabled = !available.length;
  }

  filter.addEventListener("input", filterChoices);
  role.addEventListener("change", filterChoices);
  select.addEventListener("change", () => { previous = select.value; action.disabled = !previous; });
  filter.addEventListener("keydown", event => {
    if (event.key === "Enter" && !action.disabled) { event.preventDefault(); action.click(); }
  });
  box.append(searchLabel, selectLabel, action);
  filterChoices();
  return box;
}

function renderPlans() {
  const ourPlans = getPlans(state);
  const ownButtons = ourPlans.map(({ label, bans }, index) => {
    const el = button(label, "button preset", () => revise("우리 밴 예시를 적용했습니다.", () => applyPlan(state, index)));
    el.dataset.ourPlan = String(index);
    el.setAttribute("aria-pressed", String(state.ours.join(",") === bans.slice(0, limitFor(state)).join(",")));
    el.title = bans.map(id => roster[id]).join(" · ");
    return el;
  });
  byId("our-plans").replaceChildren(...ownButtons);
  const selected = getSelectedPlan(state);
  const matchesPlan = selected && state.ours.join(",") === selected.bans.slice(0, limitFor(state)).join(",");
  byId("our-note").textContent = matchesPlan ? "[추정] " + selected.note
    : "아래 밴을 직접 입력하거나 위 추천 묶음을 적용하세요.";

  const enemyButtons = enemyCases.map((example, index) => {
    const el = button(example.label, "button preset", () => revise("상대 밴 예시를 적용했습니다.", () => {
      state.theirs = example.bans.filter(id => state.format !== "split" || !state.ours.includes(id)).slice(0, limitFor(state));
    }));
    el.dataset.enemyPlan = String(index);
    el.setAttribute("aria-pressed", String(state.theirs.join(",") === example.bans.slice(0, limitFor(state)).join(",")));
    el.title = example.bans.map(id => roster[id]).join(" · ");
    return el;
  });
  byId("enemy-plans").replaceChildren(...enemyButtons);
  const current = enemyCases.find(example => state.theirs.join(",") === example.bans.slice(0, limitFor(state)).join(","));
  byId("enemy-note").textContent = current
    ? "[추정] " + current.note + (state.format === "split" ? " 3+2에서는 1차 세 장만 적용했습니다." : "")
    : "상대가 밴했다고 가정할 카드 또는 실제 밴을 입력하세요.";
}

function renderBans(board, key, id, countId) {
  const ours = key === "ours";
  const picked = state[key];
  const other = ours ? state.theirs : state.ours;
  const limit = limitFor(state);
  const prefix = ours ? "우리 " : "상대 ";
  const slots = element("ul", "ban-slots");
  for (let i = 0; i < limit; i++) {
    const item = element("li", "ban-slot");
    const champion = picked[i];
    if (champion) {
      const remove = button(undefined, "ban-chip", () => revise(prefix + "밴을 수정했습니다.", () => {
        state[key] = picked.filter(id => id !== champion);
      }));
      remove.setAttribute("aria-label", prefix + roster[champion] + " 밴 제거");
      remove.dataset.ban = champion;
      remove.append(portrait(champion), element("span", "", roster[champion]), element("span", "ban-remove", "×"));
      item.append(remove);
    } else {
      item.append(element("span", "open-ban", (i + 1) + "번 빈 슬롯"));
    }
    slots.append(item);
  }
  const second = board.played.filter((_, i) => board.steps[i].kind === "ban" && (board.steps[i].side === state.side) === ours).length;
  byId(countId).textContent = (state.format === "split" ? "1차 " : "") + picked.length + "/" + limit
    + (state.format === "split" ? " · 2차 " + second + "/2" : "");
  const fields = [slots];
  if (picked.length < limit) {
    fields.push(championPicker({
      label: "밴 추가",
      prefix,
      choices: () => championMenu.filter(id => !picked.includes(id) && (state.format !== "split" || !other.includes(id))),
      submit: ({ id }) => revise(prefix + "밴을 추가했습니다.", () => { state[key] = [...picked, id]; }),
    }));
  }
  byId(id).replaceChildren(...fields);
}

function recordMove(move) {
  const next = [...state.moves, move];
  if (getBoard(state, next).played.length !== next.length) return;
  state.moves = next;
  draftStatus.textContent = "";
  render();
}

function renderRoadmap(board) {
  let index = 0;
  const groups = board.phases.map(phase => {
    const wrapper = element("div", "roadmap-phase");
    const list = element("ol", "phase-slots");
    phase.steps.forEach(step => {
      const move = board.played[index++];
      const slot = element("li", "turn-slot" + (step.side === "red" ? " red" : "") + (step.kind === "ban" ? " is-ban" : ""));
      slot.dataset.slot = step.slot;
      if (step.slot === board.step?.slot) slot.setAttribute("aria-current", "step");
      slot.append(element("span", "", step.label), element("strong", "", move ? roster[move.id] : "·"));
      list.append(slot);
    });
    wrapper.append(element("span", "phase-label", phase.label), list);
    return wrapper;
  });
  const roadmap = byId("draft-roadmap");
  roadmap.dataset.format = state.format;
  roadmap.replaceChildren(...groups);
}

function renderDraft(board, plan) {
  const red = state.side === "red";
  byId("cross-side").textContent = red ? "우리 레드 · 상대 B1" : "우리 블루 · 우리 B1";
  byId("cross-side").classList.toggle("red", red);
  byId("undo-move").disabled = !board.played.length;
  byId("reset-moves").disabled = !board.played.length;
  renderRoadmap(board);

  const { step } = board;
  const action = byId("draft-action");
  const advice = adviceFor(state, board, plan);
  if (!step) {
    action.replaceChildren(element("h3", "", "이번 경기 밴픽 완료"), element("p", "small muted", advice.note));
    return;
  }

  const ourTurn = step.side === state.side;
  const picking = step.kind === "pick";
  const title = (ourTurn ? "우리 " : "상대 ") + step.label + (picking ? " 픽" : "");
  const content = [element("h3", "", title), element("p", "small muted", (ourTurn ? "[추정] " : "") + advice.note)];
  if (step.slot === "B1" && (state.ours.length < limitFor(state) || state.theirs.length < limitFor(state))) {
    content.push(element("p", "small muted", "밴 입력이 비어 있는 칸이 있습니다. 지금 입력된 밴만 반영했습니다."));
  }
  if (advice.options.length) {
    const choices = element("ol", "draft-options");
    advice.options.forEach(({ id, lane }, index) => {
      const item = element("li");
      const caption = roster[id] + (lane === null ? " 밴" : " · " + lanes[lane]);
      if (index === 0 || !picking) {
        const confirm = button(undefined, "draft-pick-button", () => recordMove({ id, lane }));
        confirm.dataset.quickPick = id;
        confirm.append(portrait(id), element("span", "", caption));
        item.append(confirm);
      } else {
        item.className = "draft-option";
        item.dataset.nextPick = id;
        item.append(portrait(id), element("span", "", "다음 " + caption));
      }
      choices.append(item);
    });
    content.push(choices);
  }
  if (step.slot === "B1" && !ourTurn) {
    const quick = element("div", "cross-toolbar");
    openerIds.filter(id => !board.unavailable.has(id)).forEach(id => {
      const el = button(roster[id], "button preset", () => recordMove({ id, lane: null }));
      el.dataset.enemyPick = id;
      quick.append(el);
    });
    if (quick.childElementCount) content.push(quick);
  }

  const ourPick = ourTurn && picking;
  const openRoles = ourPick ? lanes.map((_, lane) => lane).filter(lane =>
    !board.locks[lane] && board.pool[lane].some(id => !board.unavailable.has(id)),
  ) : [];
  if (!ourPick || openRoles.length) {
    content.push(championPicker({
      label: picking ? "픽 기록" : "밴 기록",
      choices: lane => (lane === null ? championMenu : board.pool[lane]).filter(id => !board.unavailable.has(id)),
      openRoles,
      initial: advice.options[0]?.id,
      initialLane: advice.options[0]?.lane,
      submit: recordMove,
    }));
  } else {
    content.push(element("p", "small muted", "남은 포지션의 준비 카드가 모두 막혔습니다. 포지션 교대나 이전 픽을 확인하세요."));
  }
  action.replaceChildren(...content);
}

function renderLineup(plan, comfort) {
  const positions = element("ul", "positions");
  plan.picks.forEach(({ id, lane, player, locked }) => {
    const item = element("li", "position");
    item.dataset.champion = id ?? "";
    const copy = element("div", "pick-copy");
    const history = comfort[lane];
    copy.append(element("strong", "", roster[id] ?? "준비 카드 확인"), element("small", "", player),
      element("small", "comfort", id ? (history ? "해당 역할 " + history + "경기" : "해당 역할 관측 0경기") : ""));
    item.append(element("span", "lane-name", lanes[lane]), portrait(id), copy);
    if (locked) item.append(element("small", "confirmed-pick", "확정"));
    positions.append(item);
  });
  byId("lineup").replaceChildren(positions, element("p", "lineup-note", lineupNote(state, plan)));
}

function renderComposition(report) {
  const brief = element("div", "panel report-brief");
  const heading = element("div", "report-head");
  heading.append(
    element("h3", "", report.title),
    element("span", "report-status", report.complete ? "확정 " + report.locked + "/5" : "일부 준비 카드 없음"),
  );
  const signals = element("dl", "report-signals");
  report.signals.forEach(({ label, value }) => {
    const field = element("div");
    field.append(element("dt", "", label), element("dd", "", value));
    signals.append(field);
  });
  brief.append(heading, element("p", "muted", "[추정] " + report.summary), signals);

  const timing = element("div", "report-grid");
  report.timing.forEach(({ label, text }) => {
    const card = element("article", "panel report-card");
    card.append(element("h3", "", label), element("p", "muted", text));
    timing.append(card);
  });

  const decisions = element("div", "report-grid report-pair");
  const teamfight = element("article", "panel report-card");
  teamfight.append(
    element("h3", "", "한타에서 먼저 할 일"),
    element("p", "muted", report.teamfight),
    element("p", "report-call", report.call),
  );
  const risks = element("article", "panel report-card");
  risks.append(element("h3", "", "주의할 조건"));
  if (report.risks.length || report.alternate) {
    const list = element("ul", "report-risks");
    [...report.risks, report.alternate].filter(Boolean).forEach(risk => list.append(element("li", "", risk)));
    risks.append(list);
  } else {
    risks.append(element("p", "muted", "상대가 아직 보여 주지 않은 진입과 아군 핵심 스킬이 남았는지 확인하세요."));
  }
  decisions.append(teamfight, risks);

  const evidence = element("div", "report-evidence");
  evidence.append(
    element("h3", "", "같은 픽의 실제 경기 기록"),
    element("p", "small muted", "내전 전체와 지정된 C팀 선수의 기록을 따로 셉니다. 같은 바텀 조합의 한국 솔로랭크는 참고용입니다."),
  );
  const exact = element("p", "panel exact-note");
  exact.append(element("strong", "", "현재 5픽과 포지션 전체 "),
    document.createTextNode("내전 " + formatSample(report.exact.all) + " · C팀 5명 " + formatSample(report.exact.team)));
  evidence.append(exact);

  const rows = element("div", "report-grid evidence-grid");
  for (const record of report.evidence) {
    const card = element("article", "panel report-card");
    const stats = element("dl", "record-list");
    const samples = [["내전 같은 역할", record.all], ["우리 지정 두 선수", record.team]];
    if (record.ranked) samples.push(["KR 솔로랭크 26.23", record.ranked]);
    for (const [label, count] of samples) {
      const field = element("div");
      field.append(element("dt", "", label), element("dd", "", formatSample(count)));
      stats.append(field);
    }
    card.append(element("h4", "", record.title), element("p", "record-pair", record.name || "챔피언 미정"), stats);
    rows.append(card);
  }
  evidence.append(rows);
  byId("composition-report").replaceChildren(brief, timing, decisions, evidence);
}

function renderValidation() {
  const { train, test, scores } = compositionStats.validation;
  const html = byId("validation");
  html.append(element("p", "", "기존 픽 추천은 가용 챔피언, 역할별 준비 카드, 상대 선점 순서를 사용합니다."));
  html.append(element("p", "", "시간순으로 앞 " + train + "경기를 학습하고 최근 " + test
    + "경기를 검증했습니다. 로그손실은 50% 고정 " + scores.fair.logLoss.toFixed(3)
    + ", 선수만 " + scores.player.logLoss.toFixed(3)
    + ", 선수·챔피언·역할별 쌍 " + scores.combo.logLoss.toFixed(3)
    + "이었습니다. 낮을수록 좋습니다. [추정] 이번 표본에서 조합을 추가해 개선된 근거가 없어서 운영 근거와 관측 전적을 제시합니다."));
}

function render() {
  const board = getBoard(state);
  if (board.played.length !== state.moves.length) {
    state.moves = board.played;
    draftStatus.textContent = "규칙이나 밴과 충돌한 기록부터 다시 입력할 수 있습니다.";
  }
  [
    [sideButtons, state.side], [formatButtons, state.format], [opponentButtons, state.opponent], [swapButtons, state.swap ? "swap" : "base"],
  ].forEach(([options, value]) => options.forEach(({ id, toggle }) => toggle.setAttribute("aria-pressed", String(id === value))));

  const overlap = state.ours.filter(id => state.theirs.includes(id));
  const note = state.format === "split"
    ? "1차 밴은 팀당 3개입니다. 2차 밴 두 개씩은 픽 도중에 기록합니다."
    : "양 팀이 픽 전에 5장씩 밴합니다. " + (overlap.length
      ? "겹밴 " + overlap.map(id => roster[id]).join(" · ") + "은 두 팀이 각각 한 칸씩 사용합니다."
      : "양 팀이 같은 챔피언을 밴할 수 있습니다.");
  byId("format-note").textContent = note;
  renderPlans();
  renderBans(board, "ours", "our-bans", "our-count");
  renderBans(board, "theirs", "enemy-bans", "enemy-count");
  const plan = planFor(state, board);
  const report = evaluateComposition(state, board, plan);
  renderDraft(board, plan);
  renderLineup(plan, report.comfort);
  renderComposition(report);
  byId("scouting").textContent = Object.hasOwn(scouting, state.opponent) ? scouting[state.opponent] : "상대 팀을 고르면 해당 팀의 내전 챔피언 사용 기록을 볼 수 있습니다.";

  const next = new URL(location.href);
  next.search = makeSearch(state);
  if (next.href !== location.href) history.replaceState(null, "", next);
}

byId("new-game").addEventListener("click", () => revise("새 게임을 시작했습니다. 이전 밴과 픽을 모두 초기화했습니다.", () => {
  state.ours = [];
  state.theirs = [];
}));
byId("undo-move").addEventListener("click", () => { state.moves.pop(); draftStatus.textContent = ""; render(); });
byId("reset-moves").addEventListener("click", () => { state.moves = []; draftStatus.textContent = "이번 게임의 픽 순서를 초기화했습니다."; render(); });
byId("share").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.hash = state.moves.length ? "cross-draft" : "simulator";
  try {
    await navigator.clipboard.writeText(url.href);
    status.textContent = "현재 밴과 픽 순서가 담긴 링크를 복사했습니다.";
  } catch {
    const field = element("input", "share-field");
    field.type = "url";
    field.readOnly = true;
    field.value = url.href;
    field.setAttribute("aria-label", "공유 링크");
    status.replaceChildren(field);
    field.select();
  }
});

renderValidation();
render();
