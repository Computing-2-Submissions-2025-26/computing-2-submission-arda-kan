/*jslint node*/
import Tavla from "../Tavla.js";
import assert from "assert";

/**
 * Creates a game state based on the new_game() function.
 * utilized to contrusct board positions for testing.
 * @param {object} overrides - properties overriden on the new game state.
 * @returns {Tavla.GameState}
 */
const make_state = function (overrides) {
    return Object.assign(Object.create(null), Tavla.new_game(), overrides);
};

describe("New Game", function () {
    const state = Tavla.new_game();

    it("a new board should have 15 checkers for each player on board", function () {
        const total_p1 = state.checkers_on_board.reduce(
            function (sum, n) { return sum + (n > 0 ? n : 0); },
            0
        );
        const total_p2 = state.checkers_on_board.reduce(
            function (sum, n) { return sum + (n < 0 ? -n : 0); },
            0
        );
        assert.strictEqual(total_p1, 15, "Player 1 should have 15 checkers");
        assert.strictEqual(total_p2, 15, "Player 2 should have 15 checkers");
    });

    it("The game phase is 'start'", function () {
        assert.strictEqual(state.phase, "start");
    });

    it("The game has no dice", function () {
        assert.deepStrictEqual(state.dice, []);
    });

    it("The game starts with Player 1's turn", function () {
        assert.strictEqual(state.turn, 1);
    });

    it("The game board has no checkers on the bar", function () {
        assert.strictEqual(state.p1_bar, 0);
        assert.strictEqual(state.p2_bar, 0);
    });

    it("The game has no checkers borne off", function () {
        assert.strictEqual(state.p1_borne_off, 0);
        assert.strictEqual(state.p2_borne_off, 0);
    });
});

describe("Dice rolling", function () {
    it("roll_dice_with_values returns two dice for non-double values of dice", function () {
        const state = Tavla.roll_dice_with_values(2, 5, Tavla.new_game());
        assert.deepStrictEqual(state.dice, [2, 5]);
    });

    it("roll_dice_with_values returns four equal dice for double dice", function () {
        const state = Tavla.roll_dice_with_values(4, 4, Tavla.new_game());
        assert.deepStrictEqual(state.dice, [4, 4, 4, 4]);
    });

    it("roll_dice_with_values transitions phase from 'start' to 'playing' for the game", function () {
        const state = Tavla.roll_dice_with_values(1, 6, Tavla.new_game());
        assert.strictEqual(state.phase, "playing");
    });

    it("roll_dice gives values between 1 and 6", function () {
        Array.from({length: 30}, function () {
            return Tavla.roll_dice(Tavla.new_game()).dice;
        }).forEach(function (dice) {
            dice.forEach(function (d) {
                assert.ok(d >= 1 && d <= 6, "Each dice should have been between 1–6, but got " + d);
            });
        });
    });

    it("roll_dice produces either 2 or 4 dice per each roll", function () {
        Array.from({length: 30}, function () {
            return Tavla.roll_dice(Tavla.new_game()).dice.length;
        }).forEach(function (len) {
            assert.ok(len === 2 || len === 4, "Dice length should be 2 or 4");
        });
    });
});

