(function (angular) {
    'use strict';

    var controllerDependencyList = [
        '$scope',
        '$http',
        '$timeout',
        '_',
        'EntityFactory',
        Controller
    ];

    var configDependencyList = [
        '$routeProvider',
        Config
    ];

    function isDef(o) {
        return o !== undefined && o !== null;
    }

    function isNotEmptyArray(o) {
        return Array.isArray(o) && o.length > 0;
    }

    function Controller($scope, $http, $timeout, _, EntityFactory) {

        var main = this;

        activate(true);

        function activate(queryAPI) {
            main.isDataLoaded = false;

            main.isRegisteredMember = false;

            main.showSecondPart = false;

            main.isSaving = false;

            main.entities = [];
            $scope.categories = [];

            // Get from database.
            $scope.editEntity = EntityFactory.getInstance();

            // This is a variable specific to this form.
            $scope.editEntity.isGuest = true;
            // self.showSecondPart       = !isRegisteredMember();

            $scope.newOrganization = EntityFactory.getInstance();
            $scope.newOrganization.type = null;

            $scope.employerFound = false;
            $scope.error = false;
            $scope.templateShown = false;
            $scope.updating = false;
            $scope.waitingForResponse = false;

            $scope.categories = (Array.isArray($scope.categories) ? $scope.categories : []);

            $scope.editCategories = $scope.categories.map(function (c) {
                return {
                    'name': c.name,
                    'enabled': isDef($scope.editEntity.categories)
                        ? $scope.editEntity.categories
                        : {'name': c.name},
                    'id': c.id
                };
            });

            addBlankFields($scope.editEntity);
            addBlankFields($scope.newOrganization);

            main.continueForm = continueForm;
            main.isNewMember = isNewMember;
            main.isValid = isValid;
            main.setRegisteredToFalse = setRegisteredToFalse;
            main.setCurrentEntityToSelected = setCurrentEntityToSelected;

            $scope.add = add;
            $scope.addLocation = addLocation;
            $scope.addNameToOrg = addNameToOrg;
            $scope.addressSearch = addressSearch;
            $scope.autoSetAddress = autoSetAddress;
            $scope.checkinTime = checkinTime;
            $scope.checkOrganization = checkOrganization;
            $scope.getCollaboratorColor = getCollaboratorColor;
            $scope.isValidAdd = isValidAdd;
            $scope.removeCollaboration = removeCollaboration;
            $scope.setCollaboration = setCollaboration;
            $scope.setConnection = setConnection;
            $scope.setLocation = setLocation;
            $scope.submit = submit;
            $scope.updateMemberStatus = updateMemberStatus;

            if (queryAPI) {
                $http.get('api/entities')
                    .then(function(resp){
                        parseEntityResponse(resp.data);
                    }, mockResponse)
                    .then(function () {
                        $http.get('api/categories')
                            .success(parseCategoryResponse)
                            .error(function (e) {
                                if (isDef(e.info)) {
                                    console.log(e.info);
                                }
                                parseCategoryResponse();
                            });
                    });
            }

        }

        function add(optOut) {
            console.log(optOut);
            $scope.templateShown = false;
            removeEmpty($scope.newOrganization);
            saveOrgToDB($scope.newOrganization);
            removeEmpty($scope.editEntity);
            savetoDB($scope.editEntity, optOut);
        }

        function addBlankFields(entity) {
            addLocation(entity.locations);
            addKeyPerson();
            addFundingConnection(entity.grants_received);
            addFundingConnection(entity.investments_received);
            addFundingConnection(entity.grants_given);
            addFundingConnection(entity.investments_made);
            addConnection(entity.data_given);
            addConnection(entity.data_received);
            addConnection(entity.collaborations);
            addConnection(entity.employments);
            addFinance(entity.revenues);
            addFinance(entity.expenses);
        }

        function addConnection(connections) {
            // Add an empty connection to edit if none exist.
            if (!_.some(connections, {'entity': '', 'id': null})) {
                connections.push({'entity': '', 'id': null, 'details': null});
            }
        }

        function addFinance(records) {
            // Add new finance field if all current fields are valid.
            if (_.every(records, function (r) {
                    return r.amount > 0 && r.year > 1750;
                })) {
                records.push({'amount': null, 'year': null, 'id': null});
            }
        }

        function addFundingConnection(funding) {
            if (!_.some(funding, {'entity': ''})) {
                // Maybe set amount to 0 instead of null?
                funding.push({'entity': '', 'amount': null, 'year': null, 'id': null});
            }
        }

        function addKeyPerson() {
            // Add blank field to edit if there are none.
            // WATCH OUT! TODO: If someone deletes an old person, delete their id too.
            // i.e. make sure old/cleared form fields aren't being edited into new people.
            if (!(_.some($scope.editEntity.key_people, {'name': '', 'id': null}))) {
                $scope.editEntity.key_people.push({'name': '', 'id': null});
            }
        }

        function addLocation(locations) {
            if (!_.some(locations, {'full_address': '', 'id': null})) {
                locations.push({'full_address': '', 'id': null});
            }
        }

        function addNameToOrg() {
            $scope.newOrganization.name = $scope.editEntity.employments[0].entity;
            $scope.editEntity.employments[0].entity_id = null;
        }

        function addOrgToEntity() {
            var newOrg = main.entities.find(function (item) {
                return item.name === $scope.editEntity.employments[0].entity;
            });

            $scope.editEntity.employments[0].entity = newOrg.name;
            $scope.editEntity.employments[0].entity_id = newOrg.id;
        }

        function addressSearch(search) {
            return queryVirtualEarthMap(search)
                .then(function (response) {
                    return response.data.resourceSets[0].resources;
                });
        }

        function autoSetAddress(search, entity) {
            return queryVirtualEarthMap(search)
                .then(function (response) {
                    var location = response.data.resourceSets[0].resources[0];
                    if (isDef(location)) {
                        setLocation(entity.locations[0], location);
                    }
                });
        }

        function mockResponse(e) {
            if (isDef(e.info)) {
                console.log(e.info);
            }
            var mockEntity = EntityFactory.getInstance();
            mockEntity.name = "Briana Vecchione";

            var mockEntityList = [mockEntity];

            parseEntityResponse({"nodes": mockEntityList});
        }

        //Logs user timestamp during check-in
        function checkinTime() {
            $scope.timestamp = new Date();
        }

        function checkOrganization() {
            var orgValue = $scope.editEntity.employments[0].entity.toLowerCase();
            if (!existsInArray(orgValue, $scope.entityNames) && orgValue !== "") {
                if (!$scope.templateShown) {
                    $scope.templateShown = true;
                }
            }
            else {
                $scope.templateShown = false;
            }
        }

        function continueForm() {
            main.showSecondPart = true;
        }

        function existsInArray(string, array) {
            return (array.indexOf(string) >= 0);
        }

        function getCollaboratorColor(collaborator) {
            var collabentity = _.first(_.where(main.entities, {id: collaborator.entity_id}));
            if (collabentity) {
                return collabentity.type + "-color";
            }
        }

        function isNewMember() {
            //if you're not a guest and you're not a registered member
            $('#newmembermsg').hide();
            return !($scope.editEntity.isGuest || main.isRegisteredMember);
        }

        function isValid() {
            var validName = !!$scope.editEntity.name,
                validOrg = ($scope.newOrganization.name
                    && $scope.newOrganization.type
                    && $scope.newOrganization.locations[0].full_address)
                    || $scope.editEntity.employments[0].entity_id,
                validGuest = !$scope.editEntity.isGuest || ($scope.editEntity.isGuest
                    && $scope.editEntity.guestHost);

            return validName && validOrg && validGuest;
        }

        function isValidAdd() {
            return $scope.editEntity.locations[0].full_address;
        }

        function setRegisteredToFalse() {
            main.isRegisteredMember = false;
        }

        function setCurrentEntityToSelected(item) {
            // I believe that if the entity was selected from the list, then they are not a guest.
            // Unless we are allowing duplicate registers.  ???
            // $scope.isRegisteredMember = !$scope.editEntity.isGuest;
            main.isRegisteredMember = true;
            $scope.editEntity.isGuest = false;

            if (isNotEmptyArray(item.employments)) {
                $scope.editEntity.employments[0] = item.employments[0];
                $scope.employerFound = true;
            }

            if (isNotEmptyArray(item.locations)) {
                $scope.editEntity.locations[0] = {full_address: item.locations[0].full_address};
            }

            console.log("Item selected after parsing: %O", item);
        }

        function parseCategoryResponse(data) {
            $scope.categories = (isDef(data) && Array.isArray(data.categories))
                ? data.categories
                : [];
            $scope.editCategories = $scope.categories.map(function (c) {
                return {
                    'name': c.name,
                    'enabled': isDef($scope.editEntity.categories)
                        ? $scope.editEntity.categories
                        : {'name': c.name},
                    'id': c.id
                };
            });
        }

        function parseEntityResponse(data) {
            console.log(data);
            if (!isDef(data) || !Array.isArray(data.nodes)) {
                main.entities = [];
                $scope.entityNames = [];
                return;
            }

            main.isDataLoaded = true;

            main.entities = data.nodes;
            $scope.entityNames = _.uniq(_.pluck(main.entities, 'name'))
                .map(function (name) {
                    return name.toLowerCase();
                });

            console.log("Entities recieved from API: %O", main.entities);
            console.log("Entity name list: %O", $scope.entityNames);
        }

        function queryVirtualEarthMap(search) {
            return $http.jsonp('http://dev.virtualearth.net/REST/v1/Locations', {
                params: {
                    query: search,
                    key: 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD',
                    'jsonp': 'JSON_CALLBACK',
                    'incl': 'ciso2'
                }
            });
        }

        function removeCollaboration(collaborator) {
            var index = $scope.editEntity.collaborations.indexOf(collaborator);
            $scope.editEntity.collaborations.splice(index, 1);
        }

        function removeEmpty(entity) {

            function filterEmptyParameterString(parameter) {
                return function (o) {
                    return o[parameter] !== '';
                }
            }

            function filterFinance(o) {
                return o.amount > 0 || o.year >= 1750;
            }

            function removeCommas(finances) {
                finances.forEach(function (f) {
                    try {
                        f.amount = Number(f.amount.replace(',', ''));
                    } catch (err) {
                        // Can't replace on numbers, only on strings.
                    }
                });
            }

            var financeTypes = [
                'grants_received',
                'investments_received',
                'grants_given',
                'investments_made',
                'revenues',
                'expenses'
            ];

            // Clear the empty unedited new items.
            financeTypes.forEach(function (financetype) {
                removeCommas(entity[financetype]);
            });

            entity.categories = $scope.editCategories.filter(function (o) {
                return o.enabled;
            });

            entity.locations = entity.locations.filter(filterEmptyParameterString("full_address"));

            entity.key_people = entity.key_people.filter(filterEmptyParameterString("name"));

            entity.grants_received =
                entity.grants_received.filter(filterEmptyParameterString("entity"));

            entity.investments_received =
                entity.investments_received.filter(filterEmptyParameterString("entity"));

            entity.grants_given = entity.grants_given.filter(filterEmptyParameterString("entity"));

            entity.investments_made =
                entity.investments_made.filter(filterEmptyParameterString("entity"));

            entity.data_given = entity.data_given.filter(filterEmptyParameterString("entity"));

            entity.data_received =
                entity.data_received.filter(filterEmptyParameterString("entity"));

            entity.collaborations =
                entity.collaborations.filter(filterEmptyParameterString("entity"));

            entity.employments = entity.employments.filter(filterEmptyParameterString("entity"));

            entity.revenues = entity.revenues.filter(filterFinance);

            entity.expenses = entity.expenses.filter(filterFinance);

        }

        function saveOrgToDB(entity) {
            $scope.waitingForResponse = true;
            $scope.updating = true;
            $http.post('api/save', {'entity': entity})
                .success(function (response) {
                    $scope.waitingForResponse = false;
                    parseEntityResponse(response);
                    addOrgToEntity();
                })
                .error(function () {
                    $scope.waitingForResponse = false;
                    console.log('ERROR');
                    $scope.error = true;
                    $timeout(function () {
                        $scope.error = false;
                        $scope.updating = false;
                        addBlankFields();
                    }, 2000);
                });
        }

        function savetoDB(entity, optOut) {
            console.log(JSON.stringify({'entity': entity}));
            main.isSaving = true;
            $http.post('api/save', {'entity': entity, 'optOut': optOut})
                .success(function (response) {
                    parseEntityResponse(response);
                    document.getElementById("nEntityForm").reset();
                    activate(false);
                    // $scope.editEntity           = EntityFactory.getInstance();
                    // main.isRegisteredMember = false;
                    // $scope.newOrganization      = EntityFactory.getInstance();
                    // $scope.newOrganization.type = null;
                    // addBlankFields($scope.editEntity);
                    // addBlankFields($scope.newOrganization);
                    // main.isSaving = false;
                })
                .error(function (data, status, headers, config) {
                    window.location.reload();
                    console.log('ERROR');
                    console.log(status);
                    console.log(headers);
                    console.log(config);
                    $scope.error = true;
                    main.isSaving = false;
                    $timeout(function () {
                        $scope.error = false;
                        $scope.updating = false;
                        addBlankFields($scope.editEntity);
                        addBlankFields($scope.newOrganization);
                    }, 2000);
                });
        }

        function setCollaboration(entity, connection) {
            $scope.templateShown = false;
            addConnection($scope.editEntity.collaborations);
            connection.entity_id = entity.id;
        }

        function setConnection(entity, connection) {
            $scope.templateShown = false;
            connection.entity_id = entity.id;
        }

        function setLocation(location, data) {
            location.full_address =
                'formattedAddress' in data.address && $scope.editEntity.type !== 'Individual'
                    ? data.address.formattedAddress : null;
            location.address_line =
                'addressLine' in data.address && $scope.editEntity.type !== 'Individual'
                    ? data.address.addressLine : null;
            location.locality = 'locality' in data.address ? data.address.locality : null;
            location.district =
                'adminDistrict' in data.address ? data.address.adminDistrict : null;
            location.postal_code =
                'postalCode' in data.address ? data.address.postalCode : null;
            location.country =
                'countryRegion' in data.address ? data.address.countryRegion : null;
            location.country_code =
                'countryRegionIso2' in data.address ? data.address.countryRegionIso2 : null;
            location.coordinates = 'point' in data ? data.point.coordinates : null;
            if ($scope.editEntity.type === 'Individual') {
                location.full_address =
                    location.locality ? location.district ? location.locality + ', '
                    + location.district
                        : location.locality
                        : location.country;
            }
            $('#locationmsg').hide();
            $('#locationmsgorg').hide();
        }

        function submit() {
            // console.log($scope.templateShown);
            if (!$scope.editEntity.employments[0].entity_id
                && $scope.editEntity.employments[0].entity && !$scope.newOrganization.type) {
                return false;
            }

            if ($scope.newOrganization.name && $scope.newOrganization.type
                && $scope.newOrganization.locations[0].full_address) {
                removeEmpty($scope.newOrganization);
                saveOrgToDB($scope.newOrganization);
            }
            $("html, body").animate({scrollTop: $(window).height()}, 600);
            return false;
        }

        function updateMemberStatus() {
            main.showSecondPart = !main.isRegisteredMember;
            console.log("Initial value of variable in question: %O", main.showSecondPart);
        }
    }

    function Config($routeProvider) {
        $routeProvider
            .when("/", {
                "controller": "MainController",
                "controllerAs": "main",
                "templateUrl": "/modules/main/main.template.html"
            })
    }

    angular.module('civic-graph-kiosk')
        .config(configDependencyList)
        .controller('MainController', controllerDependencyList);

})(angular);
