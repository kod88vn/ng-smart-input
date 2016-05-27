(function() {
	'use-strict';

	angular.module('app', ['ng-smart-input'])
	.controller('mainController', function() {
		var vm = this;

		vm.smartInputConfig = {
      id: 'fancy-input',
      placeholder: 'fancy smart input',
      suggestions: [
      	'angular', 
      	'angoala', 
      	'kola', 
      	'ant', 
      	'angry',
      	'anthem',
      	'apple',
      	'ak',
      	'car',
      	'arse',
      	'anker',
      	'antler'
    	]
    };
	});

})();
