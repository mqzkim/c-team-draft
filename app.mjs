import { VERSION, names, targets, supports, presets, lanes, opponents, getWatch, getDraft, getFirstPicks, readState, makeSearch } from "./draft.mjs";

const state = readState(location.search);
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
  const picture = element("span", "portrait", names[id]?.slice(0, 1) ?? "–");
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
    const button = toggleButton(label, "", () => { state[stateKey] = id; });
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
  const button = toggleButton(preset.label, "button preset", () => { state.blocked = new Set(preset.bans); });
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

function render() {
  champButtons.forEach(({ id, button }) => button.setAttribute("aria-pressed", String(state.blocked.has(id))));
  sideButtons.forEach(({ id, button }) => button.setAttribute("aria-pressed", String(state.side === id)));
  opponentButtons.forEach(({ id, button }) => button.setAttribute("aria-pressed", String(state.opponent === id)));
  presetButtons.forEach(({ bans, button }) => {
    const selected = bans.length === state.blocked.size && bans.every(id => state.blocked.has(id));
    button.setAttribute("aria-pressed", String(selected));
  });

  const draft = getDraft(state.blocked, state.side, state.opponent);
  const selected = [...state.blocked].map(id => names[id]);
  byId("selection-status").textContent = selected.length ? "사용 불가 " + selected.length + "장 · " + selected.join(" · ") : "사용 불가로 선택한 챔피언이 없습니다.";
  renderOrder(draft[0]);
  renderLineups(draft);
  renderWatch();

  const query = makeSearch(state);
  const nextUrl = new URL(location.href);
  nextUrl.search = query;
  if (nextUrl.href !== location.href) history.replaceState(null, "", nextUrl);
}

byId("share").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.hash = "simulator";
  try {
    await navigator.clipboard.writeText(url.href);
    shareStatus.textContent = "현재 밴과 진영이 담긴 링크를 복사했습니다.";
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
