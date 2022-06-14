'use strict';

var myApp = angular.module('myApp', ['ui.bootstrap']).config(function($rootScopeProvider) {

    // Set recursive digest limit higher to handle very deep trees.
    $rootScopeProvider.digestTtl(17);
});

// Declare top level URL vars
var baseUrl = "https://browser.ihtsdotools.org/snowstorm/snomed-ct";
var edition = "MAIN";
var version = "2020-03-09"; // 9th march 2020

// Initialization of myApp
myApp.run(['$rootScope', '$http', '$window', function($rootScope, $http, $window) {
    // n/a
}]);

// Controller for the page
myApp.controller('SimpleCtrl', function($scope, $http) {

    $scope.edition = edition;
    $scope.version = version;

    // init descendants limit
    $scope.limit = 10000;

    // Scope variables
    $scope.errorMsg = null;
    $scope.findByQueryResult = null;
    $scope.findByQueryUrl = null;
    $scope.findByQueryCt = 0;
    $scope.findByDescriptionIdResult = null;
    $scope.findByDescriptionIdUrl = null;
    $scope.findByConceptIdResult = null;
    $scope.findByConceptIdUrl = null;
    $scope.findByQueryWithFitlerResult = null;
    $scope.findByQueryWithFilterUrl = null;
    $scope.findDescendantsByConceptIdResult = null;
    $scope.findDescendantsOnFHIR = null;
    $scope.findLoadsDescendantsOnFHIR = null;

    // Clear error
    $scope.clearError = function() {
        $scope.errorMsg = null;
    }

    // Clear all scope vars
    $scope.clear = function() {
        $scope.errorMsg = null;
        $scope.findByQueryResult = null;
        $scope.findByQueryUrl = null;
        $scope.findByQueryCt = 0;
        $scope.findByDescriptionIdResult = null;
        $scope.findByDescriptionIdUrl = null;
        $scope.findByConceptIdResult = null;
        $scope.findByConceptIdUrl = null;
        $scope.findByQueryWithFitlerResult = null;
        $scope.findByQueryWithFilterUrl = null;
        $scope.findDescendantsByConceptIdResult = null;
        $scope.findDescendantsOnFHIR = null;
        $scope.findLoadsDescendantsOnFHIR = null;
    }

    // Find by query and set the scrollable raw json result
    $scope.findByQuery = function(query) {
        console.debug('findByQuery', query);

        // Make the HTTP Call
        $scope.findByQueryUrl = baseUrl + '/' + edition + '/' + version + '/concepts?term=' +
            encodeURIComponent(query) + '&activeFilter=true&offset=0&limit=50';
        $http.get($scope.findByQueryUrl).then(
            // success
            function(response) {
                console.debug('  matches = ', response.data);
                $scope.findByQueryResult = JSON.stringify(response.data, null, 2);
                $scope.findByQueryCt = response.data.total;
            },
            // error
            function(response) {
                $scope.errorMsg = response;
            });
    }

    // Find by description id and set the scrollable raw json result
    $scope.findByDescriptionId = function(query) {
        console.debug('findByDescriptionId', query);

        // Make the HTTP Call
        $scope.findByDescriptionIdUrl = baseUrl + '/' + edition + '/' + version + '/descriptions/' +
            query;
        $http.get($scope.findByDescriptionIdUrl).then(
            // success
            function(response) {
                console.debug('  matches = ', response.data);
                $scope.findByDescriptionIdResult = JSON.stringify(response.data, null, 2);
                //$scope.findByDescriptionIdCt = response.data.details.total;
            },
            // error
            function(response) {
                $scope.errorMsg = response;
            });
    }

    // Find by concept id and set the scrollable raw json result
    $scope.findByConceptId = function(query) {
        console.debug('findByConceptId', query);

        // Make the HTTP Call
        $scope.findByConceptIdUrl = baseUrl + '/browser/' + edition + '/' + version + '/concepts/' + query;
        $http.get($scope.findByConceptIdUrl).then(
            // success
            function(response) {
                console.debug('  matches = ', response.data);
                $scope.findByConceptIdResult = JSON.stringify(response.data, null, 2);
                // $scope.findByConceptIdCt = response.data.details.total;
            },
            // error
            function(response) {
                $scope.errorMsg = response;
            });
    }

    // Find by query with filter and set the scrollable raw json result
    $scope.findByQueryWithFilter = function(query, filter) {
        console.debug('findByQueryWithFilter', query, filter);

        // Make the HTTP Call
        $scope.findByQueryWithFilterUrl = baseUrl + '/browser/' + edition + '/' + version +
            '/descriptions?term=' + encodeURIComponent(query) +
            '&conceptActive=true&semanticTag=' + encodeURIComponent(filter) +
            '&groupByConcept=false&searchMode=STANDARD&offset=0&limit=50';

        $http.get($scope.findByQueryWithFilterUrl).then(
            // success
            function(response) {
                console.debug('  matches = ', response.data);
                $scope.findByQueryWithFilterResult = JSON.stringify(response.data, null, 2);
                $scope.findByQueryWithFilterCt = response.data.totalElements;
            },
            // error
            function(response) {
                $scope.errorMsg = response;
            });
    }

    // Find descendants of a concept by concept id and set the scrollable raw json result
    $scope.findDescendantsByConceptId = function(conceptId, limit) {
        console.debug('findDescendantsByConceptId, concept id: ' + conceptId + ', limit: ' + limit);

        $scope.findDescendantsByConceptIdUtility(conceptId, limit).then((response) => {
            var descendants = response.data.items;
            $scope.findDescendantsByConceptIdResult = JSON.stringify(descendants, null, 2);
            $scope.findDescendantsByConceptIdCt = response.data.total;
            var resultOnFHIR = $scope.convertDescendantsToFHIRFormat(descendants);
            $scope.findDescendantsOnFHIR = JSON.stringify(resultOnFHIR, null, 2);
            console.log("findDescendantsByConceptId Result on FHIR:", resultOnFHIR);
            $scope.$digest(); // force detect ui changes
        }).catch((error) => {
            console.log('Error: ', error);
            $scope.errorMsg = error.message
            $scope.$digest();
        });
    }

    // Find descendants of a concept by concept id and returns descendants in a Promise
    $scope.findDescendantsByConceptIdUtility = function(conceptId, limit) {
        return new Promise((resolve, reject) => {

            // Make the HTTP Call
            var url = baseUrl + '/' + edition + '/' + version + '/concepts/' + conceptId + '/descendants?stated=false&offset=0&limit=' + limit;
            $http.get(url).then(
                // success
                function(response) {
                    console.log('Resolved descendants:', response.data.total);
                    if (response.data.total > limit) {
                        response.data.parentConceptId = conceptId;
                        reject({
                            message: 'Limit exceeded',
                            data: response
                        });
                    } else {
                        resolve(response);
                    }
                },
                // error
                function(response) {
                    reject(response);
                });
        });
    }

    // Find descendants of a concept by concept id and set the scrollable raw json result (should be used for concepts with 10'000+ descendants)
    $scope.findLoadsOfDescendantsByConceptId = function(bigConceptId) {
        $scope.findLoadsOfDescendants(bigConceptId).then((result) => {
            $scope.findLoadsDescendantsOnFHIR = $scope.convertDescendantsToFHIRFormat(result);
            console.log("Final resul on FHIR (findLoadsOfDescendantsByConceptId):", $scope.findLoadsDescendantsOnFHIR);
            $scope.$digest(); // force detect ui changes
        }).catch((error) => {
            console.log('Error: ', error);
            $scope.errorMsg = JSON.stringify(error);
            $scope.$digest();
        });
    }

    // find loads of it
    $scope.findLoadsOfDescendants = function(bigConceptId) {
        return new Promise((resolve, reject) => {
            console.debug('findLoadsOfDescendantsByConceptId, concept id: ' + bigConceptId);

            var loadsOfDescendants = new Array();
            var descendantOfChildrenPromises = new Array();
            var limit = 10000; // max

            // 1 get children of concept
            var childrenURL = baseUrl + '/browser/' + edition + '/' + version + '/concepts/' + bigConceptId + '/children?form=inferred&includeDescendantCount=true';
            $http.get(childrenURL).then(
                // success
                function(response) {
                    var children = response.data;
                    
                    children.forEach(child => {
                        // 1.1 add children to result
                        loadsOfDescendants.push(child);

                        // 2 get descendants of each child
                        if (child.descendantCount > 0) {
                            descendantOfChildrenPromises.push($scope.findDescendantsByConceptIdUtility(child.id, limit));
                        }
                    });

                    if (children.length > 0) {
                        Promise.allSettled(descendantOfChildrenPromises).then((results) => {
                            console.log('We are done calling all descendants.');
                            results.forEach(result => {
                                if (result.status == 'fulfilled') {
                                    var newTotalResult= loadsOfDescendants.concat(result.value.data.items);
                                    loadsOfDescendants = newTotalResult;
                                } else {
                                    console.log("Failed result", result);
                                    const failedConceptId = result.reason.data.data.parentConceptId
                                    console.warn('Concept above limit, we add what we have: ', failedConceptId);
                                    var newTotalResult= loadsOfDescendants.concat(result.reason.data.data.items);
                                    loadsOfDescendants = newTotalResult;

                                    // console.log('Trying to resolve again');

                                    // var descendantOfChildrenPromises = new Array();
                                    // descendantOfChildrenPromises.push($scope.findLoadsOfDescendants(failedConceptId));
                                    // Promise.all(descendantOfChildrenPromises).then((results) => {
                                    //     results.forEach(result => {
                                    //         var moreDescendants= loadsOfDescendants.concat(result.reason.data.data.items);
                                    //         loadsOfDescendants = moreDescendants;
                                    //     });
                                    //     return resolve(loadsOfDescendants);
                                    // }).catch((error) => {
                                    //     console.error('Error:', error);
                                    //     reject(error);
                                    // });
                                }
                            });
                            return resolve(loadsOfDescendants);
                        });
                    }
                },
                // error
                function(response) {
                    $scope.errorMsg = response;
                });
        });
    }

    // Converts result of findDescendantsByConceptId() into FHIR format
    $scope.convertDescendantsToFHIRFormat = function(descendantsNotOnFhir) {
        var descendantsOnFHIR = new Array();
        descendantsNotOnFhir.forEach(descendant => {
            descendantsOnFHIR.push({
                system: 'http://snomed.info/sct',
                code: descendant.id,
                display: descendant.pt.term
            })
        });
        return descendantsOnFHIR;
    }

    // end
});
