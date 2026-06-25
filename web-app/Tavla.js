/*jslint module*/
import R from "./ramda.js";

/**
 * Tavla.js models the game of Tavla (Turkish take on backgammon).
 * https://usbgf.org/backgammon-basics-how-to-play/
 * @namespace Tavla
 * @author Arda Kancal
 * @version 2025/26
 */
const Tavla = Object.create(null);

/**
 * A point or a column represents one of the 24 triangular positions on the board, check a tavla board image.
 * The positive values represent the checkers of Player 1 whereas the negative chekers shows Player 2.
 * If zero it means that the column is empty.
 * @memberof Tavla
 * @typedef {number} Point
 */

/**
 * The phases a game could have.
 * @memberof Tavla
 * @typedef {("start"|"playing"|"ended")} Phase
 */

/**
 * Stack of stats for a game of Tavla.
 * @memberof Tavla
 * @typedef {Object} GameState
 * @property {Tavla.Point[]} checkers_on_board
 *   An array of 24 signed integers (index 0 = point 1).
 *   Positive = Player 1 checkers, negative = Player 2 checkers.
 * @property {number} p1_bar  Player 1 checkers that are on the bar.
 * @property {number} p2_bar  Player 2 checkers that are on the bar.
 * @property {number} p1_borne_off  Player 1 checkers hat are borne off.
 * @property {number} p2_borne_off  Player 2 checkers that are borne off.
 * @property {number[]} dice  Remaining dice for the current turn of player.
 * @property {Tavla.Phase} phase  Current game's phase.
 * @property {(1|2|null)} turn  Which player is active, or null if the game has ended.
 */

/**
 * Defining legal moves.
 * @memberof Tavla
 * @typedef {Object} Move
 * @property {number|"bar"} from  will be point index (0-23) or "bar" (source).
 * @property {number|"off"} to    will be the destination point index (0-23) or "off".
 */




/**
 * Outputs the sign for a given player's checkers.
 * @memberof Tavla
 * @function
 * @param {(1|2)} player
 * @returns {number} Returns 1 for Player 1 and -1 for Player 2.
 */
Tavla.player_sign = function (player) {
    return (player === 1 ? 1 : -1);
};

/**
 * REturns the opponent of the given player.
 * @memberof Tavla
 * @function
 * @param {(1|2)} player
 * @returns {(1|2)}
 */
Tavla.opponent = function (player) {
    return (player === 1 ? 2 : 1);
};

/**
 * Outputs true if the given point is in the home board section of the player.
 * Player 1 home is between indices 0-5 (points 1-6).
 * Player 2 home is between indices 18-23 (points 19-24).
 * @memberof Tavla
 * @function
 * @param {(1|2)} player
 * @param {number} index  Point index between 0-23.
 * @returns {boolean}
 */
Tavla.is_home_index = function (player, index) {
    return (player === 1 ? index <= 5 : index >= 18);
};

/**
 * Returns true if the players all checkers are in their
 * home board (the bar should be empty and there should be no checkers outside of home).
 * @memberof Tavla
 * @function
 * @param {(1|2)} player
 * @param {Tavla.GameState} state
 * @returns {boolean}
 */
Tavla.all_checkers_in_home = function (player, state) {
    const sign = Tavla.player_sign(player);
    const bar_count = (player === 1 ? state.p1_bar : state.p2_bar);
    if (bar_count > 0) {
        return false;
    }
    return state.checkers_on_board.every(function (count, index) {
        if (count * sign <= 0) {
            return true;
        }
        return Tavla.is_home_index(player, index);
    });
};

// Player 1 enters from bar onto columns 19-24 (indices 18-23).
// Player 2 enters from bar onto columns 1-6 (indices 0-5).
const bar_entry_indices = function (player) {
    return (player === 1 ? R.range(18, 24) : R.range(0, 6));
};

// Removes one dice value from the dice array.
const consume_die = function (value, dice) {
    const idx = dice.indexOf(value);
    if (idx === -1) {
        return dice;
    }
    return R.remove(idx, 1, dice);
};



/**
 * creates a new game state with the standard backgammon starting position.
 * the initial state is "start", turn is Player 1, and atp no dice has rolled yet.
 * @memberof Tavla
 * @function
 * @returns {Tavla.GameState}
 */
Tavla.new_game = function () {
    return Object.freeze({
        "checkers_on_board": Object.freeze([
            -2,  0,  0,  0,  0,  5,
             0,  3,  0,  0,  0, -5,
             5,  0,  0,  0, -3,  0,
            -5,  0,  0,  0,  0,  2
        ]),
        "p1_bar": 0,
        "p2_bar": 0,
        "p1_borne_off": 0,
        "p2_borne_off": 0,
        "dice": Object.freeze([]),
        "phase": "start",
        "turn": 1
    });
};

