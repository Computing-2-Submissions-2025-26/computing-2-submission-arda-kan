/*jslint browser*/
import R from "./ramda.js";
import Tavla from "./Tavla.js";


let state = Tavla.new_game();
let selected_from = null;
let settings = {
    "p1_color": "white",
    "show_legal_moves": true,
    "auto_roll": true,
    "match_target": 1
};
let p1_match_score = 0;
let p2_match_score = 0;


// DOMs for screen reading for accesability
const p1_dice_el = document.getElementById("p1-dice");
const p2_dice_el = document.getElementById("p2-dice");
const bar_p1_el = document.getElementById("bar-p1");
const bar_p2_el = document.getElementById("bar-p2");
const borne_off_p1_el = document.getElementById("borne-off-p1");
const borne_off_p2_el = document.getElementById("borne-off-p2");
const borne_off_area_el = document.getElementById("borne-off-area");
const dialog_el = document.getElementById("game-over-dialog");
const dialog_message = document.getElementById("dialog-message");
const dialog_new_game = document.getElementById("dialog-new-game");
const settings_dialog = document.getElementById("settings-dialog");
const stats_dialog = document.getElementById("stats-dialog");
const about_dialog = document.getElementById("about-dialog");
const match_score_el = document.getElementById("match-score");
const turn_indicator_el = document.getElementById("turn-indicator");
const board_container = document.getElementById("board-container");
const points_top_left_el = document.getElementById("points-top-left");
const points_top_right_el = document.getElementById("points-top-right");
const points_bottom_left_el = document.getElementById("points-bottom-left");
const points_bottom_right_el = document.getElementById("points-bottom-right");


// Indexes for board layout
// Top-left: points 13-18 : indices 12-17: displayed left to right
// Top-right: points 19-24 : indices 18-23, displayed left to right
// Bottom-left: points 12-7  : indices 11-6,  displayed left toright
// Bottom-right: points 6-1   : indices 5-0,   displayed left to right

const top_left_indices = R.range(12, 18);
const top_right_indices = R.range(18, 24);
const bottom_left_indices = [11, 10, 9, 8, 7, 6];
const bottom_right_indices = [5, 4, 3, 2, 1, 0];


//point elements are built
const make_point_el = function (index, row) {
    const div = document.createElement("div");
    const is_dark = (index % 2 === 0);
    div.className = "point " + row + (is_dark ? " point-dark-tri" : "");
    div.tabIndex = -1;
    div.setAttribute("aria-label", "Point " + String(index + 1));
    div.dataset.index = String(index);

    const triangle = document.createElement("div");
    triangle.className = "point-triangle";
    div.appendChild(triangle);

    return div;
};

const point_el_map = {};

const build_group = function (indices, row, container) {
    indices.forEach(function (index) {
        const el = make_point_el(index, row);
        container.appendChild(el);
        point_el_map[index] = el;
    });
};

build_group(top_left_indices, "point-top", points_top_left_el);
build_group(top_right_indices, "point-top", points_top_right_el);
build_group(bottom_left_indices, "point-bottom", points_bottom_left_el);
build_group(bottom_right_indices, "point-bottom", points_bottom_right_el);



// helper functions:
const checker_class = function (player) {
    if (player === 1) {
        return (settings.p1_color === "white" ? "checker-white" : "checker-black");
    }
    return (settings.p1_color === "white" ? "checker-black" : "checker-white");
};

const clear_children = function (el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
};

const make_die_el = function (value) {
    const div = document.createElement("div");
    div.className = "die";
    div.textContent = String(value);
    div.setAttribute("aria-label", "Die showing " + String(value));
    return div;
};

const render_checkers_on_point = function (el, player, count) {
    const visible = Math.min(count, 5);
    R.range(0, visible).forEach(function (i) {
        const disc = document.createElement("div");
        disc.className = "checker " + checker_class(player);
        if (count > 5 && i === 4) {
            const badge = document.createElement("span");
            badge.className = "checker-badge";
            badge.setAttribute("aria-hidden", "true");
            badge.textContent = String(count);
            disc.appendChild(badge);
        }
        el.appendChild(disc);
    });
};

const render_bar_checkers = function (el, player, count) {
    const visible = Math.min(count, 4);
    R.range(0, visible).forEach(function () {
        const disc = document.createElement("div");
        disc.className = "checker " + checker_class(player);
        el.appendChild(disc);
    });
};


// The logic for checking auto roll

