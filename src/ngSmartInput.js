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

			malarkey(elem, opts).type($scope.config.placeholder).pause().delete();
		});
	}

	SmartInputController.prototype = {
    set searchText (text) {
      var vm = this;
      vm._searchText = text;

      if(text.length === 0) {
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
