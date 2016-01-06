(function (Orbs) {
  'use strict';

  var config = {
    debug: false,

    classes: {
      sidebar: 'game__sidebar',
      container: 'game',
      board: 'game__content',
      boardRunning: 'game--running',
      boardDisabled: 'game--disabled',
      button: {
        list: 'game__buttons',
        default: 'game__buttons-item',
        disabled: 'game__buttons-item--disabled',
        restart: 'game__buttons-item--restart',
        undo: 'game__buttons-item--undo'
      },
      helpButton: 'game__help-button',
      helpContainer: 'game__help-container',
      helpContainerAct: 'game__help-container--active',
      modeList: 'game__modes',
      modeItem: 'game__modes-item',
      point: 'game__point',
      removePoint: 'game__point--remove',
      scoreboard: {
        container: 'game__scoreboard',
        name: 'game__scoreboard-title',
        count: 'game__scoreboard-count'
      },
      highScoreboards: {
        list: 'game__high-scores',
        default: 'game__high-scores-item',
        title: 'game__high-scores-item-title',
        count: 'game__high-scores-item-count',
        label: 'game__high-scores-item-label',
        active: 'game__high-scores-item--active'
      },
      alert: {
        containerDisabled: 'game__alert--disabled'
      }
    },

    alertHtml: '' +
    '<div class="game__alert" id="confirm">' +
    '  <p class="game__alert-text">%text%</p>' +
    '  <button class="game__alert-button game__alert-button--yes" id="confirm-yes">Yes</button>' +
    '  <button class="game__alert-button game__alert-button--no" id="confirm-no">No</button>' +
    '</div>',

    alertRestartText: 'Do you want to continue on and do the restart? All data will be saved.',
    alertChangeDifficultyText: 'Do you want to continue on and change difficulty level? All data will be saved.',
    alertVictoryText: 'Awesome, You are cool!!!',
    moveTimeout: 500,
    animationDuration: 500,

    modes: {
      easy: {
        settings: {
          name: 'Easy',
          size: 10,

          colors: [
            '#c64e4e',
            '#599abe',
            '#d6d05c',
            '#d77d4f',
            '#3bb675'
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
          name: 'Medium kldasda askld; kas',
          size: 8,

          colors: [
            '#c64e4e',
            '#599abe',
            '#d6d05c',
            '#d77d4f',
            '#3bb675'
          ],

          pointsAmountAfterStart: 16,
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
          size: 9,

          colors: [
            '#c64e4e',
            '#599abe',
            '#d6d05c',
            '#d77d4f',
            '#3bb675'
          ],

          pointsAmountAfterStart: 20,
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
          percentScoreForAddingPoints: 2
        }
      }
    }
  };

  var game = new Orbs(document.getElementById('game'), config);

})(Orbs);