const try_auto_end = function () {
    if (Tavla.is_ended(state)) {
        return;
    }
    const no_dice = (state.dice.length === 0);
    const no_moves = (state.phase === "playing" && !Tavla.can_move(state));
    if (!no_dice && !no_moves) {
        return;
    }
    setTimeout(function () {
        if (Tavla.is_ended(state)) {
            return;
        }
        state = Tavla.end_turn(state);
        selected_from = null;
        if (settings.auto_roll) {
            state = Tavla.roll_dice(state);
        }
        redraw();
        // If after doing auto-roll there still arent moves, recurse
        if (settings.auto_roll && !Tavla.can_move(state)) {
            try_auto_end();
        }
    }, 800);
};


// score display for the tavla match

const render_match_score = function () {
    if (settings.match_target > 1) {
        match_score_el.hidden = false;
        match_score_el.textContent = "P1: " + String(p1_match_score) + " — P2: " + String(p2_match_score);
    } else {
        match_score_el.hidden = true;
    }
};


// Redrawing board

const get_legal_targets = function () {
    if (selected_from === null) {
        return [];
    }
    return Tavla.legal_moves(state)
        .filter(function (m) { return m.from === selected_from; })
        .map(function (m) { return m.to; });
};

const redraw = function () {
    const cur_player = state.turn;
    const legal_targets = get_legal_targets();

    // Dice displayed
    clear_children(p1_dice_el);
    clear_children(p2_dice_el);
    if (state.phase === "playing" && state.dice.length > 0) {
        const dice_el = (cur_player === 1 ? p1_dice_el : p2_dice_el);
        state.dice.forEach(function (d) {
            dice_el.appendChild(make_die_el(d));
        });
    }

    // visuaks dfor the bar checker
    clear_children(bar_p1_el);
    clear_children(bar_p2_el);
    render_bar_checkers(bar_p1_el, 1, state.p1_bar);
    render_bar_checkers(bar_p2_el, 2, state.p2_bar);

    // highlight for the selected bar
    const bar_is_from = (selected_from === "bar");
    bar_p1_el.classList.toggle("selected-source", bar_is_from && cur_player === 1);
    bar_p2_el.classList.toggle("selected-source", bar_is_from && cur_player === 2);

    // The area for borning -off
    clear_children(borne_off_p1_el);
    clear_children(borne_off_p2_el);
    if (state.p1_borne_off === 0) {
        const lbl1 = document.createElement("span");
        lbl1.className = "borne-off-label";
        lbl1.textContent = "Collect borne off checkers here";
        borne_off_p1_el.appendChild(lbl1);
    }
    R.range(0, state.p1_borne_off).forEach(function () {
        const c = document.createElement("div");
        c.className = "borne-checker " + checker_class(1);
        borne_off_p1_el.appendChild(c);
    });
    if (state.p2_borne_off === 0) {
        const lbl2 = document.createElement("span");
        lbl2.className = "borne-off-label";
        lbl2.textContent = "Collect borne off checkers here";
        borne_off_p2_el.appendChild(lbl2);
    }
    R.range(0, state.p2_borne_off).forEach(function () {
        const c = document.createElement("div");
        c.className = "borne-checker " + checker_class(2);
        borne_off_p2_el.appendChild(c);
    });

    // points on board
    R.range(0, 24).forEach(function (index) {
        const el = point_el_map[index];
        const count = state.checkers_on_board[index];
        const sign = (cur_player === null ? 1 : Tavla.player_sign(cur_player));
        const is_own = (count * sign > 0);

        // checkers removed but triangle and number label kept
        const children = Array.from(el.childNodes);
        children.forEach(function (child) {
            if (
                child.nodeType === 1 &&
                !child.classList.contains("point-triangle") &&
                !child.classList.contains("point-number")
            ) {
                el.removeChild(child);
            }
        });

        // Rendering individual checkers
        if (count !== 0) {
            const player = (count > 0 ? 1 : 2);
            const abs_count = Math.abs(count);
            render_checkers_on_point(el, player, abs_count);
        }

        // making only your own checkers usable
        const is_selected = (selected_from === index);
        const is_target = settings.show_legal_moves && legal_targets.includes(index);

        el.classList.toggle("selected-source", is_selected);
        el.classList.toggle("legal-target", is_target);
        el.classList.toggle("interactive", is_own || is_target);
        el.tabIndex = (is_own || is_target ? 0 : -1);

        // top checker will be marked as seelected
        const top_checker = el.querySelector(".checker");
        if (top_checker !== null) {
            top_checker.classList.toggle("selected-checker", is_selected);
        }
    });

    // the legal target borne off
    const off_is_target = settings.show_legal_moves && legal_targets.includes("off");
    borne_off_p1_el.classList.toggle("legal-target", off_is_target && cur_player === 1);
    borne_off_p2_el.classList.toggle("legal-target", off_is_target && cur_player === 2);

    render_match_score();

    if (state.phase === "ended") {
        turn_indicator_el.textContent = "Game over";
    } else if (state.turn === 1) {
        turn_indicator_el.textContent = "Player 1's turn";
    } else {
        turn_indicator_el.textContent = "Player 2's turn";
    }
};


