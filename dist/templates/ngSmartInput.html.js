angular.module('ng-smart-input').run(['$templateCache', function($templateCache) {
    $templateCache.put('ngSmartInput.html',
        "<div class=\"input-group width-100pct\"><input class=\"form-control\" placeholder=\"\" ng-attr-id=\"{{config.id}}\" data-ng-model=\"sic.searchText\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\"/><ul class=\"dropdown-menu dropdown-menu-right width-100pct opacity-09\"><li data-ng-repeat=\"sug in config.suggestions | filter:sic.filterText | limitTo:config.max || 5\"><a href=\"javascript:;\" data-ng-click=\"sic.searchText = sug\"><span>{{sug}}</span></a></li></ul></div>");
}]);