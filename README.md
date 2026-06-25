[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/H6lPFq0J)

# Tavla by Arda Kancal

**My CID Number:** 02589461

A Design Engineering MEng 2nd year, Computing 2, coursework submission.

Tavla is the Turkish take on the old game of backgammon. I have created a browser-based version of Tavla, and I have tried to keep it as simple and realistic as possible. The game is split into a pure JavaScript game module, a set of unit tests, generated API documentation, and the browser interface, and the structure schematic can be seen below:

## Project Structure

```text
web-app/
  Tavla.js              Game state and rules module
  main.js               Browser interaction and rendering
  index.html            Page structure
  default.css           Page styling
  ramda.js              Functional helper library
  tests/
    Tavla.test.js       Unit tests for the game module
jsdoc.json              JSDoc configuration
package.json            npm dependencies and scripts
docs/                   Generated API documentation
```

## Game Module

The logic of the game is fully in `web-app/Tavla.js`.
The board is represented as an array of 24 different signed integers, in which the positive values indicate the checkers of player 1 and the negative values indicate those of player 2. Having a zero means that the column is empty. The rest of the state stores the checkers that are borne off, that are on the bar, remaining dice, the phase, and the turn of the players.

There are functions for:
- starting a new game
- rolling the dice
- finding the legal moves
- doing a move
- hitting blots
- entering from the bar
- bearing off
- finishing a turn
- deciding on the winner

These functions are called by the browser interface rather than being implemented itself.

## Browser Interface

Things I have included in the browser interface:
- A settings pop-up window before the game
- Optional legal-move indicator highlights
- Having an auto dice roll option
- Color selection for checkers
- Rounds per match selection
- A small statistics section to see the stats of the current game
- About section to talk about Tavla rules, history, and how I connect to it.

## Implemented the Rules of Tavla

The rules to model a game of Tavla:
- the standard 24-column board with 15 checkers per player on the board
- Player 1 and Player 2 are moving in opposite directions from left to right and vice versa
- Two dice per turn; however, doubles give four moves
- Legal single-checker moves based on the remaining dice
- Columns are blocked when there are two or more opposing checkers
- A single opposing checker can be hit and moved to the bar
- Hit checker forced to re-enter the board before other moves
- Bearing off starts once all active checkers are on the home section
- Win detection occurs when a player has borne off all 15 checkers
- The turn ends automatically when no dice or moves remain

## Simplifications and Scope

This implementation of the backgammon game has slight differences from the backgammon rules explained here: https://usbgf.org/backgammon-basics-how-to-play/. These choices were most of the time made as Tavla is different than the backgammon, or personal stylistic choices, with just a few for scope alignment.

Simplified or not included:
- Which player to start isn't decided with a dice roll, as having this feature in online implementations doesn't make sense.
- There is no doubling cube, as it doesn't exist in Tavla.
- The game doesn't force the use of the higher die when a single die can be used, as it doesn't exist in Tavla.
- The legal moves are calculated as individual moves, not complete list of possibilities, as something should be left to the player to do.

## Decisions & Opinions

I have strict opinions on Tavla and how things should work and act, thus I thought a section on the choices I made was needed.

I believe that having highlights for legal moves and showing remaining dice counts etc take the meaning out of the game, since it's not a very mentally challenging game. The person playing it should keep track of the game and memorize board positions. However, due to accessibility and the possibility of new players (realistically, to also make it easier to debug), I have made the choice of including an option where the highlights are shown.

I dislike the concept of an online random dice. However, there isn't much that can be done about it other than creating a 3D render environment for the dice and simulating a throw; however, it was out of the scope of the project. I also would have preferred to keep the classic dice look of dots on the surface instead of numbers; however decided to keep numbers to help with accessibility.

Normally, I have very strict opinions on UI I believe that Tavla is something that shouldn't look sleek or put together. Thus, I've decided to keep the UI very simple and clean with a color palette that matches actual backgammon boards.

It really bothers me that when there are more than 5 checkers in a column, it starts counting the number of checkers with a text number, since there is no 3D perception like in the real world. This was the only simple, clear solution to the problem.

The colours of the board, even though they might look a bit too much and dark, I have chosen to keep it this way as this is the proper Tavla experience. I don't agree with using contrasting new colors that don't exist in actual Tavla boards.

## Running the Project

Install dependencies from the project root:
```
npm install
```

Run the unit tests:
```
npm test
```

Generate the API documentation:
```
npx jsdoc -c jsdoc.json
```

Open `web-app/index.html` in a browser to play the game.

## Tests

The test suite is in `web-app/tests/Tavla.test.js`.
The tests focus on the pure game module rather than the browser interface. They cover new game setup, dice rolling, legal movement, bar entry, hitting, bearing off, turn management, immutability, and win detection.

## Documentation

The public API is documented with JSDoc comments in `web-app/Tavla.js`.
After running JSDoc, the generated documentation is written to the `docs/` directory.

## Checklist
### Install dependencies locally
This template relies on a a few packages from the Node Package Manager, npm.
To install them run the following commands in the terminal.
```properties
npm install
```
These won't be uploaded to your repository because of the `.gitignore`.
I'll run the same commands when I download your repos.

### Game Module – API
- [x] Include a `.js ` module file in `/web-app` containing the API using `jsdoc`.
- [x] Update `/jsdoc.json` to point to this module in `.source.include` (line 7)
- [x] Compile jsdoc using the run configuration `Generate Docs`
- [x] Check the generated docs have compiled correctly.

### Game Module – Implementation
- [x] The file above should be fully implemented.

### Unit Tests – Specification
- [x] Write unit test definitions in `/web-app/tests`.
- [x] Check the headings appear in the Testing sidebar.

### Unit Tests – Implementation
- [x] Implement the tests above.

### Web Application
- Implement in `/web-app`
  - [x] `index.html`
  - [x] `default.css`
  - [x] `main.js`
  - [x] Any other files you need to include.

### Finally
- [x] Push to GitHub.
- [x] Sync the changes.
- [x] Check submission on GitHub website.