// Doing moves
const after_move = function () {
    selected_from = null;
    redraw();
    if (Tavla.is_ended(state)) {
        show_game_over();
        return;
    }
    try_auto_end();
};

const handle_point_click = function (index) {
    // To manually roll the dice just click anywhere
    if (!settings.auto_roll) {
        if (state.phase === "start" || (state.phase === "playing" && state.dice.length === 0)) {
            state = Tavla.roll_dice(state);
            selected_from = null;
            redraw();
            return;
        }
    }

    if (state.phase !== "playing" || state.dice.length === 0) {
        return;
    }

    const count = state.checkers_on_board[index];
    const sign = Tavla.player_sign(state.turn);

    if (selected_from === null) {
        const bar_count = (state.turn === 1 ? state.p1_bar : state.p2_bar);
        if (bar_count > 0) {
            return;
        }
        // Only players own checkers are selectable
        if (count * sign <= 0) {
            return;
        }
        const has_moves = Tavla.legal_moves(state).some(function (m) {
            return m.from === index;
        });
        if (!has_moves) {
            const stuck_el = point_el_map[index];
            stuck_el.classList.add("no-moves-flash");
            setTimeout(function () {
                stuck_el.classList.remove("no-moves-flash");
            }, 600);
            return;
        }
        selected_from = index;
        redraw();
        return;
    }

    // selected point & try to move to this point
    const legal_targets = get_legal_targets();
    if (legal_targets.includes(index)) {
        const next = Tavla.make_move(selected_from, index, state);
        if (next !== undefined) {
            state = next;
            after_move();
            return;
        }
    }

    // selecting own checker again
    if (count * sign > 0) {
        const has_moves = Tavla.legal_moves(state).some(function (m) {
            return m.from === index;
        });
        if (has_moves) {
            selected_from = index;
            redraw();
            return;
        }
    }

    // deselection
    selected_from = null;
    redraw();
};

const handle_bar_click = function (player) {
    if (!settings.auto_roll) {
        if (state.phase === "start" || (state.phase === "playing" && state.dice.length === 0)) {
            state = Tavla.roll_dice(state);
            selected_from = null;
            redraw();
            return;
        }
    }
    if (state.phase !== "playing" || player !== state.turn) {
        return;
    }
    const bar_count = (player === 1 ? state.p1_bar : state.p2_bar);
    if (bar_count === 0) {
        return;
    }
    if (!Tavla.legal_moves(state).some(function (m) { return m.from === "bar"; })) {
        return;
    }
    selected_from = "bar";
    redraw();
};

const handle_off_click = function () {
    if (selected_from === null) {
        return;
    }
    const legal_targets = get_legal_targets();
    if (!legal_targets.includes("off")) {
        return;
    }
    const next = Tavla.make_move(selected_from, "off", state);
    if (next !== undefined) {
        state = next;
        after_move();
    }
};

// using point handlers
R.range(0, 24).forEach(function (index) {
    const el = point_el_map[index];
    el.onclick = function (e) {
        e.stopPropagation();
        handle_point_click(index);
    };
    el.onkeydown = function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handle_point_click(index);
        }
    };
});

bar_p1_el.tabIndex = 0;
bar_p1_el.onclick = function (e) {
    e.stopPropagation();
    handle_bar_click(1);
};
bar_p1_el.onkeydown = function (e) {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handle_bar_click(1);
    }
};

bar_p2_el.tabIndex = 0;
bar_p2_el.onclick = function (e) {
    e.stopPropagation();
    handle_bar_click(2);
};
bar_p2_el.onkeydown = function (e) {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handle_bar_click(2);
    }
};

borne_off_p1_el.tabIndex = 0;
borne_off_p1_el.setAttribute("aria-label", "Bear off Player 1");
borne_off_p1_el.onclick = function (e) {
    e.stopPropagation();
    handle_off_click();
};
borne_off_p1_el.onkeydown = function (e) {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handle_off_click();
    }
};

borne_off_p2_el.tabIndex = 0;
borne_off_p2_el.setAttribute("aria-label", "Bear off Player 2");
borne_off_p2_el.onclick = function (e) {
    e.stopPropagation();
    handle_off_click();
};
borne_off_p2_el.onkeydown = function (e) {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handle_off_click();
    }
};

borne_off_area_el.onclick = function (e) {
    e.stopPropagation();
    handle_off_click();
};
borne_off_area_el.onkeydown = function (e) {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handle_off_click();
    }
};

