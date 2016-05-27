(function() {
	'use-strict';

	angular.module('app', ['ng-smart-input'])
	.controller('mainController', MainController);

	function MainController($scope) {
		var vm = this;
		vm.newPhrase = '';
		vm.newPhraseTimer = null;
		vm.scope = $scope;

		vm.smartInputConfig = {
			id: 'fancy-input',
			placeholders: [
				'fancy smart input...',
				'your search text goes here'
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
	}

	MainController.prototype = {
    set newPhrase (text) {
      var vm = this;
      vm._newPhrase = text;

      if(!vm._newPhrase) {
      	return;
      }

      if(vm.newPhraseTimer) {
        clearTimeout(vm.newPhraseTimer);
      }

      vm.newPhraseTimer = setTimeout(function() {
        vm.newPhraseTimer = null;
        vm.smartInputConfig.suggestions.push(text);
        vm._newPhrase = '';

        if(!vm.scope.$$phase) {
            vm.scope.$digest(); 
        }
      }, 1000);
    },
    get newPhrase() {
      return this._newPhrase;
    }
  }

})();
