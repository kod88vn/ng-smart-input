(function() {
	'use-strict';

	// load malarkey from our combined js file
	if(typeof(module) !== 'undefined' && module.exports) {
		malarkey = module.exports;
	}

	angular.module('ng-smart-input', [])
		.controller('SmartInputController', SmartInputController)
		.directive('smartInput', SmartInputDirective);

	function SmartInputDirective() {
		return {
			restrict: 'E',
			scope: {
				config: '='
			},
			templateUrl: 'ngSmartInput.html',
			controller: 'SmartInputController',
			controllerAs: 'sic'
		}
	}

	function SmartInputController($scope, $timeout) {
		var vm = this;
		vm.searchText = '';
		vm.searchTimer = null;
		vm.config = $scope.config;
		vm.scope = $scope;

		$timeout(function() {
			var elem = document.querySelector('#' + $scope.config.id);
			var opts = {
				typeSpeed: 50,
				deleteSpeed: 50,
				pauseDelay: 500,
				loop: true,
				getter: function(elem) {
					return elem.getAttribute('placeholder') || '';
				},
				setter: function(elem, val) {
					elem.setAttribute('placeholder', val);
				}
			};

			var typist = malarkey(elem, opts);
			vm.config.placeholders.forEach(function(p) {
				typist.type(p).pause().delete();
			});
		});
	}

	SmartInputController.prototype = {
    set searchText (text) {
      var vm = this;
      vm._searchText = text || '';

      if(vm.config === undefined) {
        return;
      }

      if(vm.searchTimer) {
        clearTimeout(vm.searchTimer);
      }

      vm.searchTimer = setTimeout(function() {
        vm.searchTimer = null;
        vm.filterText = vm._searchText;
        if(!vm.scope.$$phase) {
            vm.scope.$digest(); 
        }
      }, vm.config.delay);
    },
    get searchText() {
      return this._searchText;
    }
  }

})();