// dice rolling in the manual mode with background click
board_container.onclick = function (e) {
    if (e.target.closest(".point")) {
        return;
    }
    if (settings.auto_roll) {
        return;
    }
    if (state.phase === "start" || (state.phase === "playing" && state.dice.length === 0)) {
        state = Tavla.roll_dice(state);
        selected_from = null;
        redraw();
    }
};


// The buttons
const start_new_game = function () {
    state = Tavla.new_game();
    selected_from = null;
    redraw();
    if (settings.auto_roll) {
        state = Tavla.roll_dice(state);
        redraw();
        try_auto_end();
    }
};

document.getElementById("btn-new-game").onclick = function () {
    settings_dialog.showModal();
};


// Game over

const show_game_over = function () {
    const w = Tavla.winner(state);
    const loser = (w === 1 ? 2 : 1);
    const loser_off = (loser === 1 ? state.p1_borne_off : state.p2_borne_off);
    const points = (loser_off === 0 ? 2 : 1);

    if (settings.match_target > 1) {
        if (w === 1) {
            p1_match_score = p1_match_score + points;
        } else {
            p2_match_score = p2_match_score + points;
        }
        render_match_score();

        if (p1_match_score >= settings.match_target) {
            dialog_message.textContent = "Player 1 wins the match!";
            p1_match_score = 0;
            p2_match_score = 0;
        } else if (p2_match_score >= settings.match_target) {
            dialog_message.textContent = "Player 2 wins the match!";
            p1_match_score = 0;
            p2_match_score = 0;
        } else {
            dialog_message.textContent = (
                "Player " + String(w) + " wins" + (points === 2 ? " (mars!)" : "") +
                "! Score: P1 " + String(p1_match_score) + " – P2 " + String(p2_match_score)
            );
        }
    } else {
        dialog_message.textContent = "Player " + String(w) + " has won!" + (points === 2 ? " (mars!)" : "");
    }

    dialog_el.showModal();
};

dialog_new_game.onclick = function () {
    dialog_el.close();
    start_new_game();
};

// Game stats

const open_stats = function () {
    document.getElementById("stat-p1-off").textContent = String(state.p1_borne_off);
    document.getElementById("stat-p2-off").textContent = String(state.p2_borne_off);
    document.getElementById("stat-p1-bar").textContent = String(state.p1_bar);
    document.getElementById("stat-p2-bar").textContent = String(state.p2_bar);
    stats_dialog.showModal();
};

document.getElementById("btn-stats-header").onclick = open_stats;

document.getElementById("btn-close-stats").onclick = function () {
    stats_dialog.close();
};

document.getElementById("btn-about").onclick = function () {
    about_dialog.showModal();
};

document.getElementById("btn-close-about").onclick = function () {
    about_dialog.close();
};

// Settings options
const make_triple_toggle = function (ids, callbacks) {
    ids.forEach(function (id, i) {
        const btn = document.getElementById(id);
        btn.onclick = function () {
            ids.forEach(function (other_id) {
                const other = document.getElementById(other_id);
                other.classList.remove("active");
                other.setAttribute("aria-pressed", "false");
            });
            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");
            callbacks[i]();
        };
    });
};

const make_toggle = function (active_id, inactive_id, on_active, on_inactive) {
    const active_btn = document.getElementById(active_id);
    const inactive_btn = document.getElementById(inactive_id);
    active_btn.onclick = function () {
        active_btn.classList.add("active");
        active_btn.setAttribute("aria-pressed", "true");
        inactive_btn.classList.remove("active");
        inactive_btn.setAttribute("aria-pressed", "false");
        on_active();
    };
    inactive_btn.onclick = function () {
        inactive_btn.classList.add("active");
        inactive_btn.setAttribute("aria-pressed", "true");
        active_btn.classList.remove("active");
        active_btn.setAttribute("aria-pressed", "false");
        on_inactive();
    };
};

make_toggle(
    "set-p1-white",
    "set-p1-black",
    function () { settings.p1_color = "white"; },
    function () { settings.p1_color = "black"; }
);

make_toggle(
    "set-legal-yes",
    "set-legal-no",
    function () { settings.show_legal_moves = true; },
    function () { settings.show_legal_moves = false; }
);

make_toggle(
    "set-autoroll-yes",
    "set-autoroll-no",
    function () { settings.auto_roll = true; },
    function () { settings.auto_roll = false; }
);

make_triple_toggle(
    ["set-match-1", "set-match-3", "set-match-5"],
    [
        function () { settings.match_target = 1; },
        function () { settings.match_target = 3; },
        function () { settings.match_target = 5; }
    ]
);

document.getElementById("btn-start-game").onclick = function () {
    settings_dialog.close();
    p1_match_score = 0;
    p2_match_score = 0;
    start_new_game();
};


// Boot

redraw();
settings_dialog.showModal();
