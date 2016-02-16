function isMobile () {
  return window.getComputedStyle(document.getElementById('is_mobile'))['display'] === 'block';
}

function isSafari() {
  return (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1)
}

function DOMReRender() {
  var DOMTestElement = document.createElement('div');
  document.body.appendChild(DOMTestElement);
  document.body.removeChild(DOMTestElement);
}

var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/),
    iphone4 = navigator.userAgent.match(/iPhone/i) !== null  && window.screen.height == (960 / 2);

(function () {
  'use strict';

  var _html = document.documentElement;

  if (iphone4) {
    _html.classList.add('iphone4');

    return false;
  }

  function checkOrientation () {
    if ((window.orientation === -90 || window.orientation === 90) && isMobile() && !iphone4) {
      _html.classList.add('landscape');
    } else {
      _html.classList.remove('landscape');
    }
  }

  function triggerResize() {
    var event = document.createEvent('UIEvents');
    event.initUIEvent('resize', true, false, window, 0);
    window.dispatchEvent(event);
  }

  var _body = document.body,
      resizeTimer = 0,
      preferredWidth = 1450, // old 900
      preferredHeight = 825,
      oldWindowWidth;

  function windowResize() {
    if (!isMobile()) {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(function () {
        var windowWidth = window.innerWidth,
            windowHeight = window.innerHeight;

        var activeElement = document.activeElement;

        if (!isTouchDevice || (activeElement.tagName.toLowerCase() !== 'input' && activeElement.tagName.toLowerCase() !== 'textarea') || oldWindowWidth !== windowWidth) {
          oldWindowWidth = windowWidth;

          if (windowHeight < preferredHeight || windowWidth < preferredWidth) {
            var widthPercentage = (windowWidth * 100) / preferredWidth,
                heightPercentage = (windowHeight * 100) / preferredHeight,
                percentage = Math.min(heightPercentage, widthPercentage);

            _body.style.fontSize = percentage.toFixed(2) + '%';
          } else {
            _body.style.fontSize = '100%';

          }
        }

        if (isSafari()) {
          setTimeout(function () {
            DOMReRender();
          }, 50);
        }
      }, 100);
    }
  }

  Event.add(window, 'orientationchange', function () {
    var _activeElement = document.activeElement;

    if (_activeElement.tagName.toLowerCase() === 'input' || _activeElement.tagName.toLowerCase() === 'textarea') {
      _activeElement.blur();
    }

    checkOrientation();

    setTimeout(function () {
      if (isSafari()) {
        DOMReRender();
      }

      triggerResize();
    }, 100);
  });

  checkOrientation();

  oldWindowWidth = window.innerWidth;
  windowResize();

  setTimeout(function () {
    windowResize();
  }, 100);

  Event.add(window, 'resize', windowResize);

})();