describe("Legal Moves — Bar", function () {
    it("Player 1 with a checker on the bar can only make bar entry moves first", function () {
        const state = make_state({
            "p1_bar": 1,
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(moves.length > 0, "There should be at least one bar entry move first");
        assert.ok(
            moves.every(function (m) { return m.from === "bar"; }),
            "Moves must be from the bar"
        );
    });

    it("Player 1 bar entry target is index 24 with dice value retracted", function () {
        const board = new Array(24).fill(0);
        const state = make_state({
            "p1_bar": 1,
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            moves.some(function (m) { return m.from === "bar" && m.to === 21; }),
            "Player 1 should enter on column 22 with dice 3"
        );
    });

    it("Player 2 with a checker on the bar can only make bar entry moves first", function () {
        const state = make_state({
            "p2_bar": 1,
            "phase": "playing",
            "turn": 2,
            "dice": [2]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(moves.length > 0, "There should be at least one bar entry move first for Player 2");
        assert.ok(
            moves.every(function (m) { return m.from === "bar"; }),
            " Moves must be from the bar for Player 2"
        );
    });

    it("Player 2 bar entry target is dice value minus 1 (the column)", function () {
        const board = new Array(24).fill(0);
        const state = make_state({
            "p2_bar": 1,
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 2,
            "dice": [4]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            moves.some(function (m) { return m.from === "bar" && m.to === 3; }),
            "Player 2 should enter on index 3 (column 4) with dice 4"
        );
    });

    it("The bar entry is blocked when the target point has 2+ opposing checkers", function () {
        const board = new Array(24).fill(0);
        board[21] = -2; // two Player 2 checkers will be blocking Player 1's entry point for dice 3
        const state = make_state({
            "p1_bar": 1,
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        const moves = Tavla.legal_moves(state);
        assert.strictEqual(moves.length, 0, "Bar entry should be blocked by an opponent block");
    });
});

describe("Legal Moves on Board", function () {
    it("Landing on an empty column is legal", function () {
        const board = new Array(24).fill(0);
        board[5] = 1;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            moves.some(function (m) { return m.from === 5 && m.to === 2; }),
            "Should be able to move from index 5 to 2 with dice 3"
        );
    });

    it("Landing on an opponent checker (just one) is legal", function () {
        const board = new Array(24).fill(0);
        board[5] = 1;
        board[2] = -1;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            moves.some(function (m) { return m.from === 5 && m.to === 2; }),
            "Should be able to hit an opponent checker singularly"
        );
    });

    it("Landing on a block of opponent checkers is illegal", function () {
        const board = new Array(24).fill(0);
        board[5] = 1;
        board[2] = -2;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            !moves.some(function (m) { return m.to === 2; }),
            "Should not be able to land on a opponent block"
        );
    });

    it("No legal moves exists when dice array is empty", function () {
        const state = make_state({
            "phase": "playing",
            "turn": 1,
            "dice": []
        });
        assert.deepStrictEqual(Tavla.legal_moves(state), []);
    });
});

describe("Making moves", function () {
    it("After a move, the used dice is removed from the dice section", function () {
        const board = new Array(24).fill(0);
        board[5] = 1;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3, 4]
        });
        const next = Tavla.make_move(5, 2, state);
        assert.deepStrictEqual(next.dice, [4]);
    });

    it("After hitting a checker, the opponent checker moves to the bar", function () {
        const board = new Array(24).fill(0);
        board[5] = 1;
        board[2] = -1;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        const next = Tavla.make_move(5, 2, state);
        assert.strictEqual(next.p2_bar, 1, "Opponent checker should move to the bar");
        assert.strictEqual(next.checkers_on_board[2], 1, "Player 1's checker should stay ");
    });

    it("After a move happens, the starting point loses one checker", function () {
        const board = new Array(24).fill(0);
        board[5] = 2;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        const next = Tavla.make_move(5, 2, state);
        assert.strictEqual(next.checkers_on_board[5], 1);
    });

    it("An illegal move outputds undefined", function () {
        const board = new Array(24).fill(0);
        board[5] = 1;
        board[2] = -2;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        assert.strictEqual(
            Tavla.make_move(5, 2, state),
            undefined,
            "Moving onto a block should return undefined"
        );
    });

    it("make_move does not act on the original board, dice, or stats", function () {
        const board = new Array(24).fill(0);
        board[5] = 1;
        board[2] = -1;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "p1_bar": 0,
            "p2_bar": 0,
            "p1_borne_off": 3,
            "p2_borne_off": 2,
            "phase": "playing",
            "turn": 1,
            "dice": [3, 5]
        });
        const orig_board = state.checkers_on_board.slice();
        const orig_dice = state.dice.slice();
        Tavla.make_move(5, 2, state);
        assert.deepStrictEqual(state.checkers_on_board.slice(), orig_board, "board should not be acted on");
        assert.deepStrictEqual(state.dice.slice(), orig_dice, "dice should not be acted on");
        assert.strictEqual(state.p1_bar, 0, "p1_bar should not be acted on");
        assert.strictEqual(state.p2_bar, 0, "p2_bar should not be acted on");
        assert.strictEqual(state.p1_borne_off, 3, "p1_borne_off should not be a acted on");
        assert.strictEqual(state.p2_borne_off, 2, "p2_borne_off should not be acted on");
    });
});

