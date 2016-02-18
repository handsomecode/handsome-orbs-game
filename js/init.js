var Orbs;

(function () {
  'use strict';

  Orbs = function (_container, config) {
    var self = this;

    self.config = config;
    self.settings = {};

    self.data = {
      _html: document.documentElement,
      _container: _container,
      _board: undefined,
      _sidebar: undefined,
      itemSize: 0,
      points: [],
      allPointsCoordinates: [],
      hasOpenedConfirm: false,
      hasOpenedInstructions: false,
      keyDownLock: false,
      touch: false,
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
          count: 0,
          event: 'increase'
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
        },
        instructions: {
          _element: undefined,
          name: 'Instructions',
          description: 'Description for Instructions (key \'I\')',
          callback: function () {
            self.instructions();
          }
        }
      }
    };

    self.debug = function (message) {
      if (self.config.debug) {
        console.log(message);
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

    self.increaseScore = function (countPoints) {
      var newScore = self.data.scoresList.score.count + self.settings.minimalAddingScore + ((countPoints - self.settings.pointsAmountInLineForRemove) * self.settings.minimalAddingScore * self.settings.percentScoreForAddingPoints);

      self.updateScore(newScore);

      self.updateHighScore(self.settings.id);
    };

    self.removeDOMElement = function (_element) {
      if (_element && _element.parentElement) {
        _element.parentElement.removeChild(_element);
      }
    };

    self.clearPoints = function (pointsList) {
      self.debug('clearPoints:');
      self.debug(pointsList);

      for (var i = 0; i < pointsList.length; i++) {
        var points = pointsList[i];

        self.generateRemovingAnimation(points);

        for (var j = 0; j < points.length; j++) {
          var point = points[j],
              _point = point._element,
              pointIndexInAllPointsList = self.data.points.indexOf(point);

          if (pointIndexInAllPointsList > -1) {
            _point.classList.add(self.config.classes.removePoint); // point - display: none;

            point.forDeleting = true;
          }
        }

        setTimeout(function () {
          self.increaseScore(points.length);
        }, self.config.increaseScoreTimeout);
      }
    };

    self.generateRemovingAnimation = function (points) {
      var _pointsContainer = document.createElement('div'),
          verticalLine = false;

      _pointsContainer.classList.add(self.config.classes.pointsContainer);

      for (var i = 1; i < points.length; i++) {
        if (points[i].x === points[i-1].x && Math.abs(points[i].y - points[i-1].y) === 1) {
          verticalLine = true;
        }
      }

      if (verticalLine) {
        _pointsContainer.style.width = self.data.itemSize + '%';
        _pointsContainer.style.height = self.data.itemSize * points.length + '%';
      } else {
        _pointsContainer.style.width = self.data.itemSize * points.length + '%';
        _pointsContainer.style.height = self.data.itemSize + '%';
      }

      _pointsContainer.style.top = (points[0].y * self.data.itemSize) + '%';
      _pointsContainer.style.left = (points[0].x * self.data.itemSize) + '%';

      _pointsContainer.style['background-color'] = points[0].color;

      _pointsContainer.classList.add(self.config.classes.removePointsContainer);

      self.data._board.appendChild(_pointsContainer);

      setTimeout(function () {
        self.removeDOMElement(_pointsContainer);
      }, self.config.removeTimeout);
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

    self.movePoints = function (direction) {
      if (!self.data.running || self.data.keyDownLock || self.data.hasOpenedConfirm) {
        return false;
      }

      self.data.keyDownLock = true;
      self.data.running = false;

      var countChanges = 0,
          startLines = [];

      var axis = direction === 'left' || direction === 'right' ? 'x' : 'y', // define axis Ox or Oy
          alternativeAxis = axis === 'x' ? 'y' : 'x';

      direction = direction === 'left' || direction === 'top' ? +1 : -1; // define starting item and ending item

      self.sortByProperty(self.data.points, axis, direction); // inverse?

      for (var i = 0; i < self.settings.size; i++) {
        startLines.push(0);
      }

      var oldPoints = self.data.points.slice(0),
          oldScore = self.data.scoresList.score.count;

      for (var j = 0; j < self.data.points.length; j++) {
        var point = self.data.points[j];

        if (point.forDeleting) {
          self.removeDOMElement(self.data.points[j]._element);
          self.data.points.splice(j, 1);
          j--;
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

        if (!self.checkLocalStorage(localStorage['hasUndo'])) {
          localStorage['hasUndo'] = true;
          self.data.buttonsList.undo.classList.remove(self.config.classes.button.disabled);
        }

        var coloredPointsAmount = self.checkSameColoredPoints();

        self.clearPoints(coloredPointsAmount); // delete points, not DOM elements

        self.generateRandomPoints(coloredPointsAmount.length ? self.settings.pointsAmountAfterRemove() : self.settings.pointsAmountAfterMove());

        localStorage['points'] = JSON.stringify(self.data.points);
        localStorage['score'] = self.data.scoresList.score.count;
        localStorage['oldScore'] = oldScore;

        if ((self.data.points.length === self.settings.size * self.settings.size) && self.checkGameOver()) {
          self.gameOver();
        } else if (self.checkWinning()) {
          self.winning();
        }
      } else {
        self.data.points = oldPoints.slice(0);
      }

      setTimeout(function () {
        self.data.keyDownLock = false;
        self.data.running = true;
      }, self.config.moveTimeout);
    };

    self.changeCoordinates = function (point) {
      var translateX =  point.x * 100,
          translateY = point.y * 100;

      var transform = 'translateX(' + translateX + '%) translateY(' + translateY + '%) translateZ(0)';

      point._element.style.transform = transform;
      point._element.style.webkitTransform = transform;
      point._element.style.mozTransform = transform;
      point._element.style.msTransform = transform;
      point._element.style.oTransform = transform;
    };

    self.createPoint = function (x, y, color, oldX, oldY, forDeleting) {
      if (typeof forDeleting === 'undefined') {
        forDeleting = false;
      }

      var _point = document.createElement('li'),
          _pointInnerContainer = document.createElement('div');

      _point.classList.add(self.config.classes.point);
      _point.style.width = self.data.itemSize + '%';
      _point.style.height = self.data.itemSize + '%';
      _point.style['background-color'] = 'transparent';

      _pointInnerContainer.classList.add(self.config.classes.pointInnerContainer);
      _pointInnerContainer.style['background-color'] = color;

      var point = {
        x: x,
        y: y,
        oldX: oldX,
        oldY: oldY,
        color: color,
        forDeleting: forDeleting,
        _element: _point
      };

      self.changeCoordinates(point);

      self.data.points.push(point);

      _point.appendChild(_pointInnerContainer);

      self.data._board.appendChild(_point); // add on board

      self.debug(point);

      return point;
    };

    self.checkColorOfPoints = function () {
      var remainingColors = [],
          colors = self.settings.colors.slice(0);

      for (var i = 0; i < self.data.points.length; i++) {
        var point = self.data.points[i];

        if (remainingColors.indexOf(point.color) === -1) {
          remainingColors.push(point.color);
        }
        if (remainingColors.length === colors.length) {
          break;
        }
      }

      return remainingColors;
    };

    self.getRandomColor = function (x, y, force) {
      if (typeof force === 'undefined') {
        force = false;
      }

      var colors,
          minPointsAmount = (self.settings.size * self.settings.size) / 2 - 1;

      if (self.config.modes.hard.settings.randomMode && self.settings.id === 'hard') {
        colors = self.settings.colors.slice(0);
      } else if (!force && (self.data.points.length <= minPointsAmount) && !self.data.init) {
        colors = self.checkColorOfPoints().slice(0);
      } else {
        colors = self.settings.colors.slice(0);
      }

      for (var i = 0; i < self.data.points.length; i++) {
        var point = self.data.points[i];

        if ((point.x === x && Math.abs(point.y - y) === 1) ||
            (point.y === y && Math.abs(point.x - x) === 1)) {
          colors.splice(colors.indexOf(point.color), 1);
        }
      }

      return colors.length ? colors[Math.floor(Math.random() * colors.length)] : false;
    };

    self.getEmptyPlaces = function () {
      var emptyPointsList = [];

      for (var i = 0; i < self.data.points.length; i++) {
        var point = self.data.points[i];

        self.data.allPointsCoordinates[point.x][point.y] = false;
      }

      for (var x = 0; x < self.settings.size; x++) {
        for (var y = 0; y < self.settings.size; y++) {
          if (self.data.allPointsCoordinates[x][y]) {
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

      var currentPointCoordinates,
          currentPointColor = false;

      var countColorCheck = 0;
      while (!currentPointColor && countColorCheck < 50) {
        currentPointCoordinates = emptyPlaces[Math.floor(Math.random() * emptyPlaces.length)];
        currentPointColor = self.getRandomColor(currentPointCoordinates.x, currentPointCoordinates.y);

        countColorCheck++;
      }

      if (!currentPointColor) {
        currentPointColor = self.getRandomColor(currentPointCoordinates.x, currentPointCoordinates.y, true);
      }

      self.createPoint(
          currentPointCoordinates.x,
          currentPointCoordinates.y,
          currentPointColor
      );
    };

    self.generateRandomPoints = function (amount) {
      self.data.running = false;

      if (amount + self.data.points.length > self.settings.size * self.settings.size) {
        amount = self.settings.size * self.settings.size - self.data.points.length; // when we can't add more points (all points==amount) because field can be almost full
      }

      self.debug('generate points:');

      for (var i = 0; i < amount; i++) {
        self.generateRandomPoint();
      }

      self.data.running = true;
    };

    self.getDataNextToValue = function (curScore, futureScore) {
      var arrCurScore = (curScore + '').split(''),
          arrFutureScore = (futureScore + '').split('');

      var changingNumIndexes = [];

      for (var i = 0; i < Math.max(arrCurScore.length, arrFutureScore.length); i++) {
        if (arrCurScore.length <= i || arrFutureScore.length <= i || arrCurScore[i] !== arrFutureScore[i]) {
          changingNumIndexes.push(i);
        }
      }

      return changingNumIndexes;
    };

    self.updateScore = function (futureScore) {
      var currentScore = self.data.scoresList.score.count;

      var changingDigitalIndexes = self.getDataNextToValue(currentScore, futureScore);

      if (changingDigitalIndexes.length) {
        self.data.scoresList.score.count = futureScore;

        futureScore = (futureScore + '').split('');
        currentScore = (currentScore + '').split('');

        self.data.scoresList.score._element.innerHTML = '';

        for (var i = 0; i < Math.max(futureScore.length, currentScore.length); i++) {
          var _p = document.createElement('p');
          _p.setAttribute('data-value', (currentScore.length > i ? currentScore[i] : '\b'));

          if (changingDigitalIndexes.indexOf(i) > -1) {
            _p.setAttribute('data-to-next-value', (futureScore.length > i ? futureScore[i] : ' '));
          }

          self.data.scoresList.score._element.appendChild(_p);
        }

        self.data.scoresList.score._element.classList.remove(self.config.classes.scoreboard[self.data.scoresList.score.event]);
        self.data.scoresList.score.event = Number(futureScore.join('')) >= Number(currentScore.join('')) ? 'increase' : 'decrease';
        self.data.scoresList.score._element.classList.add(self.config.classes.scoreboard[self.data.scoresList.score.event]);

        localStorage['score'] = self.data.scoresList.score.count;
      }
    };

    self.undo = function () {
      if (self.checkLocalStorage(localStorage['hasUndo'])) {

        localStorage['hasUndo'] = false;
        self.data.buttonsList.undo.classList.add(self.config.classes.button.disabled);

        if (self.data._board.classList.contains(self.config.classes.boardGameOver)) {
          self.data._board.classList.remove(self.config.classes.boardGameOver);
        }
        if (self.data._board.classList.contains(self.config.classes.boardWinning)) {
          self.data._board.classList.remove(self.config.classes.boardWinning);
        }

        self.updateScore(parseInt(localStorage['oldScore']));
        localStorage.removeItem('oldScore');

        for (var i = self.data.points.length - 1; i >= 0; i--) {
          var point = self.data.points[i];

          if (typeof point.oldX !== 'undefined' && typeof point.oldY !== 'undefined') {
            if (point.forDeleting) {
              point.forDeleting = false;
              point._element.classList.remove(self.config.classes.removePoint);
            }

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

        localStorage['points'] = JSON.stringify(self.data.points);
      }
    };

    self.restart = function () {
      self.openConfirm(self.config.confirmRestartText, function () {
        localStorage['hasUndo'] = false;
        self.data.buttonsList.undo.classList.add(self.config.classes.button.disabled);

        self.generateBoard();
      });
    };

    self.instructions = function () {
        self.openInstructions();
    };

    self.checkGameOver = function () {
      for (var i = 0; i < self.data.points.length; i++) {
        if (self.data.points[i].forDeleting) {
          return false;
        }
      }
      return true;
    };

    self.gameOver = function () {
      self.data.running = false;

      self.data._board.classList.add(self.config.classes.boardGameOver);

      self.openConfirm(self.config.confirmGameOverText, function () {
        self.generateBoard();
      });
    };

    self.checkWinning = function () {
      for (var i = 0; i < self.data.points.length; i++) {
        if (!self.data.points[i].forDeleting) {
          return false;
        }
      }

      return true;
    };

    self.winning = function () {

      self.data.running = false;

      self.data._board.classList.add(self.config.classes.boardWinning);

      self.data.buttonsList.undo.classList.add(self.config.classes.button.disabled);
      localStorage['hasUndo'] = false;
      localStorage.removeItem('oldScore');
      localStorage['points'] = JSON.stringify([]);
      localStorage['score'] = 0;

      self.openConfirm(self.config.confirmWinningText, function () {
        self.generateBoard();
      });
    };

    self.resetScore = function () {
      if (self.data.scoresList.score.count) {
        self.data.scoresList.score.count = 0;
        self.data.scoresList.score._element.textContent = self.data.scoresList.score.count;
        localStorage['score'] = self.data.scoresList.score.count;
        localStorage.removeItem('oldScore');
      }
    };

    self.clearBoard = function () {
      for (var i = self.data.points.length - 1; i >= 0; i--) {
        self.data.points.splice(i, 1);
      }

      self.data._board.innerHTML = '';

      self.resetScore();
    };

    self.generateGrid = function () {
      self.data._board.style['background-size'] = self.data.itemSize + '%';
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

      self.data.scoresList.modesButton[self.settings.id]._element.classList.add(self.config.classes.modesBoard.active);

      self.data.itemSize = Math.round(( 100 / self.settings.size) * 10) / 10;

      self.generateCoordinatesList(); // array of object with pairs (x, y)

      self.generateGrid();
    };

    self.generateBoard = function (mode, init) {
      if (typeof init === 'undefined') {
        init = false;
      }

      self.data.init = true;

      self.clearBoard();

      if (init && !self.checkLocalStorage(localStorage['points'])) {
        var points = JSON.parse(localStorage['points']);

        if (points.length) {
          self.changeMode(localStorage['mode']);

          self.data.scoresList.score.count = parseInt(localStorage['score']);
          self.data.scoresList.score._element.textContent = self.data.scoresList.score.count;

          for (var i = 0; i < points.length; i++) {
            var point = self.createPoint(points[i].x, points[i].y, points[i].color, points[i].oldX, points[i].oldY, points[i].forDeleting);

            if (point.forDeleting) {
              point._element.classList.add(self.config.classes.removePoint);
            }
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
      if (self.data._board.classList.contains(self.config.classes.boardWinning)) {
        self.data._board.classList.remove(self.config.classes.boardWinning);
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

    self.openConfirm = function (text, callback) {
      if (self.data.hasOpenedConfirm) {
        return false;
      }

      self.data.hasOpenedConfirm = true;

      if (text !== self.config.confirmGameOverText) {
        self.data._html.classList.add(self.config.classes.boardDisabled);
      }
      self.data._html.classList.add(self.config.classes.boardDisabled);
      self.appendChildren(self.data._container, self.config.confirmHtml.replace(/%text%/g, text));

      self.data.running = false;

      function confirmKeyDown(e) {
        if (!self.data.keyDownLock) {
          self.data.keyDownLock = true;
          switch (e.keyCode) {
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
        self.data.hasOpenedConfirm = false;

        self.removeDOMElement(document.getElementById('confirm'));

        self.data._html.classList.remove(self.config.classes.boardDisabled);

        document.removeEventListener('keydown', confirmKeyDown);

        if (typeof callback === 'function') {
          callback();
        }
      }

      function confirmNo() {
        self.data.hasOpenedConfirm = false;

        self.data._html.classList.remove(self.config.classes.boardDisabled);

        self.data.running = true;

        self.removeDOMElement(document.getElementById('confirm'));

        document.removeEventListener('keydown', confirmKeyDown);
      }

      document.addEventListener('keydown', confirmKeyDown);

      document.getElementById('confirm-no').addEventListener('click', function () {
        confirmNo();
      });

      document.getElementById('confirm-yes').addEventListener('click', function () {
        confirmYes();
      });
    };

    self.openInstructions = function () {
      if (self.data.hasOpenedInstructions) {
        return false;
      }

      self.data.hasOpenedInstructions = true;

      self.data._html.classList.add(self.config.classes.boardDisabled);

      self.appendChildren(self.data._container, self.config.instructionsHtml);

      self.data.running = false;

      function instructionsKeyDown(e) {
        if (!self.data.keyDownLock) {
          self.data.keyDownLock = true;
          switch (e.keyCode) {
            case 27: // Esc
              instructionsClose();
              break;
          }
        }
      }

      function blur(event) {
        if ((event.target === document.body)) {
          instructionsClose();
        }
      }

      function instructionsClose() {
        self.data.hasOpenedInstructions = false;

        self.data._html.classList.remove(self.config.classes.boardDisabled);

        self.data.running = true;

        self.removeDOMElement(document.getElementById('instructions'));

        document.removeEventListener('keydown', instructionsKeyDown);

        document.body.removeEventListener('click', blur);
      }

      document.addEventListener('keydown', instructionsKeyDown);

      document.body.addEventListener('click', blur);

      document.getElementById('instructions-ok').addEventListener('click', function () {
        instructionsClose();
      });
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
          _modeTitle = document.createElement('p'),
          _modeLabel = document.createElement('p'),
          _modeCounter = document.createElement('div');

      _mode.classList.add(self.config.classes.modesBoard.default);
      _mode.classList.add(self.config.classes.modesBoard.default + '--' + mode.id);
      _modeTitle.classList.add(self.config.classes.modesBoard.title);
      _modeTitle.textContent = mode.name;
      _modeLabel.classList.add(self.config.classes.modesBoard.label);
      _modeLabel.textContent = 'High Score';
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
          self.openConfirm(self.config.confirmChangeDifficultyText, function () {
            self.generateBoard(mode.id);
          });
        }
      });
    };

    self.generateSidebar = function () {
      var _scoreboardContainer = document.createElement('div'),
          _scoreboardCount = document.createElement('div');

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

      var _sidebar = document.createElement('div');
      _sidebar.classList.add(self.config.classes.sidebar);
      self.data._sidebar = _sidebar;

      self.data._container.appendChild(_sidebar);
      var _board = document.createElement('ul');
      _board.classList.add(self.config.classes.board);
      self.data._board = _board;

      self.data._container.appendChild(_board);

      var _mobile = document.createElement('div');
      _mobile.id = 'is_mobile';

      self.data._container.appendChild(_mobile);

      var _tablet = document.createElement('div');
      _tablet.id = 'is_tablet';

      self.data._container.appendChild(_tablet);

      self.generateSidebar(); // add self.generateScoreboard(); // add div and push to it the best high score if it was

      self.generateButtons();
      self.binding();
      self.touchBinding();

      self.generateBoard('medium', true);
    };

    self.touchBinding = function () {
      var startX = 0,
          startY = 0,
          endX = 0,
          endY = 0,
          distX = 0,
          distY = 0,
          direction = '',
          criticalDistance = 50;

      self.data._board.addEventListener('touchstart', function(e){
        var touchobj = e.changedTouches[0]; // reference first touch point (ie: first finger)

        startX = parseInt(touchobj.clientX); // get x position of touch point relative to left edge of browser
        startY = parseInt(touchobj.clientY);

        e.preventDefault();
      }, false);

      self.data._board.addEventListener('touchend', function(e){
        var touchobj = e.changedTouches[0]; // reference first touch point for this event

        endX = parseInt(touchobj.clientX);
        endY = parseInt(touchobj.clientY);

        e.preventDefault();

        distX = Math.abs(endX - startX);
        distY = Math.abs(endY - startY);

        if (distY < distX) {
          if (distX > criticalDistance) {
            direction = endX - startX > 0 ? 'right' : 'left';
          }
        } else if (distY > criticalDistance) {
          direction = endY - startY > 0 ? 'bottom' : 'top';
        }

        self.movePoints(direction);
      });
    };

    self.binding = function () {
      document.addEventListener('keydown', function (e) {
        if (self.data.keyDownLock || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) {
          return false;
        }

        switch (e.keyCode) {
          case 37: // Arrow Left
            self.data.keyDownLock = false;
            self.movePoints('left');

            break;
          case 38: // Arrow Up
            self.data.keyDownLock = false;
            self.movePoints('top');

            break;
          case 39: // Arrow Right
            self.data.keyDownLock = false;
            self.movePoints('right');

            break;
          case 40: // Arrow Down
            self.data.keyDownLock = false;
            self.movePoints('bottom');

            break;
          case 82: // R
            if (!self.data.hasOpenedConfirm) {
              self.data.keyDownLock = true;
              self.restart();
            }
            break;
          case 85: // U
            if (!self.data.hasOpenedConfirm) {
              self.data.keyDownLock = true;
              self.undo();
            }
            break;
          case 73: // I
            if (!self.data.hasOpenedInstructions) {
              self.data.keyDownLock = true;
              self.instructions();
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
          case 73: // I
          case 27: // Esc
          case 13: // Enter
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
