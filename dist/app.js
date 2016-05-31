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

    // start malarkey after page init
		$timeout(function() {
      if(vm.config.placeholders.length < 1) {
        return;
      }

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
      }, vm.config.delay || 0);
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
        "<div class=\"input-group width-100pct\"><input class=\"form-control\" placeholder=\"\" ng-attr-id=\"{{config.id}}\" data-ng-model=\"sic.searchText\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\"/><ul class=\"dropdown-menu dropdown-menu-right width-100pct opacity-09\"><li data-ng-repeat=\"sug in config.suggestions | filter:sic.filterText | limitTo:config.max || 5\"><a href=\"javascript:;\" data-ng-click=\"sic.searchText = sug\"><span>{{sug}}</span></a></li></ul></div>");
}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJhcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuXHQndXNlLXN0cmljdCc7XG5cblx0Ly8gbG9hZCBtYWxhcmtleSBmcm9tIG91ciBjb21iaW5lZCBqcyBmaWxlXG5cdGlmKHR5cGVvZihtb2R1bGUpICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1hbGFya2V5ID0gbW9kdWxlLmV4cG9ydHM7XG5cdH1cblxuXHRhbmd1bGFyLm1vZHVsZSgnbmctc21hcnQtaW5wdXQnLCBbXSlcblx0XHQuY29udHJvbGxlcignU21hcnRJbnB1dENvbnRyb2xsZXInLCBTbWFydElucHV0Q29udHJvbGxlcilcblx0XHQuZGlyZWN0aXZlKCdzbWFydElucHV0JywgU21hcnRJbnB1dERpcmVjdGl2ZSk7XG5cblx0ZnVuY3Rpb24gU21hcnRJbnB1dERpcmVjdGl2ZSgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRcdHNjb3BlOiB7XG5cdFx0XHRcdGNvbmZpZzogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmw6ICduZ1NtYXJ0SW5wdXQuaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyOiAnU21hcnRJbnB1dENvbnRyb2xsZXInLFxuXHRcdFx0Y29udHJvbGxlckFzOiAnc2ljJ1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIFNtYXJ0SW5wdXRDb250cm9sbGVyKCRzY29wZSwgJHRpbWVvdXQpIHtcblx0XHR2YXIgdm0gPSB0aGlzO1xuXHRcdHZtLnNlYXJjaFRleHQgPSAnJztcblx0XHR2bS5zZWFyY2hUaW1lciA9IG51bGw7XG5cdFx0dm0uY29uZmlnID0gJHNjb3BlLmNvbmZpZztcblx0XHR2bS5zY29wZSA9ICRzY29wZTtcblxuICAgIC8vIHN0YXJ0IG1hbGFya2V5IGFmdGVyIHBhZ2UgaW5pdFxuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgaWYodm0uY29uZmlnLnBsYWNlaG9sZGVycy5sZW5ndGggPCAxKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuXHRcdFx0dmFyIGVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArICRzY29wZS5jb25maWcuaWQpO1xuXHRcdFx0dmFyIG9wdHMgPSB7XG5cdFx0XHRcdHR5cGVTcGVlZDogNTAsXG5cdFx0XHRcdGRlbGV0ZVNwZWVkOiA1MCxcblx0XHRcdFx0cGF1c2VEZWxheTogNTAwLFxuXHRcdFx0XHRsb29wOiB0cnVlLFxuXHRcdFx0XHRnZXR0ZXI6IGZ1bmN0aW9uKGVsZW0pIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJykgfHwgJyc7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNldHRlcjogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XG5cdFx0XHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJywgdmFsKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0dmFyIHR5cGlzdCA9IG1hbGFya2V5KGVsZW0sIG9wdHMpO1xuXHRcdFx0dm0uY29uZmlnLnBsYWNlaG9sZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcblx0XHRcdFx0dHlwaXN0LnR5cGUocCkucGF1c2UoKS5kZWxldGUoKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0U21hcnRJbnB1dENvbnRyb2xsZXIucHJvdG90eXBlID0ge1xuICAgIHNldCBzZWFyY2hUZXh0ICh0ZXh0KSB7XG4gICAgICB2YXIgdm0gPSB0aGlzO1xuICAgICAgdm0uX3NlYXJjaFRleHQgPSB0ZXh0IHx8ICcnO1xuXG4gICAgICBpZih2bS5jb25maWcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKHZtLnNlYXJjaFRpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh2bS5zZWFyY2hUaW1lcik7XG4gICAgICB9XG5cbiAgICAgIHZtLnNlYXJjaFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdm0uc2VhcmNoVGltZXIgPSBudWxsO1xuICAgICAgICB2bS5maWx0ZXJUZXh0ID0gdm0uX3NlYXJjaFRleHQ7XG4gICAgICAgIGlmKCF2bS5zY29wZS4kJHBoYXNlKSB7XG4gICAgICAgICAgICB2bS5zY29wZS4kZGlnZXN0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sIHZtLmNvbmZpZy5kZWxheSB8fCAwKTtcbiAgICB9LFxuICAgIGdldCBzZWFyY2hUZXh0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NlYXJjaFRleHQ7XG4gICAgfVxuICB9XG5cbn0pKCk7XG5cbihmdW5jdGlvbihyb290KSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBTVE9QUEVEICA9IDA7XG4gIHZhciBTVE9QUElORyA9IDE7XG4gIHZhciBSVU5OSU5HICA9IDI7XG5cbiAgZnVuY3Rpb24gZW5kc1dpdGgoc3RyLCBzdWZmaXgpIHtcbiAgICByZXR1cm4gc3RyLmluZGV4T2Yoc3VmZml4LCBzdHIubGVuZ3RoIC0gc3VmZml4Lmxlbmd0aCkgIT09IC0xO1xuICB9XG5cbiAgZnVuY3Rpb24gbm9vcCgpIHt9XG5cbiAgZnVuY3Rpb24gTWFsYXJrZXkoZWxlbSwgb3B0cykge1xuXG4gICAgLy8gYWxsb3cgYE1hbGFya2V5YCB0byBiZSBjYWxsZWQgd2l0aG91dCB0aGUgYG5ld2Aga2V5d29yZFxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoIShzZWxmIGluc3RhbmNlb2YgTWFsYXJrZXkpKSB7XG4gICAgICByZXR1cm4gbmV3IE1hbGFya2V5KGVsZW0sIG9wdHMpO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgYG9wdHNgXG4gICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgdmFyIGxvb3AgPSBvcHRzLmxvb3A7XG4gICAgdmFyIHR5cGVTcGVlZCA9IG9wdHMuc3BlZWQgfHwgb3B0cy50eXBlU3BlZWQgfHwgNTA7XG4gICAgdmFyIGRlbGV0ZVNwZWVkID0gb3B0cy5zcGVlZCB8fCBvcHRzLmRlbGV0ZVNwZWVkIHx8IDUwO1xuICAgIHZhciBwYXVzZURlbGF5ID0gb3B0cy5kZWxheSB8fCBvcHRzLnBhdXNlRGVsYXkgfHwgMjAwMDtcbiAgICB2YXIgcG9zdGZpeCA9IG9wdHMucG9zdGZpeCB8fCAnJztcbiAgICB2YXIgZ2V0dGVyID0gb3B0cy5nZXR0ZXIgfHwgZnVuY3Rpb24oZWxlbSkge1xuICAgICAgcmV0dXJuIGVsZW0uaW5uZXJIVE1MO1xuICAgIH07XG4gICAgdmFyIHNldHRlciA9IG9wdHMuc2V0dGVyIHx8IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xuICAgICAgZWxlbS5pbm5lckhUTUwgPSB2YWw7XG4gICAgfTtcblxuICAgIC8vIHRoZSBmdW5jdGlvbiBxdWV1ZVxuICAgIHZhciBmblF1ZXVlID0gW107XG4gICAgdmFyIGFyZ3NRdWV1ZSA9IFtdO1xuICAgIHZhciBpID0gLTE7XG4gICAgdmFyIHN0YXRlID0gU1RPUFBFRDtcbiAgICB2YXIgcGF1c2VDYiA9IG5vb3A7XG4gICAgZnVuY3Rpb24gZW5xdWV1ZShmbiwgYXJncykge1xuICAgICAgZm5RdWV1ZS5wdXNoKGZuKTtcbiAgICAgIGFyZ3NRdWV1ZS5wdXNoKGFyZ3MpO1xuICAgICAgaWYgKHN0YXRlICE9IFJVTk5JTkcpIHtcbiAgICAgICAgc3RhdGUgPSBSVU5OSU5HO1xuICAgICAgICAvLyB3YWl0IGZvciB0aGUgcmVtYWluaW5nIGZ1bmN0aW9ucyB0byBiZSBlbnF1ZXVlZFxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgIGlmIChzdGF0ZSAhPSBSVU5OSU5HKSB7XG4gICAgICAgIHN0YXRlID0gU1RPUFBFRDtcbiAgICAgICAgcGF1c2VDYihlbGVtKTtcbiAgICAgICAgcGF1c2VDYiA9IG5vb3A7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICgrK2kgPT0gZm5RdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFsb29wKSB7XG4gICAgICAgICAgaSA9IGZuUXVldWUubGVuZ3RoIC0gMTsgLy8gc2V0IGBpYCB0byB0aGUgbGFzdCBlbGVtZW50IG9mIGBmblF1ZXVlYFxuICAgICAgICAgIHN0YXRlID0gU1RPUFBFRDtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaSA9IDA7XG4gICAgICB9XG4gICAgICBmblF1ZXVlW2ldLmFwcGx5KG51bGwsIFtdLmNvbmNhdChuZXh0LCBhcmdzUXVldWVbaV0pKTtcbiAgICB9XG5cbiAgICAvLyBpbnRlcm5hbCBmdW5jdGlvbnMgdGhhdCBhcmUgYGVucXVldWVkYCB2aWEgdGhlIHJlc3BlY3RpdmUgcHVibGljIG1ldGhvZHNcbiAgICBmdW5jdGlvbiBfdHlwZShjYiwgc3RyLCBzcGVlZCkge1xuICAgICAgdmFyIGxlbiA9IHN0ci5sZW5ndGg7XG4gICAgICBpZiAoIWxlbikge1xuICAgICAgICByZXR1cm4gY2IoKTtcbiAgICAgIH1cbiAgICAgIChmdW5jdGlvbiB0KGkpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZXR0ZXIoZWxlbSwgZ2V0dGVyKGVsZW0pICsgc3RyW2ldKTtcbiAgICAgICAgICBpICs9IDE7XG4gICAgICAgICAgaWYgKGkgPCBsZW4pIHtcbiAgICAgICAgICAgIHQoaSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBzcGVlZCk7XG4gICAgICB9KSgwKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gX2RlbGV0ZShjYiwgeCwgc3BlZWQpIHtcbiAgICAgIHZhciBjdXJyID0gZ2V0dGVyKGVsZW0pO1xuICAgICAgdmFyIGNvdW50ID0gY3Vyci5sZW5ndGg7IC8vIGRlZmF1bHQgdG8gZGVsZXRpbmcgZW50aXJlIGNvbnRlbnRzIG9mIGBlbGVtYFxuICAgICAgaWYgKHggIT0gbnVsbCkge1xuICAgICAgICBpZiAodHlwZW9mIHggPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAvLyBkZWxldGUgdGhlIHN0cmluZyBgeGAgaWYgYW5kIG9ubHkgaWYgYGVsZW1gIGVuZHMgd2l0aCBgeGBcbiAgICAgICAgICBpZiAoZW5kc1dpdGgoY3VyciwgeCArIHBvc3RmaXgpKSB7XG4gICAgICAgICAgICBjb3VudCA9IHgubGVuZ3RoICsgcG9zdGZpeC5sZW5ndGg7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvdW50ID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZGVsZXRlIHRoZSBsYXN0IGB4YCBjaGFyYWN0ZXJzIGZyb20gYGVsZW1gXG4gICAgICAgICAgaWYgKHggPiAtMSkge1xuICAgICAgICAgICAgY291bnQgPSBNYXRoLm1pbih4LCBjb3VudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWNvdW50KSB7XG4gICAgICAgIHJldHVybiBjYigpO1xuICAgICAgfVxuICAgICAgKGZ1bmN0aW9uIGQoY291bnQpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgY3VyciA9IGdldHRlcihlbGVtKTtcbiAgICAgICAgICBpZiAoY291bnQpIHtcbiAgICAgICAgICAgIC8vIGRyb3AgbGFzdCBjaGFyXG4gICAgICAgICAgICBzZXR0ZXIoZWxlbSwgY3Vyci5zdWJzdHJpbmcoMCwgY3Vyci5sZW5ndGgtMSkpO1xuICAgICAgICAgICAgZChjb3VudCAtIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgc3BlZWQpO1xuICAgICAgfSkoY291bnQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfY2xlYXIoY2IpIHtcbiAgICAgIHNldHRlcihlbGVtLCAnJyk7XG4gICAgICBjYigpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfY2FsbChjYiwgZm4pIHtcbiAgICAgIGZuLmNhbGwoY2IsIGVsZW0pO1xuICAgIH1cblxuICAgIC8vIGV4cG9zZSB0aGUgcHVibGljIG1ldGhvZHNcbiAgICBzZWxmLnR5cGUgPSBmdW5jdGlvbihzdHIsIHNwZWVkKSB7XG4gICAgICByZXR1cm4gZW5xdWV1ZShfdHlwZSwgW3N0ciArIHBvc3RmaXgsIHNwZWVkIHx8IHR5cGVTcGVlZF0pO1xuICAgIH07XG4gICAgc2VsZi5kZWxldGUgPSBmdW5jdGlvbih4LCBzcGVlZCkge1xuICAgICAgcmV0dXJuIGVucXVldWUoX2RlbGV0ZSwgW3gsIHNwZWVkIHx8IGRlbGV0ZVNwZWVkXSk7XG4gICAgfTtcbiAgICBzZWxmLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZW5xdWV1ZShfY2xlYXIpO1xuICAgIH07XG4gICAgc2VsZi5wYXVzZSA9IGZ1bmN0aW9uKGRlbGF5KSB7XG4gICAgICByZXR1cm4gZW5xdWV1ZShzZXRUaW1lb3V0LCBbZGVsYXkgfHwgcGF1c2VEZWxheV0pO1xuICAgIH07XG4gICAgc2VsZi5jYWxsID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKF9jYWxsLCBbZm5dKTtcbiAgICB9O1xuICAgIHNlbGYudHJpZ2dlclBhdXNlID0gZnVuY3Rpb24oY2IpIHtcbiAgICAgIHN0YXRlID0gU1RPUFBJTkc7XG4gICAgICBwYXVzZUNiID0gY2IgfHwgbm9vcDtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG4gICAgc2VsZi50cmlnZ2VyUmVzdW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc3RhdGUgIT0gUlVOTklORykgeyAvLyBpZS4gYFNUT1BQRURgIG9yIGBTVE9QUElOR2BcbiAgICAgICAgdmFyIHByZXZTdGF0ZSA9IHN0YXRlO1xuICAgICAgICBzdGF0ZSA9IFJVTk5JTkc7XG4gICAgICAgIGlmIChwcmV2U3RhdGUgPT0gU1RPUFBFRCkge1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcbiAgICBzZWxmLmlzUnVubmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHN0YXRlICE9IFNUT1BQRUQ7IC8vIGllLiBgUlVOTklOR2Agb3IgYFNUT1BQSU5HYFxuICAgIH07XG5cbiAgfVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmICh0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBNYWxhcmtleTtcbiAgfSBlbHNlIHtcbiAgICByb290Lm1hbGFya2V5ID0gTWFsYXJrZXk7XG4gIH1cblxufSkodGhpcyk7XG5cbmFuZ3VsYXIubW9kdWxlKCduZy1zbWFydC1pbnB1dCcpLnJ1bihbJyR0ZW1wbGF0ZUNhY2hlJywgZnVuY3Rpb24oJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAkdGVtcGxhdGVDYWNoZS5wdXQoJ25nU21hcnRJbnB1dC5odG1sJyxcbiAgICAgICAgXCI8ZGl2IGNsYXNzPVxcXCJpbnB1dC1ncm91cCB3aWR0aC0xMDBwY3RcXFwiPjxpbnB1dCBjbGFzcz1cXFwiZm9ybS1jb250cm9sXFxcIiBwbGFjZWhvbGRlcj1cXFwiXFxcIiBuZy1hdHRyLWlkPVxcXCJ7e2NvbmZpZy5pZH19XFxcIiBkYXRhLW5nLW1vZGVsPVxcXCJzaWMuc2VhcmNoVGV4dFxcXCIgZGF0YS10b2dnbGU9XFxcImRyb3Bkb3duXFxcIiBhcmlhLWhhc3BvcHVwPVxcXCJ0cnVlXFxcIiBhcmlhLWV4cGFuZGVkPVxcXCJmYWxzZVxcXCIvPjx1bCBjbGFzcz1cXFwiZHJvcGRvd24tbWVudSBkcm9wZG93bi1tZW51LXJpZ2h0IHdpZHRoLTEwMHBjdCBvcGFjaXR5LTA5XFxcIj48bGkgZGF0YS1uZy1yZXBlYXQ9XFxcInN1ZyBpbiBjb25maWcuc3VnZ2VzdGlvbnMgfCBmaWx0ZXI6c2ljLmZpbHRlclRleHQgfCBsaW1pdFRvOmNvbmZpZy5tYXggfHwgNVxcXCI+PGEgaHJlZj1cXFwiamF2YXNjcmlwdDo7XFxcIiBkYXRhLW5nLWNsaWNrPVxcXCJzaWMuc2VhcmNoVGV4dCA9IHN1Z1xcXCI+PHNwYW4+e3tzdWd9fTwvc3Bhbj48L2E+PC9saT48L3VsPjwvZGl2PlwiKTtcbn1dKTsiXSwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
