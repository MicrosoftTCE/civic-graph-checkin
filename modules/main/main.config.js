(function (angular) {

    'use strict';

    var dependencyList = [
        '$locationProvider',
        '$httpProvider',
        '$routeProvider',
        Config
    ];

    function Config($locationProvider, $httpProvider, $routeProvider) {
        $locationProvider.html5Mode(true);

        $httpProvider.defaults.headers.common['Event-Name'] = 'Test_Event';

        $routeProvider.otherwise("/")
    }

    angular.module('civic-graph-kiosk')
        .constant('_', window._)
        .config(dependencyList);

})(angular);
