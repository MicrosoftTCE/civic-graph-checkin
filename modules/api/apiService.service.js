/**
 * Created by brianavecchione on 11/28/16.
 */

(function (angular) {

    'use strict';

    var dependencyList = [
        '$http',
        ApiService
    ];

    function ApiService($http) {

        var server = window.location.protocol+'//'+window.location.host+'/api';

        this.get = function (url, params) {
            return $http.get(server+url,params);
        };

        this.post = function (url, params) {
            return $http.post(server+url,params);
        };

    }

    angular.module('civic-graph-kiosk').service('apiService',dependencyList);


})(angular);