/**
 * Returns a new game state with the given dice values used for the current player.
 * If two values same it gives four moves of that value (doubles in dices).
 * rhe state goes from "start" to "playing".
 * @memberof Tavla
 * @function
 * @param {number} die_1  The first dice value. Is an integer between 1 and 6 inclusive.
 * @param {number} die_2  the second diec value. Is an integer between 1 and 6 inclusive.
 * @param {Tavla.GameState} state
 * @returns {Tavla.GameState}
 */
Tavla.roll_dice_with_values = function (die_1, die_2, state) {
    const new_dice = Object.freeze(
        die_1 === die_2 ? [die_1, die_1, die_1, die_1] : [die_1, die_2]
    );
    return Object.freeze(Object.assign(Object.create(null), state, {
        "dice": new_dice,
        "phase": "playing"
    }));
};

/**
 * Returns a new game state with the dice randomly rolled for the current player.
 * Oly impure function in the module.
 * @memberof Tavla
 * @function
 * @param {Tavla.GameState} state
 * @returns {Tavla.GameState}
 */
Tavla.roll_dice = function (state) {
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    return Tavla.roll_dice_with_values(d1, d2, state);
};

/**
 * Looks and returns the all possible legal moves for the current player.
 * Returns an empty array if there are no legal moves possible.
 * @memberof Tavla
 * @function
 * @param {Tavla.GameState} state
 * @returns {Tavla.Move[]}
 */
Tavla.legal_moves = function (state) {
    if (state.phase !== "playing" || state.dice.length === 0) {
        return [];
    }
    const player = state.turn;
    const sign = Tavla.player_sign(player);
    const unique_dice = R.uniq(state.dice);

    const can_land = function (index) {
        const count = state.checkers_on_board[index];
        if (count * sign > 0) {
            return true;
        }
        if (count === 0) {
            return true;
        }
        if (count * sign < 0 && Math.abs(count) === 1) {
            return true;
        }
        return false;
    };

    // If there are any checkers on the bar, they must enter the board again first.
    const bar_count = (player === 1 ? state.p1_bar : state.p2_bar);
    if (bar_count > 0) {
        const entries = bar_entry_indices(player);
        return unique_dice.flatMap(function (die) {
            const target = (player === 1 ? 24 - die : die - 1);
            if (!entries.includes(target)) {
                return [];
            }
            if (!can_land(target)) {
                return [];
            }
            return [{"from": "bar", "to": target}];
        });
    }

    const bearing_off = Tavla.all_checkers_in_home(player, state);

    return unique_dice.flatMap(function (die) {
        const owned = state.checkers_on_board.reduce(
            function (acc, count, index) {
                if (count * sign > 0) {
                    acc.push(index);
                }
                return acc;
            },
            []
        );

        return owned.flatMap(function (from_index) {
            const to_index = (
                player === 1
                ? from_index - die
                : from_index + die
            );

            if (to_index >= 0 && to_index <= 23) {
                if (can_land(to_index)) {
                    return [{"from": from_index, "to": to_index}];
                }
                return [];
            }

            // checks if bearing off
            if (!bearing_off) {
                return [];
            }

            if (player === 1) {
                if (to_index < 0) {
                    // if its exactly bear off
                    if (to_index === -1) {
                        return [{"from": from_index, "to": "off"}];
                    }
                    // bigger value (overshoot): only legal if no checker on a higher point exists
                    const highest = state.checkers_on_board.reduce(
                        function (best, count, idx) {
                            return (count > 0 ? Math.max(best, idx) : best);
                        },
                        -1
                    );
                    if (from_index === highest) {
                        return [{"from": from_index, "to": "off"}];
                    }
                }
            } else {
                if (to_index > 23) {
                    if (to_index === 24) {
                        return [{"from": from_index, "to": "off"}];
                    }
                    const lowest = state.checkers_on_board.reduce(
                        function (best, count, idx) {
                            return (count < 0 ? Math.min(best, idx) : best);
                        },
                        24
                    );
                    if (from_index === lowest) {
                        return [{"from": from_index, "to": "off"}];
                    }
                }
            }
            return [];
        });
    });
};

/**
 * Returns true if the current player has at least one legal move left.
 * @memberof Tavla
 * @function
 * @param {Tavla.GameState} state
 * @returns {boolean}
 */
Tavla.can_move = function (state) {
    return Tavla.legal_moves(state).length > 0;
};

/**
 * Applies a move to the state and returns the game state w the move.
 * Returns undefined if the move is illegal.
 * @memberof Tavla
 * @function
 * @param {number|"bar"} from  either source point index or "bar".
 * @param {number|"off"} to    either destination point index or "off".
 * @param {Tavla.GameState} state
 * @returns {Tavla.GameState|undefined}
 */
