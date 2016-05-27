(function() {
	'use-strict';

	angular.module('app', ['ng-smart-input'])
	.controller('mainController', function() {
		var vm = this;

		vm.smartInputConfig = {
			id: 'fancy-input',
			placeholders: [
				'fancy smart input...',
				'type in your search text here'
			],
			delay: 500,
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
				'antler',
				'obama',
				'omaha',
				'alabama'
			]
		};
	});

})();
