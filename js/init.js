var Orbs;

(function () {
  'use strict';

  Orbs = function (_container, config) {
    var self = this;

    self.config = config;
    self.settings = {};

    self.data = {
      _container: _container,
      _board: undefined,
      _sidebar: undefined,
      itemSize: 0,
      points: [],
      allPointsCoordinates: [],
      keyDownLock: false,
      running: false,
      init: false,
      scoresList: {
        modesButton: {
          easy: {
            _element: undefined,
            _count: undefined,
            name: 'Easy',
            count: 0
          },
          medium: {
            _element: undefined,
            _count: undefined,
            name: 'Medium',
            count: 0
          },
          hard: {
            _element: undefined,
            _count: undefined,
            name: 'Hard',
            count: 0
          }
        },
        score: {
          _element: undefined,
          count: 0
        }
      },
      buttonsList: {
        undo: {
          _element: undefined,
          name: 'Undo',
          description: 'Description for Undo (key \'U\')',
          callback: function () {
            self.undo();
          }
        },
        restart: {
          _element: undefined,
          name: 'Restart',
          description: 'Description for Restart (key \'R\')',
          callback: function () {
            self.restart();
          }
        }
      }
    };

    self.debug = function (message) {
      if (self.config.debug) {
        console.debug(message);
      }
    };

    self.setCookie = function (name, value) {
      document.cookie = name + '=' + value + '; path=/';
    };

    self.appendChildren = function (_parent, children) {
      if (typeof children === 'string') {
        var _div = document.createElement('div');
        _div.innerHTML = children;
        children = _div.childNodes;
        _div.remove();
      }

      if (typeof children === 'object' && typeof children.length === 'undefined') {
        children = [children];
      }

      if (typeof children !== 'object') {
        return false;
      }

      for (var i = 0; i < children.length; i++) {
        _parent.appendChild(children[i]);
      }
    };

    self.checkLocalStorage = function (localStorageValue) {
      return !(localStorageValue === 'undefined' || localStorageValue === 'false');
    };

    self.updateHighScore = function (difficultyLevel) {
      difficultyLevel = difficultyLevel.toLowerCase();

      if (self.data.scoresList.modesButton[difficultyLevel].count <= self.data.scoresList.score.count) {
        self.data.scoresList.modesButton[difficultyLevel].count = self.data.scoresList.score.count;

        self.setCookie(difficultyLevel + ':' + 'high-score', self.data.scoresList.modesButton[difficultyLevel].count);

        self.data.scoresList.modesButton[difficultyLevel]._count.textContent = self.data.scoresList.modesButton[difficultyLevel].count;
      }
    };

    self.updateScore = function (countPoints) {
      self.data.scoresList.score.count += self.settings.minimalAddingScore + ((countPoints - self.settings.pointsAmountInLineForRemove) * self.settings.minimalAddingScore * self.settings.percentScoreForAddingPoints);
      self.data.scoresList.score._element.textContent = self.data.scoresList.score.count;

      self.updateHighScore(self.settings.id);
    };

    self.removeDOMElement = function (_element) {
      if (_element && typeof _element.parentElement !== 'undefined') {
        _element.parentElement.removeChild(_element);
      }
    };

    self.clearPoints = function (pointsList) {
      self.debug('clearPoints:');
      self.debug(pointsList);

      for (var i = 0; i < pointsList.length; i++) {
        var points = pointsList[i];

        for (var j = 0; j < points.length; j++) {
          var point = points[j],
              _point = point._element,
              pointIndexInAllPointsList = self.data.points.indexOf(point);

          if (pointIndexInAllPointsList > -1) {
            _point.classList.add(self.config.classes.removePoint); // point - display: none;

            (function (_point) {
              setTimeout(function () {
                self.removeDOMElement(_point);
              }, self.config.animationDuration);
            })(_point);

            point.forDeleting = true;
          }
        }

        self.updateScore(points.length);
      }
    };

    self.sortByProperties = function (array, propertyFirst, propertySecond) {
      array.sort(function (a, b) {
        var result = a[propertyFirst] - b[propertyFirst];
        result = result > 0 ? 1 : result < 0 ? -1 : a[propertySecond] - b[propertySecond];

        return result;
      });
    };

    self.checkSameColoredPoints = function () {
      var axises = ['x', 'y'],
          sameColoredPointsList = [];

      self.debug('------------');

      for (var i = 0; i < axises.length; i++) { // at the beginning do it for x-y and than for inversion elements (row and colomn)
        var axis = axises[i],
            alternativeAxis = axis === 'x' ? 'y' : 'x';

        self.debug('axis: ' + axis);

        self.sortByProperties(self.data.points, alternativeAxis, axis); // sort all points on board by y than by x

        var prevColor = '',
            prevPosition = 0,
            prevLine = 0,
            sameColoredPoints = [];

        for (var j = 0; j < self.data.points.length; j++) {  // take points and compare them
          var point = self.data.points[j];

          self.debug(point);

          if (point.color === prevColor && Math.abs(point[axis] - prevPosition) === 1 && prevLine === point[alternativeAxis]) {
            sameColoredPoints.push(point);
          } else {
            if (sameColoredPoints.length >= self.settings.pointsAmountInLineForRemove) { // if (same color points >= 3 ) push in common list
              sameColoredPointsList.push(sameColoredPoints);
              self.debug(sameColoredPoints);
            }

            sameColoredPoints = [point];
          }

          prevColor = point.color;
          prevPosition = point[axis];
          prevLine = point[alternativeAxis];
        }

        if (sameColoredPoints.length >= self.settings.pointsAmountInLineForRemove) {
          sameColoredPointsList.push(sameColoredPoints);
        }
      }

      return sameColoredPointsList; // return points with display: none;
    };

    self.sortByProperty = function (array, property, direction) {
      if (typeof direction === 'undefined') {
        direction = +1;
      }

      array.sort(function (a, b) {
        return (a[property] - b[property]) * direction;
      });
    };

    self.sound = function (soundEvent)  {
      var audio = new Audio(); // Создаём новый элемент Audio

      switch (soundEvent) {
        case 'move':
          audio.src = 'sounds/soundMove.mp3';
          break;
        case 'undo':
          audio.src = 'sounds/soundUndo.mp3';
          break;
        case 'game over':
          audio.src = 'sounds/soundGameOver.mp3';
          break;
        case 'victory':
          audio.src = 'sounds/soundVictory.mp3';
          break;
      }
      
      audio.autoplay = true; // Автоматически запускаем
    };

    self.movePoints = function (direction) {
      if (!self.data.running || self.data.keyDownLock) {
        return false;
      }

      self.data.keyDownLock = true;
      self.data.running = false;

      localStorage['points'] = JSON.stringify(self.data.points);
      localStorage['oldScore'] = self.data.scoresList.score.count;

      var countPointsforVictory = 0,
          countChanges = 0,
          startLines = [];

      var axis = direction === 'left' || direction === 'right' ? 'x' : 'y', // define axis Ox or Oy
          alternativeAxis = axis === 'x' ? 'y' : 'x';

      direction = direction === 'left' || direction === 'top' ? +1 : -1; // define starting item and ending item

      self.sortByProperty(self.data.points, axis, direction); // inverse?

      for (var i = 0; i < self.settings.size; i++) {
        startLines.push(0);
      }

      var oldPoints = self.data.points.slice(0);

      for (var j = 0; j < self.data.points.length; j++) {
        var point = self.data.points[j];

        if (point.forDeleting) {
          self.data.points.splice(j, 1);
          j--;
          countPointsforVictory++;
          continue;
        }

        var newCoordinate = direction > 0 ? startLines[point[alternativeAxis]] : self.settings.size - startLines[point[alternativeAxis]] - 1;

        point['oldX'] = point['x'];
        point['oldY'] = point['y'];

        if (point[axis] !== newCoordinate) {
          point[axis] = newCoordinate;

          self.changeCoordinates(point);

          countChanges++;
        }

        startLines[point[alternativeAxis]]++;
      }

      if (countChanges) {
        self.sound('move');

        if (!self.checkLocalStorage(localStorage['hasUndo'])) {
          localStorage['hasUndo'] = true;
          self.data.buttonsList.undo.classList.remove(self.config.classes.button.disabled);
        }

        var coloredPointsAmount = self.checkSameColoredPoints();

        self.generateRandomPoints(coloredPointsAmount.length ? self.settings.pointsAmountAfterRemove() : self.settings.pointsAmountAfterMove());

        self.clearPoints(coloredPointsAmount); // delete points, not DOM elements

        if (self.data.points.length === self.settings.size * self.settings.size) {
          self.gameOver();
        } else if (self.checkVictory()) {
          self.victory();
        }
      } else {
        self.data.points = oldPoints.slice(0);
      }

      setTimeout(function () {
        self.data.running = true;
      }, self.config.moveTimeout);
    };

    self.changeCoordinates = function (point) {
      point._element.style.top = (point.y * self.data.itemSize) + '%';
      point._element.style.left = (point.x * self.data.itemSize) + '%';
    };

    self.createPoint = function (x, y, color) {
      var _point = document.createElement('li');

      _point.classList.add(self.config.classes.point);
      _point.style.width = self.data.itemSize + '%';
      _point.style.height = self.data.itemSize + '%';
      _point.style['background-color'] = color;
      _point.setAttribute('data-color', color);

      var point = {
        x: x,
        y: y,
        oldX: undefined,
        oldY: undefined,
        color: color,
        forDeleting: false,
        _element: _point
      };

      self.changeCoordinates(point);

      self.data.points.push(point);

      self.data._board.appendChild(_point); // add on board

      self.debug(point);
    };

    self.checkColorOfPoints = function () {
      var remainingColors = [],
          colors = self.settings.colors.slice(0);

      for (var i = 0; i < self.data.points.length; i++) {
        var point = self.data.points[i];

        remainingColors.push(colors[colors.indexOf(point.color)]);
      }

      return remainingColors;
    };

    self.getRandomColor = function (x, y) {
      var colors,
          minPointsAmount = (self.settings.size * self.settings.size) / 3 - 1;

      if ((self.data.points.length <= minPointsAmount) && (self.data.init === false)) {
        colors = self.checkColorOfPoints().slice(0);
      } else {
        colors = self.settings.colors.slice(0);
      }

      for (var i = 0; i < self.data.points.length; i++) {
        var point = self.data.points[i];

        if ((point.x === x && Math.abs(point.y - y) === 1) ||
            (point.y === y && Math.abs(point.x - x) === 1)) {
          colors.splice(colors.indexOf(point.color), 1); // cut the color from array
        }
      }

      return colors[Math.floor(Math.random() * colors.length)];
    };

    self.getEmptyPlaces = function () {
      var emptyPointsList = [];

      for (var i = 0; i < self.data.points.length; i++) {
        var point = self.data.points[i];

        self.data.allPointsCoordinates[point.x][point.y] = false;
      }

      for (var x = 0; x < self.settings.size; x++) {
        for (var y = 0; y < self.settings.size; y++) {
          if (self.data.allPointsCoordinates[x][y] === true) {
            emptyPointsList.push({x: x, y: y});
          }
          self.data.allPointsCoordinates[x][y] = true;
        }
      }

      return emptyPointsList;
    };

    self.generateRandomPoint = function () {
      var emptyPlaces = self.getEmptyPlaces();

      if (!emptyPlaces.length) {
        emptyPlaces = self.getEmptyPlaces(); // first iteration emptyPlaces[64]
      }

      var currentPointCoordinates = emptyPlaces[Math.floor(Math.random() * emptyPlaces.length)]; // take random coordinate and devide it into to path - arr[0 , 2]

      self.createPoint(
          currentPointCoordinates.x,
          currentPointCoordinates.y,
          self.getRandomColor(currentPointCoordinates.x, currentPointCoordinates.y)
      );
    };

    self.generateRandomPoints = function (amount) {
      self.data.running = false;

      if (amount + self.data.points.length > self.settings.size * self.settings.size) { // self.settings.size == 8, amount == 2 (def?)
        amount = self.settings.size * self.settings.size - self.data.points.length; // when we can't add more points (all points==amount) because field can be almost full
      }

      self.debug('generate points:');

      for (var i = 0; i < amount; i++) {
        self.generateRandomPoint();
      }

      self.data.running = true;
    };

    self.undo = function () {
      self.sound('undo');

      if (self.checkLocalStorage(localStorage['hasUndo'])) {
        localStorage['hasUndo'] = false;
        self.data.buttonsList.undo.classList.add(self.config.classes.button.disabled);

        if (self.data._board.classList.contains(self.config.classes.boardGameOver)) {
          self.data._board.classList.remove(self.config.classes.boardGameOver);
        }
        if (self.data._board.classList.contains(self.config.classes.boardVictory)) {
          self.data._board.classList.remove(self.config.classes.boardVictory);
        }

        self.data.scoresList.score.count = parseInt(localStorage['oldScore']);
        self.data.scoresList.score._element.textContent = self.data.scoresList.score.count;

        for (var i = self.data.points.length - 1; i >= 0; i--) {
          var point = self.data.points[i];

          if (point.forDeleting) {
            self.createPoint(point.oldX, point.oldY, point.color);
            self.data.points.splice(i, 1);
          } else if (typeof point.oldX !== 'undefined' && typeof point.oldY !== 'undefined') {
            point.x = point.oldX;
            point.y = point.oldY;
            point.oldX = undefined;
            point.oldY = undefined;

            self.changeCoordinates(point);
          } else {
            self.removeDOMElement(point._element);
            self.data.points.splice(i, 1);
          }
        }
      }
    };

    self.restart = function () {
      self.openAlert(self.config.alertRestartText, function () {
        localStorage['hasUndo'] = false;
        self.data.buttonsList.undo.classList.add(self.config.classes.button.disabled);

        self.generateBoard();
      });
    };

    self.gameOver = function () {
      self.sound('game over');

      self.data.running = false;

      self.data._board.setAttribute('data-message', 'GAME OVER');
      self.data._board.classList.add(self.config.classes.boardGameOver);

      self.openAlert(self.config.alertGameOverText, function () {
        self.generateBoard();
      });
    };

    self.checkVictory = function () {
      for (var i = 0; i < self.data.points.length; i++) {
        if (self.data.points[i].forDeleting === false) {
          return false;
        }
      }
      return true;
    };

    self.victory = function () {
      self.sound('victory');

      self.data.running = false;

      self.data._board.setAttribute('data-message', 'VICTORY!!!');
      self.data._board.classList.add(self.config.classes.boardVictory);

      // add some cartoon/animation about victory...

      self.openAlert(self.config.alertVictoryText, function () {
        self.generateBoard();
      });
    };

    self.resetScore = function () {
      if (self.data.scoresList.score.count) {
        self.data.scoresList.score.count = 0;
        self.data.scoresList.score._element.textContent = self.data.scoresList.score.count;
      }
    };

    self.clearBoard = function () {
      for (var i = self.data.points.length - 1; i >= 0; i--) {
        self.data.points.splice(i, 1);
      }

      self.data._board.innerHTML = '';

      self.resetScore();
    };

    self.generateCoordinatesList = function () {
      self.data.allPointsCoordinates = [];

      for (var x = 0; x < self.settings.size; x++) {
        self.data.allPointsCoordinates.push([]);

        for (var y = 0; y < self.settings.size; y++) {
          self.data.allPointsCoordinates[x][y] = true;
        }
      }
    };

    self.generateStartPoints = function (mode) {
      self.changeMode(mode);

      localStorage['hasUndo'] = false;
      self.data.buttonsList.undo.classList.add(self.config.classes.button.disabled);

      self.generateRandomPoints(self.settings.pointsAmountAfterStart);

      localStorage['oldScore'] = 0;
      localStorage['points'] = JSON.stringify(self.data.points);
    };

    self.changeMode = function (mode) {
      if (typeof mode === 'undefined' && typeof self.settings !== 'undefined') {
        mode = self.settings.id;
      } else {
        self.settings = self.config.modes[mode].settings;
        self.settings.id = mode;
      }

      localStorage['mode'] = mode;

      for (var difficultyId in self.data.scoresList.modesButton) {
        self.data.scoresList.modesButton[difficultyId]._element.classList.remove(self.config.classes.modesBoard.active);
      }

      self.data.scoresList.modesButton[self.settings.id]._element.classList.add(self.config.classes.modesBoard.active); // why element is undefined???

      self.data.itemSize = 100 / self.settings.size;

      self.generateCoordinatesList(); // array of object with pairs (x, y)
    };

    self.generateBoard = function (mode, init) {
      if (typeof init === 'undefined') {
        init = false;
      }

      self.data.init = true;

      self.clearBoard();

      if (init) {
        var oldPoints = JSON.parse(localStorage['points']);

        if (oldPoints.length) {
          self.changeMode(localStorage['mode']);

          self.data.scoresList.score.count = parseInt(localStorage['oldScore']);
          self.data.scoresList.score._element.textContent = self.data.scoresList.score.count;

          for (var i = 0; i < oldPoints.length; i++) {
            self.createPoint(oldPoints[i].x, oldPoints[i].y, oldPoints[i].color);
          }
        } else {
          self.generateStartPoints(mode);
        }
      } else {
        self.generateStartPoints(mode);
      }

      self.data.init = false;

      if (self.data._board.classList.contains(self.config.classes.boardGameOver)) {
        self.data._board.classList.remove(self.config.classes.boardGameOver);
      }
      if (self.data._board.classList.contains(self.config.classes.boardVictory)) {
        self.data._board.classList.remove(self.config.classes.boardVictory);
      }

      self.data._board.classList.add(self.config.classes.boardRunning);

      self.data.running = true;
    };

    self.generateButtons = function () {
      var _buttonsList = document.createElement('ul');
      _buttonsList.classList.add(self.config.classes.button.list);

      for (var buttonId in self.data.buttonsList) {
        var button = self.data.buttonsList[buttonId],
            _button = document.createElement('li');

        _button.textContent = button.name;
        _button.setAttribute('title', button.description);
        _button.classList.add(self.config.classes.button.default);
        _button.classList.add(self.config.classes.button[buttonId]);

        self.data.buttonsList[buttonId] = _button;

        if (buttonId === 'undo' && !self.checkLocalStorage(localStorage['hasUndo'])) {
          _button.classList.add(self.config.classes.button.disabled);
        }

        _button.addEventListener('click', button.callback);

        _buttonsList.appendChild(_button);
      }

      self.data._container.appendChild(_buttonsList);
    };

    self.openAlert = function (text, callback) {
      if (text !== self.config.alertGameOverText) {
        self.data._container.classList.add(self.config.classes.boardDisabled);
      }
      self.data._container.classList.add(self.config.classes.boardDisabled);
      self.appendChildren(self.data._container, self.config.alertHtml.replace(/%text%/g, text));

      self.data.running = false;

      function alertKeyDown(e) {
        if (!self.data.keyDownLock) {
          self.data.keyDownLock = true;
          switch(e.keyCode) {
            case 89: // Y
            case 13: // Enter
              confirmYes();
              break;
            case 78: // N
            case 27: // Esc
              confirmNo();
              break;
          }
        }
      }

      function confirmYes() {
        if (typeof callback === 'function') {
          callback();
        }
        self.removeDOMElement(document.getElementById('confirm'));

        self.data._container.classList.remove(self.config.classes.boardDisabled);

        document.removeEventListener('keydown', alertKeyDown);
      }

      function confirmNo() {
        self.data._container.classList.remove(self.config.classes.boardDisabled);

        self.data.running = true;

        self.removeDOMElement(document.getElementById('confirm'));

        document.removeEventListener('keydown', alertKeyDown);
      }

      document.addEventListener('keydown', alertKeyDown);

      document.getElementById('confirm-no').addEventListener('click', function () {
        confirmNo();
      });

      document.getElementById('confirm-yes').addEventListener('click', function () {
        confirmYes();
      });
    };

    self.addHelp = function () {
      var _helpButton = document.createElement('div'),
          _helpContainer = document.createElement('div');

      _helpButton.textContent = 'Help';
      _helpButton.classList.add(self.config.classes.helpButton);
      _helpContainer.classList.add(self.config.classes.helpContainer);

      _helpButton.addEventListener('click', function () {
        if (_helpContainer.classList.contains(self.config.classes.helpContainerAct)) {
          _helpContainer.classList.remove(self.config.classes.helpContainerAct);
        } else {
          _helpContainer.classList.add(self.config.classes.helpContainerAct);
        }
      });

      self.data._sidebar.appendChild(_helpButton);
      self.data._sidebar.appendChild(_helpContainer);
    };

    self.getCookie = function (name) {
      var matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));

      return matches ? decodeURIComponent(matches[1]) : undefined;
    };

    self.generateScoreboard = function () {
      for (var difficultyId in self.data.scoresList.modesButton) {
        self.data.scoresList.modesButton[difficultyId].count = self.getCookie(difficultyId + ':' + 'high-score');

        if (!self.data.scoresList.modesButton[difficultyId].count) {
          self.data.scoresList.modesButton[difficultyId].count = 0;
        }

        self.data.scoresList.modesButton[difficultyId]._count.textContent = self.data.scoresList.modesButton[difficultyId].count;
      }
    };

    self.generateModeButton = function (_modesButtonList, mode) {
      var _mode = document.createElement('li'),
          _modeTitle = document.createElement('span'),
          _modeLabel = document.createElement('span'),
          _modeCounter = document.createElement('span');

      _mode.classList.add(self.config.classes.modesBoard.default);
      _mode.classList.add(self.config.classes.modesBoard.default + '--' + mode.id);
      _modeTitle.classList.add(self.config.classes.modesBoard.title);
      _modeTitle.textContent = mode.name;
      _modeLabel.classList.add(self.config.classes.modesBoard.label);
      _modeLabel.textContent = 'Highscore';
      _modeCounter.classList.add(self.config.classes.modesBoard.count);
      _modeCounter.textContent = mode.count;

      self.data.scoresList.modesButton[mode.id]._element = _mode;
      self.data.scoresList.modesButton[mode.id]._count = _modeCounter;

      _mode.appendChild(_modeTitle);
      _mode.appendChild(_modeLabel);
      _mode.appendChild(_modeCounter);

      _modesButtonList.appendChild(_mode);

      _mode.addEventListener('click', function () {
        if (self.settings.id !== mode.id) {
          self.openAlert(self.config.alertChangeDifficultyText, function () {
            self.generateBoard(mode.id);
          });
        }
      });
    };

    self.generateSidebar = function () {
      var _scoreboardContainer = document.createElement('div'),
          _scoreboardCount = document.createElement('span');

      _scoreboardContainer.classList.add(self.config.classes.scoreboard.container);
      _scoreboardCount.classList.add(self.config.classes.scoreboard.count);

      _scoreboardCount.textContent = self.data.scoresList.score.count;

      _scoreboardContainer.appendChild(_scoreboardCount);

      self.data.scoresList.score._element = _scoreboardCount;
      self.data._sidebar.appendChild(_scoreboardContainer);

      var _modesButtonList = document.createElement('ul');

      _modesButtonList.classList.add(self.config.classes.modesBoard.list);

      for (var modeId in self.data.scoresList.modesButton) {
        var mode = self.data.scoresList.modesButton[modeId];
        mode.id = modeId;

        self.generateModeButton(_modesButtonList, mode);
      }

      self.data._sidebar.appendChild(_modesButtonList);
      self.generateScoreboard();
    };

    self.generateGame = function () {
      self.data._container.classList.add(self.config.classes.container);

      var _board = document.createElement('ul');
      _board.classList.add(self.config.classes.board);
      self.data._board = _board;

      self.data._container.appendChild(_board);

      var _sidebar = document.createElement('div');
      _sidebar.classList.add(self.config.classes.sidebar);
      self.data._sidebar = _sidebar;

      self.data._container.appendChild(_sidebar);

      self.generateSidebar(); // add self.generateScoreboard(); // add div and push to it the best high score if it was

      self.addHelp();

      self.generateButtons();
      self.binding();

      self.generateBoard('medium', true);
    };

    self.binding = function () {
      document.addEventListener('keydown', function (e) {
        switch (e.keyCode) {
          case 37: // Arrow Left
            self.movePoints('left');
            break;
          case 38: // Arrow Up
            self.movePoints('top');
            break;
          case 39: // Arrow Right
            self.movePoints('right');
            break;
          case 40: // Arrow Down
            self.movePoints('bottom');
            break;
          case 82: // R
            if (!self.data.keyDownLock) {
              self.data.keyDownLock = true;
              self.restart();
            }
            break;
          case 85: // U
            if (!self.data.keyDownLock) {
              self.data.keyDownLock = true;
              self.undo();
            }
            break;
        }
      });

      document.addEventListener('keyup', function (e) {
        switch (e.keyCode) {
          case 37: // Arrow Left
          case 38: // Arrow Up
          case 39: // Arrow Right
          case 40: // Arrow Down
          case 82: // R
          case 85: // U
          case 89: // Y
          case 78: // N
          case 27: // Esc
          case 13: // Enter
            self.data.keyDownLock = false;
            break;
        }
      });
    };

    self.init = function () {
      self.generateGame();
    };

    self.init();
  }

})();
