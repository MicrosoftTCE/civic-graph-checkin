(function (angular) {

    'use strict';

    angular.module('civic-graph-kiosk')
        .constant('_', window._)
        .config(['$locationProvider', '$httpProvider', function ($locationProvider, $httpProvider) {
            $locationProvider.html5Mode(true);
            $httpProvider.defaults.headers.common['Event-Name'] = 'Test_Event';
        }]);

})(angular);
