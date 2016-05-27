(function() {
	'use-strict';

	// load malarkey from our combined js file
	if(typeof(module) !== 'undefined' && module.exports) {
		malarkey = module.exports;
	}

	angular.module('ng-smart-input', [])
	.directive('smartInput', function() {
		return {
			restrict: 'E',
			scope: {
				config: '='
			},
			template: '<input placeholder ng-attr-id="{{config.id}}" />',
			controller:['$scope', '$timeout', function($scope, $timeout) {
				$timeout(function() {
					var config = $scope.config;

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
			}]
		}
	});

})();