(function(root) {

  'use strict';

  var STOPPED  = 0;
  var STOPPING = 1;
  var RUNNING  = 2;

  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  function noop() {}

  function Malarkey(elem, opts) {

    // allow `Malarkey` to be called without the `new` keyword
    var self = this;
    if (!(self instanceof Malarkey)) {
      return new Malarkey(elem, opts);
    }

    // default `opts`
    opts = opts || {};
    var loop = opts.loop;
    var typeSpeed = opts.speed || opts.typeSpeed || 50;
    var deleteSpeed = opts.speed || opts.deleteSpeed || 50;
    var pauseDelay = opts.delay || opts.pauseDelay || 2000;
    var postfix = opts.postfix || '';
    var getter = opts.getter || function(elem) {
      return elem.innerHTML;
    };
    var setter = opts.setter || function(elem, val) {
      elem.innerHTML = val;
    };

    // the function queue
    var fnQueue = [];
    var argsQueue = [];
    var i = -1;
    var state = STOPPED;
    var pauseCb = noop;
    function enqueue(fn, args) {
      fnQueue.push(fn);
      argsQueue.push(args);
      if (state != RUNNING) {
        state = RUNNING;
        // wait for the remaining functions to be enqueued
        setTimeout(function() {
          next();
        }, 0);
      }
      return self;
    }
    function next() {
      if (state != RUNNING) {
        state = STOPPED;
        pauseCb(elem);
        pauseCb = noop;
        return;
      }
      if (++i == fnQueue.length) {
        if (!loop) {
          i = fnQueue.length - 1; // set `i` to the last element of `fnQueue`
          state = STOPPED;
          return;
        }
        i = 0;
      }
      fnQueue[i].apply(null, [].concat(next, argsQueue[i]));
    }

    // internal functions that are `enqueued` via the respective public methods
    function _type(cb, str, speed) {
      var len = str.length;
      if (!len) {
        return cb();
      }
      (function t(i) {
        setTimeout(function() {
          setter(elem, getter(elem) + str[i]);
          i += 1;
          if (i < len) {
            t(i);
          } else {
            cb();
          }
        }, speed);
      })(0);
    }
    function _delete(cb, x, speed) {
      var curr = getter(elem);
      var count = curr.length; // default to deleting entire contents of `elem`
      if (x != null) {
        if (typeof x == 'string') {
          // delete the string `x` if and only if `elem` ends with `x`
          if (endsWith(curr, x + postfix)) {
            count = x.length + postfix.length;
          } else {
            count = 0;
          }
        } else {
          // delete the last `x` characters from `elem`
          if (x > -1) {
            count = Math.min(x, count);
          }
        }
      }
      if (!count) {
        return cb();
      }
      (function d(count) {
        setTimeout(function() {
          var curr = getter(elem);
          if (count) {
            // drop last char
            setter(elem, curr.substring(0, curr.length-1));
            d(count - 1);
          } else {
            cb();
          }
        }, speed);
      })(count);
    }
    function _clear(cb) {
      setter(elem, '');
      cb();
    }
    function _call(cb, fn) {
      fn.call(cb, elem);
    }

    // expose the public methods
    self.type = function(str, speed) {
      return enqueue(_type, [str + postfix, speed || typeSpeed]);
    };
    self.delete = function(x, speed) {
      return enqueue(_delete, [x, speed || deleteSpeed]);
    };
    self.clear = function() {
      return enqueue(_clear);
    };
    self.pause = function(delay) {
      return enqueue(setTimeout, [delay || pauseDelay]);
    };
    self.call = function(fn) {
      return enqueue(_call, [fn]);
    };
    self.triggerPause = function(cb) {
      state = STOPPING;
      pauseCb = cb || noop;
      return self;
    };
    self.triggerResume = function() {
      if (state != RUNNING) { // ie. `STOPPED` or `STOPPING`
        var prevState = state;
        state = RUNNING;
        if (prevState == STOPPED) {
          next();
        }
      }
      return self;
    };
    self.isRunning = function() {
      return state != STOPPED; // ie. `RUNNING` or `STOPPING`
    };

  }

  /* istanbul ignore else */
  if (typeof module == 'object') {
    module.exports = Malarkey;
  } else {
    root.malarkey = Malarkey;
  }

})(this);

