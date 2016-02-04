(function (Orbs) {
  'use strict';

  var config = {
    debug: false,
    sound: true,

    classes: {
      sidebar: 'game__sidebar',
      container: 'game',
      board: 'game__content',
      boardGrid: 'game__grid',
      boardRunning: 'game--running',
      boardDisabled: 'game--disabled',
      boardGameOver: 'game--game-over',
      boardWinning: 'game--winning',
      button: {
        list: 'game__buttons',
        default: 'game__buttons-item',
        disabled: 'game__buttons-item--disabled',
        restart: 'game__buttons-item--restart',
        undo: 'game__buttons-item--undo',
        instructions: 'game__buttons-item--instructions'
      },
      muteButton: 'game__sidebar-mute-button',
      muteButtonActive: 'game__sidebar-mute-button--active',
      instructionsContainer: 'game__instructions-container',
      instructionsContainerAct: 'game__instructions-container--active',
      modeList: 'game__modes',
      modeItem: 'game__modes-item',
      point: 'game__point',
      pointInnerContainer: 'game__point-inner-container',
      pointsContainer: 'game__point-container',
      removePointsContainer: 'game__point-container--removed',
      removePoint: 'game__point--removed',
      scoreboard: {
        digit: 'game__scoreboard-count-digit',
        container: 'game__scoreboard',
        name: 'game__scoreboard-title',
        count: 'game__scoreboard-count',
        increase: 'game__scoreboard-count--increase',
        decrease: 'game__scoreboard-count--decrease'
      },
      modesBoard: {
        list: 'game__modes',
        default: 'game__modes-item',
        title: 'game__modes-item-title',
        count: 'game__modes-item-count',
        label: 'game__modes-item-label',
        active: 'game__modes-item--active'
      },
      confirm: {
        containerDisabled: 'game__confirm--disabled'
      }
    },

    instructionsHtml: '' +
    '<div class="game__instructions" id="instructions">' +
    '  <h1 class="game__instructions-title game__instructions-title--general">' + 'Instructions' + '</h1>' +
    '  <p class="game__instructions-text game__instructions-text--general">' + 'The overall objective of the game is to shift the tiles and align 3 or 4 of the same color' + '</p>' +
    '  <div class="game__instructions-moving">' +
    '    <h3 class="game__instructions-title">' + 'Moving tiles' + '</h3>' +
    '    <p class="game__instructions-text">' + 'Shift all pieces to one side of the board with you arrow keys' + '</p>' +
    '    <div class="game__instructions-moving-tiles">' +
    '      <div class="game__instructions-tile game__instructions-tile--left"></div>' +
    '      <div class="game__instructions-tile game__instructions-tile--bottom"></div>' +
    '      <div class="game__instructions-tile game__instructions-tile--right"></div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="game__instructions-earning">' +
    '    <h3 class="game__instructions-title">' + 'Earning points' + '</h3>' +
    '    <p class="game__instructions-text">' +
             'Easy: Align 3 tiles to earn' + '<span>' + ' 50 points' + '</span>' + '<br>' +
             'Medium: Align 3 tiles to earn' + '<span>' + ' 75 points' + '</span>' + '<br>' +
             'Hard: Align 3 tiles to earn' + '<span>' + ' 100 points' + '</span>' + '<br>' +
    '    </p>' +
    '    <div class="game__instructions-earning-tiles">' +
    '      <div class="game__instructions-tile"></div>' +
    '      <div class="game__instructions-tile"></div>' +
    '      <div class="game__instructions-tile"></div>' +
    '    </div>' +
    '    <span class="game__instructions-score">' + '50, 75, 100 points' + '</span>' +
    '  </div>' +
    '  <button class="game__instructions-button" id="instructions-ok">Ok</button>' +
    '</div>',

    confirmHtml: '' +
    '<div class="game__confirm" id="confirm">' +
    '  <p class="game__confirm-text">%text%</p>' +
    '  <button class="game__confirm-button game__confirm-button--no" id="confirm-no">No</button>' +
    '  <button class="game__confirm-button game__confirm-button--yes" id="confirm-yes">Yes</button>' +
    '</div>',

    confirmRestartText: 'Would you like to continue on and do the restart? All data will be saved.',
    confirmGameOverText: 'Oh no, you lost. Play again?',
    confirmChangeDifficultyText: 'Would you like to continue on and change difficulty level? All data will be saved.',
    confirmWinningText: 'Awesome, You are cool!!! would you like to improve your high-score?',
    moveTimeout: 700,
    removeTimeout: 600,
    increaseScoreTimeout: 400,

    sounds: {
      move: 'sounds/soundMove.mp3',
      undo: 'sounds/soundUndo.mp3',
      winning: 'sounds/soundWinning.mp3',
      gameOver: 'sounds/soundGameOver.mp3'
    },

    modes: {
      easy: {
        settings: {
          name: 'Easy',
          size: 9,

          colors: [
            'rgb(224, 122, 70)',
            'rgb(224, 217, 85)',
            'rgb(84, 159, 201)',
            'rgb(211, 73, 73)',
            'rgb(55, 201, 124)'
          ],

          pointsAmountAfterStart: 60,
          pointsAmountAfterMove: function () {
            return 1;
          },
          pointsAmountAfterRemove: function () {
            return 0;
          },
          pointsAmountInLineForRemove: 3,

          minimalAddingScore: 25,
          percentScoreForAddingPoints: 2
        }
      },
      medium: {
        settings: {
          name: 'Medium',
          size: 8,

          colors: [
            'rgba(224, 122, 70, 1)',
            'rgba(224, 217, 85, 1)',
            'rgba(84, 159, 201, 1)',
            'rgba(211, 73, 73, 1)',
            'rgba(55, 201, 124,1 )'
          ],

          pointsAmountAfterStart: 18,
          pointsAmountAfterMove: function () {
            return 1;
          },
          pointsAmountAfterRemove: function (count) {
            return count * 0.7;
          },
          pointsAmountInLineForRemove: 3,

          minimalAddingScore: 50,
          percentScoreForAddingPoints: 2
        }
      },
      hard: {
        settings: {
          name: 'Hard',
          size: 7,

          colors: [
            'rgb(224, 122, 70)',
            'rgb(224, 217, 85)',
            'rgb(84, 159, 201)',
            'rgb(211, 73, 73)',
            'rgb(55, 201, 124)'
          ],

          pointsAmountAfterStart: 12,
          pointsAmountAfterMove: function () {
            return game.data.points.length <= 16 ? 1 : 2;
          }

          ,
          pointsAmountAfterRemove: function () {
            return game.data.points.length <= 16 ? 1 : 2;
          }
          ,
          pointsAmountInLineForRemove: 3,

          minimalAddingScore: 75,
          percentScoreForAddingPoints: 2,

          randomMode: true
        }
      }
    }
  };

  var game = new Orbs(document.getElementById('game'), config);

})(Orbs);