Tavla.make_move = function (from, to, state) {
    const legal = Tavla.legal_moves(state);
    const is_legal = legal.some(function (m) {
        return m.from === from && m.to === to;
    });
    if (!is_legal) {
        return undefined;
    }

    const player = state.turn;
    const sign = Tavla.player_sign(player);
    const opp_sign = -sign;
    let board = state.checkers_on_board.slice();
    let p1_bar = state.p1_bar;
    let p2_bar = state.p2_bar;
    let p1_borne_off = state.p1_borne_off;
    let p2_borne_off = state.p2_borne_off;

    // Removes the checker from the source given
    if (from === "bar") {
        if (player === 1) {
            p1_bar -= 1;
        } else {
            p2_bar -= 1;
        }
    } else {
        board[from] = board[from] - sign;
    }

    // The destination is applied
    if (to === "off") {
        if (player === 1) {
            p1_borne_off += 1;
        } else {
            p2_borne_off += 1;
        }
    } else {
        if (board[to] * opp_sign === 1) {
            // Hit a blot
            if (player === 1) {
                p2_bar += 1;
            } else {
                p1_bar += 1;
            }
            board[to] = sign;
        } else {
            board[to] = board[to] + sign;
        }
    }

    // Looks at which dice value was used
    const die_used = (function () {
        if (from === "bar") {
            return (player === 1 ? 24 - to : to + 1);
        }
        if (to === "off") {
            // checking which dice would move the checker off
            const distance = (player === 1 ? from + 1 : 24 - from);
            const exact = state.dice.find(function (d) {
                return d === distance;
            });
            if (exact !== undefined) {
                return exact;
            }
            // Bigger value: uses the smallest die >= given distance
            const valid = state.dice.filter(function (d) {
                return d >= distance;
            });
            return valid.reduce(function (a, b) {
                return (a < b ? a : b);
            });
        }
        return Math.abs(to - from);
    }());

    const new_dice = consume_die(die_used, state.dice);
    const new_phase = (
        p1_borne_off === 15 || p2_borne_off === 15 ? "ended" : state.phase
    );
    const new_turn = (new_phase === "ended" ? null : state.turn);

    return Object.freeze(Object.assign(Object.create(null), state, {
        "checkers_on_board": Object.freeze(board),
        "p1_bar": p1_bar,
        "p2_bar": p2_bar,
        "p1_borne_off": p1_borne_off,
        "p2_borne_off": p2_borne_off,
        "dice": Object.freeze(new_dice),
        "phase": new_phase,
        "turn": new_turn
    }));
};

/**
 * Finoshes current player turn and starts the others.
 * Resets the dice array.
 * @memberof Tavla
 * @function
 * @param {Tavla.GameState} state
 * @returns {Tavla.GameState}
 */
Tavla.end_turn = function (state) {
    if (state.phase === "ended" || state.turn === null) {
        return state;
    }
    return Object.freeze(Object.assign(Object.create(null), state, {
        "dice": Object.freeze([]),
        "turn": Tavla.opponent(state.turn)
    }));
};

/**
 * Returns true if the game state is ended.
 * @memberof Tavla
 * @function
 * @param {Tavla.GameState} state
 * @returns {boolean}
 */
Tavla.is_ended = function (state) {
    return state.phase === "ended";
};

/**
 * Returns the winning player number, or null if the game is not yet over.
 * @memberof Tavla
 * @function
 * @param {Tavla.GameState} state
 * @returns {(1|2|null)}
 */
Tavla.winner = function (state) {
    if (state.p1_borne_off === 15) {
        return 1;
    }
    if (state.p2_borne_off === 15) {
        return 2;
    }
    return null;
};

/**
 * Returns a string representation of the board for debugging purposes.
 * @memberof Tavla
 * @function
 * @param {Tavla.GameState} state
 * @returns {string}
 */
Tavla.to_string = function (state) {
    const top = R.range(12, 24).map(function (i) {
        return String(state.checkers_on_board[i]).padStart(3);
    }).join("");
    const bot = R.range(0, 12).reverse().map(function (i) {
        return String(state.checkers_on_board[i]).padStart(3);
    }).join("");
    const pts_top = R.range(13, 25).map(function (n) {
        return String(n).padStart(3);
    }).join("");
    const pts_bot = R.range(1, 13).reverse().map(function (n) {
        return String(n).padStart(3);
    }).join("");
    return (
        pts_top + "\n" + top + "\n" +
        "bar p1:" + state.p1_bar + " p2:" + state.p2_bar +
        " off p1:" + state.p1_borne_off + " p2:" + state.p2_borne_off +
        " dice:" + state.dice.join(",") + "\n" +
        bot + "\n" + pts_bot
    );
};

export default Object.freeze(Tavla);