angular.module('ng-smart-input').run(['$templateCache', function($templateCache) {
    $templateCache.put('ngSmartInput.html',
        "<input class=\"form-control\" placeholder=\"\" ng-attr-id=\"{{config.id}}\" data-ng-model=\"sic.searchText\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\"/><ul class=\"dropdown-menu dropdown-menu-full-width\"><li data-ng-repeat=\"sug in config.suggestions | filter:sic.filterText | limitTo:5\"><a href=\"javascript:;\" data-ng-click=\"sic.searchText = sug\"><span>{{sug}}</span></a></li></ul>");
}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJhcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuXHQndXNlLXN0cmljdCc7XG5cblx0Ly8gbG9hZCBtYWxhcmtleSBmcm9tIG91ciBjb21iaW5lZCBqcyBmaWxlXG5cdGlmKHR5cGVvZihtb2R1bGUpICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1hbGFya2V5ID0gbW9kdWxlLmV4cG9ydHM7XG5cdH1cblxuXHRhbmd1bGFyLm1vZHVsZSgnbmctc21hcnQtaW5wdXQnLCBbXSlcblx0XHQuY29udHJvbGxlcignU21hcnRJbnB1dENvbnRyb2xsZXInLCBTbWFydElucHV0Q29udHJvbGxlcilcblx0XHQuZGlyZWN0aXZlKCdzbWFydElucHV0JywgU21hcnRJbnB1dERpcmVjdGl2ZSk7XG5cblx0ZnVuY3Rpb24gU21hcnRJbnB1dERpcmVjdGl2ZSgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRcdHNjb3BlOiB7XG5cdFx0XHRcdGNvbmZpZzogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmw6ICduZ1NtYXJ0SW5wdXQuaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyOiAnU21hcnRJbnB1dENvbnRyb2xsZXInLFxuXHRcdFx0Y29udHJvbGxlckFzOiAnc2ljJ1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIFNtYXJ0SW5wdXRDb250cm9sbGVyKCRzY29wZSwgJHRpbWVvdXQpIHtcblx0XHR2YXIgdm0gPSB0aGlzO1xuXHRcdHZtLnNlYXJjaFRleHQgPSAnJztcblx0XHR2bS5zZWFyY2hUaW1lciA9IG51bGw7XG5cdFx0dm0uY29uZmlnID0gJHNjb3BlLmNvbmZpZztcblx0XHR2bS5zY29wZSA9ICRzY29wZTtcblxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArICRzY29wZS5jb25maWcuaWQpO1xuXHRcdFx0dmFyIG9wdHMgPSB7XG5cdFx0XHRcdHR5cGVTcGVlZDogNTAsXG5cdFx0XHRcdGRlbGV0ZVNwZWVkOiA1MCxcblx0XHRcdFx0cGF1c2VEZWxheTogNTAwLFxuXHRcdFx0XHRsb29wOiB0cnVlLFxuXHRcdFx0XHRnZXR0ZXI6IGZ1bmN0aW9uKGVsZW0pIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJykgfHwgJyc7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNldHRlcjogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XG5cdFx0XHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJywgdmFsKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0dmFyIHR5cGlzdCA9IG1hbGFya2V5KGVsZW0sIG9wdHMpO1xuXHRcdFx0dm0uY29uZmlnLnBsYWNlaG9sZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcblx0XHRcdFx0dHlwaXN0LnR5cGUocCkucGF1c2UoKS5kZWxldGUoKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0U21hcnRJbnB1dENvbnRyb2xsZXIucHJvdG90eXBlID0ge1xuICAgIHNldCBzZWFyY2hUZXh0ICh0ZXh0KSB7XG4gICAgICB2YXIgdm0gPSB0aGlzO1xuICAgICAgdm0uX3NlYXJjaFRleHQgPSB0ZXh0IHx8ICcnO1xuXG4gICAgICBpZih2bS5jb25maWcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKHZtLnNlYXJjaFRpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh2bS5zZWFyY2hUaW1lcik7XG4gICAgICB9XG5cbiAgICAgIHZtLnNlYXJjaFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdm0uc2VhcmNoVGltZXIgPSBudWxsO1xuICAgICAgICB2bS5maWx0ZXJUZXh0ID0gdm0uX3NlYXJjaFRleHQ7XG4gICAgICAgIGlmKCF2bS5zY29wZS4kJHBoYXNlKSB7XG4gICAgICAgICAgICB2bS5zY29wZS4kZGlnZXN0KCk7IFxuICAgICAgICB9XG4gICAgICB9LCB2bS5jb25maWcuZGVsYXkpO1xuICAgIH0sXG4gICAgZ2V0IHNlYXJjaFRleHQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc2VhcmNoVGV4dDtcbiAgICB9XG4gIH1cblxufSkoKTtcblxuKGZ1bmN0aW9uKHJvb3QpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIFNUT1BQRUQgID0gMDtcbiAgdmFyIFNUT1BQSU5HID0gMTtcbiAgdmFyIFJVTk5JTkcgID0gMjtcblxuICBmdW5jdGlvbiBlbmRzV2l0aChzdHIsIHN1ZmZpeCkge1xuICAgIHJldHVybiBzdHIuaW5kZXhPZihzdWZmaXgsIHN0ci5sZW5ndGggLSBzdWZmaXgubGVuZ3RoKSAhPT0gLTE7XG4gIH1cblxuICBmdW5jdGlvbiBub29wKCkge31cblxuICBmdW5jdGlvbiBNYWxhcmtleShlbGVtLCBvcHRzKSB7XG5cbiAgICAvLyBhbGxvdyBgTWFsYXJrZXlgIHRvIGJlIGNhbGxlZCB3aXRob3V0IHRoZSBgbmV3YCBrZXl3b3JkXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICghKHNlbGYgaW5zdGFuY2VvZiBNYWxhcmtleSkpIHtcbiAgICAgIHJldHVybiBuZXcgTWFsYXJrZXkoZWxlbSwgb3B0cyk7XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCBgb3B0c2BcbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICB2YXIgbG9vcCA9IG9wdHMubG9vcDtcbiAgICB2YXIgdHlwZVNwZWVkID0gb3B0cy5zcGVlZCB8fCBvcHRzLnR5cGVTcGVlZCB8fCA1MDtcbiAgICB2YXIgZGVsZXRlU3BlZWQgPSBvcHRzLnNwZWVkIHx8IG9wdHMuZGVsZXRlU3BlZWQgfHwgNTA7XG4gICAgdmFyIHBhdXNlRGVsYXkgPSBvcHRzLmRlbGF5IHx8IG9wdHMucGF1c2VEZWxheSB8fCAyMDAwO1xuICAgIHZhciBwb3N0Zml4ID0gb3B0cy5wb3N0Zml4IHx8ICcnO1xuICAgIHZhciBnZXR0ZXIgPSBvcHRzLmdldHRlciB8fCBmdW5jdGlvbihlbGVtKSB7XG4gICAgICByZXR1cm4gZWxlbS5pbm5lckhUTUw7XG4gICAgfTtcbiAgICB2YXIgc2V0dGVyID0gb3B0cy5zZXR0ZXIgfHwgZnVuY3Rpb24oZWxlbSwgdmFsKSB7XG4gICAgICBlbGVtLmlubmVySFRNTCA9IHZhbDtcbiAgICB9O1xuXG4gICAgLy8gdGhlIGZ1bmN0aW9uIHF1ZXVlXG4gICAgdmFyIGZuUXVldWUgPSBbXTtcbiAgICB2YXIgYXJnc1F1ZXVlID0gW107XG4gICAgdmFyIGkgPSAtMTtcbiAgICB2YXIgc3RhdGUgPSBTVE9QUEVEO1xuICAgIHZhciBwYXVzZUNiID0gbm9vcDtcbiAgICBmdW5jdGlvbiBlbnF1ZXVlKGZuLCBhcmdzKSB7XG4gICAgICBmblF1ZXVlLnB1c2goZm4pO1xuICAgICAgYXJnc1F1ZXVlLnB1c2goYXJncyk7XG4gICAgICBpZiAoc3RhdGUgIT0gUlVOTklORykge1xuICAgICAgICBzdGF0ZSA9IFJVTk5JTkc7XG4gICAgICAgIC8vIHdhaXQgZm9yIHRoZSByZW1haW5pbmcgZnVuY3Rpb25zIHRvIGJlIGVucXVldWVkXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgaWYgKHN0YXRlICE9IFJVTk5JTkcpIHtcbiAgICAgICAgc3RhdGUgPSBTVE9QUEVEO1xuICAgICAgICBwYXVzZUNiKGVsZW0pO1xuICAgICAgICBwYXVzZUNiID0gbm9vcDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCsraSA9PSBmblF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBpZiAoIWxvb3ApIHtcbiAgICAgICAgICBpID0gZm5RdWV1ZS5sZW5ndGggLSAxOyAvLyBzZXQgYGlgIHRvIHRoZSBsYXN0IGVsZW1lbnQgb2YgYGZuUXVldWVgXG4gICAgICAgICAgc3RhdGUgPSBTVE9QUEVEO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpID0gMDtcbiAgICAgIH1cbiAgICAgIGZuUXVldWVbaV0uYXBwbHkobnVsbCwgW10uY29uY2F0KG5leHQsIGFyZ3NRdWV1ZVtpXSkpO1xuICAgIH1cblxuICAgIC8vIGludGVybmFsIGZ1bmN0aW9ucyB0aGF0IGFyZSBgZW5xdWV1ZWRgIHZpYSB0aGUgcmVzcGVjdGl2ZSBwdWJsaWMgbWV0aG9kc1xuICAgIGZ1bmN0aW9uIF90eXBlKGNiLCBzdHIsIHNwZWVkKSB7XG4gICAgICB2YXIgbGVuID0gc3RyLmxlbmd0aDtcbiAgICAgIGlmICghbGVuKSB7XG4gICAgICAgIHJldHVybiBjYigpO1xuICAgICAgfVxuICAgICAgKGZ1bmN0aW9uIHQoaSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNldHRlcihlbGVtLCBnZXR0ZXIoZWxlbSkgKyBzdHJbaV0pO1xuICAgICAgICAgIGkgKz0gMTtcbiAgICAgICAgICBpZiAoaSA8IGxlbikge1xuICAgICAgICAgICAgdChpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHNwZWVkKTtcbiAgICAgIH0pKDApO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfZGVsZXRlKGNiLCB4LCBzcGVlZCkge1xuICAgICAgdmFyIGN1cnIgPSBnZXR0ZXIoZWxlbSk7XG4gICAgICB2YXIgY291bnQgPSBjdXJyLmxlbmd0aDsgLy8gZGVmYXVsdCB0byBkZWxldGluZyBlbnRpcmUgY29udGVudHMgb2YgYGVsZW1gXG4gICAgICBpZiAoeCAhPSBudWxsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgeCA9PSAnc3RyaW5nJykge1xuICAgICAgICAgIC8vIGRlbGV0ZSB0aGUgc3RyaW5nIGB4YCBpZiBhbmQgb25seSBpZiBgZWxlbWAgZW5kcyB3aXRoIGB4YFxuICAgICAgICAgIGlmIChlbmRzV2l0aChjdXJyLCB4ICsgcG9zdGZpeCkpIHtcbiAgICAgICAgICAgIGNvdW50ID0geC5sZW5ndGggKyBwb3N0Zml4Lmxlbmd0aDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY291bnQgPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBkZWxldGUgdGhlIGxhc3QgYHhgIGNoYXJhY3RlcnMgZnJvbSBgZWxlbWBcbiAgICAgICAgICBpZiAoeCA+IC0xKSB7XG4gICAgICAgICAgICBjb3VudCA9IE1hdGgubWluKHgsIGNvdW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghY291bnQpIHtcbiAgICAgICAgcmV0dXJuIGNiKCk7XG4gICAgICB9XG4gICAgICAoZnVuY3Rpb24gZChjb3VudCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBjdXJyID0gZ2V0dGVyKGVsZW0pO1xuICAgICAgICAgIGlmIChjb3VudCkge1xuICAgICAgICAgICAgLy8gZHJvcCBsYXN0IGNoYXJcbiAgICAgICAgICAgIHNldHRlcihlbGVtLCBjdXJyLnN1YnN0cmluZygwLCBjdXJyLmxlbmd0aC0xKSk7XG4gICAgICAgICAgICBkKGNvdW50IC0gMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBzcGVlZCk7XG4gICAgICB9KShjb3VudCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIF9jbGVhcihjYikge1xuICAgICAgc2V0dGVyKGVsZW0sICcnKTtcbiAgICAgIGNiKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIF9jYWxsKGNiLCBmbikge1xuICAgICAgZm4uY2FsbChjYiwgZWxlbSk7XG4gICAgfVxuXG4gICAgLy8gZXhwb3NlIHRoZSBwdWJsaWMgbWV0aG9kc1xuICAgIHNlbGYudHlwZSA9IGZ1bmN0aW9uKHN0ciwgc3BlZWQpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKF90eXBlLCBbc3RyICsgcG9zdGZpeCwgc3BlZWQgfHwgdHlwZVNwZWVkXSk7XG4gICAgfTtcbiAgICBzZWxmLmRlbGV0ZSA9IGZ1bmN0aW9uKHgsIHNwZWVkKSB7XG4gICAgICByZXR1cm4gZW5xdWV1ZShfZGVsZXRlLCBbeCwgc3BlZWQgfHwgZGVsZXRlU3BlZWRdKTtcbiAgICB9O1xuICAgIHNlbGYuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKF9jbGVhcik7XG4gICAgfTtcbiAgICBzZWxmLnBhdXNlID0gZnVuY3Rpb24oZGVsYXkpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKHNldFRpbWVvdXQsIFtkZWxheSB8fCBwYXVzZURlbGF5XSk7XG4gICAgfTtcbiAgICBzZWxmLmNhbGwgPSBmdW5jdGlvbihmbikge1xuICAgICAgcmV0dXJuIGVucXVldWUoX2NhbGwsIFtmbl0pO1xuICAgIH07XG4gICAgc2VsZi50cmlnZ2VyUGF1c2UgPSBmdW5jdGlvbihjYikge1xuICAgICAgc3RhdGUgPSBTVE9QUElORztcbiAgICAgIHBhdXNlQ2IgPSBjYiB8fCBub29wO1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcbiAgICBzZWxmLnRyaWdnZXJSZXN1bWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChzdGF0ZSAhPSBSVU5OSU5HKSB7IC8vIGllLiBgU1RPUFBFRGAgb3IgYFNUT1BQSU5HYFxuICAgICAgICB2YXIgcHJldlN0YXRlID0gc3RhdGU7XG4gICAgICAgIHN0YXRlID0gUlVOTklORztcbiAgICAgICAgaWYgKHByZXZTdGF0ZSA9PSBTVE9QUEVEKSB7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICAgIHNlbGYuaXNSdW5uaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gc3RhdGUgIT0gU1RPUFBFRDsgLy8gaWUuIGBSVU5OSU5HYCBvciBgU1RPUFBJTkdgXG4gICAgfTtcblxuICB9XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IE1hbGFya2V5O1xuICB9IGVsc2Uge1xuICAgIHJvb3QubWFsYXJrZXkgPSBNYWxhcmtleTtcbiAgfVxuXG59KSh0aGlzKTtcblxuYW5ndWxhci5tb2R1bGUoJ25nLXNtYXJ0LWlucHV0JykucnVuKFsnJHRlbXBsYXRlQ2FjaGUnLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkge1xuICAgICR0ZW1wbGF0ZUNhY2hlLnB1dCgnbmdTbWFydElucHV0Lmh0bWwnLFxuICAgICAgICBcIjxpbnB1dCBjbGFzcz1cXFwiZm9ybS1jb250cm9sXFxcIiBwbGFjZWhvbGRlcj1cXFwiXFxcIiBuZy1hdHRyLWlkPVxcXCJ7e2NvbmZpZy5pZH19XFxcIiBkYXRhLW5nLW1vZGVsPVxcXCJzaWMuc2VhcmNoVGV4dFxcXCIgZGF0YS10b2dnbGU9XFxcImRyb3Bkb3duXFxcIiBhcmlhLWhhc3BvcHVwPVxcXCJ0cnVlXFxcIiBhcmlhLWV4cGFuZGVkPVxcXCJmYWxzZVxcXCIvPjx1bCBjbGFzcz1cXFwiZHJvcGRvd24tbWVudSBkcm9wZG93bi1tZW51LWZ1bGwtd2lkdGhcXFwiPjxsaSBkYXRhLW5nLXJlcGVhdD1cXFwic3VnIGluIGNvbmZpZy5zdWdnZXN0aW9ucyB8IGZpbHRlcjpzaWMuZmlsdGVyVGV4dCB8IGxpbWl0VG86NVxcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDo7XFxcIiBkYXRhLW5nLWNsaWNrPVxcXCJzaWMuc2VhcmNoVGV4dCA9IHN1Z1xcXCI+PHNwYW4+e3tzdWd9fTwvc3Bhbj48L2E+PC9saT48L3VsPlwiKTtcbn1dKTsiXSwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
