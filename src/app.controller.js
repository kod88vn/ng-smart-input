(function() {
	'use-strict';

	angular.module('ng-smart-input')
	.controller('mainController', function() {
		var vm = this;

		vm.smartInputConfig = {
      id: 'fancy-input',
      placeholder: 'fancy input'
    };
	});

})();
