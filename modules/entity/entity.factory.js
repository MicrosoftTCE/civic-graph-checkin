(function (angular) {

    var dependencyList = [
        EntityFactory
    ];

    function isDef(o) {
        return o !== undefined && o !== null;
    }

    function EntityFactory() {

        function EntityService(o) {
            var defObj = isDef(o) ? o : {},
                self   = this;

            function setProperty(property, value) {
                return isDef(defObj[property]) ? defObj[property] : (isDef(value) ? value : null);
            }

            self.categories           = setProperty("categories", []);
            self.collaborations       = setProperty("collaborations", []);
            self.data_given           = setProperty("data_given", []);
            self.data_received        = setProperty("data_received", []);
            self.employees            = setProperty("employees");
            self.employments          = setProperty("employments", []);
            self.expenses             = setProperty("expenses", []);
            self.followers            = setProperty("followers");
            self.grants_given         = setProperty("grants_given", []);
            self.grants_received      = setProperty("grants_received", []);
            self.id                   = setProperty("id");
            self.influence            = setProperty("influence", "Global");
            self.investments_made     = setProperty("investments_made", []);
            self.investments_received = setProperty("investments_received", []);
            self.key_people           = setProperty("key_people", []);
            self.locations            = setProperty("locations", []);
            self.name                 = setProperty("name", "");
            self.nickname             = setProperty("nickname");
            self.revenues             = setProperty("revenues", []);
            self.twitter_handle       = setProperty("twitter_handle");
            self.type                 = setProperty("type", 'Individual');
            self.url                  = setProperty("url");
            self.isGuest              = setProperty("isGuest", true);
        }

        return {
            "getInstance": getInstance
        };

        function getInstance(o) {
            return new EntityService(o)
        }
    }

    angular.module('civic-graph-kiosk')
        .factory("EntityFactory", dependencyList)

})(angular);