describe("Bearing off checkers", function () {
    it("Player 1 cant bear off if it still has a checker outside the home board", function () {
        const board = new Array(24).fill(0);
        board[5] = 14;
        board[10] = 1;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [5]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            !moves.some(function (m) { return m.to === "off"; }),
            "Should not be able to bear off when it has a checker outside the home section of thr bosrd"
        );
    });

    it("Player 1 can bear off with an exact die value when all checkers are in the home board section", function () {
        const board = new Array(24).fill(0);
        board[2] = 15;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [3]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            moves.some(function (m) { return m.from === 2 && m.to === "off"; }),
            "Player 1 should be able to bear off with an exact dice"
        );
    });

    it("Player 1 can bear off with a bigger die when it is the biggest column", function () {
        const board = new Array(24).fill(0);
        board[1] = 15;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 1,
            "dice": [5]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            moves.some(function (m) { return m.from === 1 && m.to === "off"; }),
            "Player 1 should be bearing off with a bigger dice from the highest occupied column"
        );
    });

    it("Player 2 cant be bearing off with an exact dice value when all checkers are in the home board", function () {
        const board = new Array(24).fill(0);
        board[21] = -15; // P2 checkers are negative; index 21 is in Player 2 home (indices 18–23)
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 2,
            "dice": [3]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            moves.some(function (m) { return m.from === 21 && m.to === "off"; }),
            "Player 2 should be able to bear off with an exact dice"
        );
    });

    it("Player 2 can bear off with a bigger dicee when it is the lowest occupied column", function () {
        const board = new Array(24).fill(0);
        board[22] = -15; // P2 checkers are negative; index 22 is in P2 home
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "phase": "playing",
            "turn": 2,
            "dice": [5]
        });
        const moves = Tavla.legal_moves(state);
        assert.ok(
            moves.some(function (m) { return m.from === 22 && m.to === "off"; }),
            "Player 2 should be bearing off with a bigger dice from the lowest occupied column"
        );
    });

    it("Bearing off the 15th checker sets phase to 'ended' for the game", function () {
        const board = new Array(24).fill(0);
        board[0] = 1;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "p1_borne_off": 14,
            "phase": "playing",
            "turn": 1,
            "dice": [1]
        });
        const next = Tavla.make_move(0, "off", state);
        assert.strictEqual(next.phase, "ended");
    });
});

describe("Win condition", function () {
    it("The game is not ended", function () {
        assert.strictEqual(Tavla.is_ended(Tavla.new_game()), false);
    });

    it("Winner is null when the game has not ended", function () {
        assert.strictEqual(Tavla.winner(Tavla.new_game()), null);
    });

    it("Winner is 1 when Player 1 has borne off all 15 checkers", function () {
        const state = make_state({
            "p1_borne_off": 15,
            "phase": "ended",
            "turn": null
        });
        assert.strictEqual(Tavla.winner(state), 1);
    });

    it("Winner is 2 when Player 2 has borne off all 15 checkers", function () {
        const state = make_state({
            "p2_borne_off": 15,
            "phase": "ended",
            "turn": null
        });
        assert.strictEqual(Tavla.winner(state), 2);
    });

    it("is_ended ourputs true when phase is 'ended'", function () {
        const state = make_state({
            "p1_borne_off": 15,
            "phase": "ended",
            "turn": null
        });
        assert.strictEqual(Tavla.is_ended(state), true);
    });
});

describe("Turn management", function () {
    it("end_turn switches from Player 1 to Player 2", function () {
        const state = make_state({"phase": "playing", "turn": 1, "dice": []});
        assert.strictEqual(Tavla.end_turn(state).turn, 2);
    });

    it("end_turn switches from Player 2 to Player 1", function () {
        const state = make_state({"phase": "playing", "turn": 2, "dice": []});
        assert.strictEqual(Tavla.end_turn(state).turn, 1);
    });

    it("end_turn resets dice to an empty array when called", function () {
        const state = make_state({"phase": "playing", "turn": 1, "dice": [3, 5]});
        assert.deepStrictEqual(Tavla.end_turn(state).dice, []);
    });
});

describe("all_checkers_in_home", function () {
    it("Returns false when a checker is outside the home board section", function () {
        const board = new Array(24).fill(0);
        board[5] = 14;
        board[10] = 1;
        const state = make_state({"checkers_on_board": Object.freeze(board)});
        assert.strictEqual(Tavla.all_checkers_in_home(1, state), false);
    });

    it("Returns true when all of Player 1 checkers are in columns 1–6", function () {
        const board = new Array(24).fill(0);
        board[0] = 5;
        board[2] = 5;
        board[4] = 5;
        const state = make_state({"checkers_on_board": Object.freeze(board)});
        assert.strictEqual(Tavla.all_checkers_in_home(1, state), true);
    });

    it("Returns false when Player 1 has some checkers on the bar", function () {
        const board = new Array(24).fill(0);
        board[0] = 15;
        const state = make_state({
            "checkers_on_board": Object.freeze(board),
            "p1_bar": 1
        });
        assert.strictEqual(Tavla.all_checkers_in_home(1, state), false);
    });
});
