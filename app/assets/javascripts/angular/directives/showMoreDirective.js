(function(angular) {
  'use strict';

  angular.module('calcentral.directives').directive('ccShowMoreDirective',  function($filter, $sanitize) {

    /**
     * Increment List
     * @param {Array} fullList The list you want to show
     * @param {Int} currentLength The amount of list showing
     * @param {Int} increment How much more to show
     * @return {Array} Incremented List
     */
    var incrementList = function(fullList, currentLength, increment) {
      if ((fullList.length - currentLength) <= increment) {
        // Convert to a string
        return fullList;
      } else {
        return fullList.slice(0,currentLength+increment);
      }
    };
    /**
     * Check whether we should show the Showmore Button
     * @param {Int} fullLength Length of entire feed
     * @param {Int} currentLength Length of current feed showing
     * @return {Boolean} Whether we should show the button
     */

    var needShowMore = function(fullLength, currentLength) {
      return fullLength < currentLength;
    };

    /**
     * Construct the button template
     * @param {Int} fullLength Length of entire feed
     * @param {Int} currentLength Length of current feed showing
     * @param {Int} increment How much more to show
     * @return {String} The parsed template for the button
     *
     * We want to take the min between the increment value
     * and what is left to be shown
     */
    var buttonTemplate = function(fullLength, currentLength, increment) {
      var num = Math.min(fullLength - currentLength, increment);
      return '<div><button class="cc-button cc-widget-show-more">Show ' + num + ' More</button></div>';
    };

    /**
     * Main update function
     * @param {Object} scope The scope of the current element
     * @param {Object} element Element were it is bound to
     * @param {Object} options The options that were being passed through
     *
     * It will automatically add 7 items or less in the beginning.
     */
    var update = function(scope, element, options) {

      // Set the default options
      var defaultOptions = {
        initialListLimit: 7,
        increment: 7
      };

      var currentLength = options.currentLength;
      var fullLength = scope.fullList.length;
      var needMore = needShowMore(fullLength, currentLength);
      var array = options.array;

      // Do nothing when there is no more to Show
      if (!needMore) {
        return;
      // Else add more to the list
      } else {
        scope.fullList = incrementList(scope.fullList, currentLength, defaultOptions.increment);
      }


      currentLength = array.length;
      needMore = needShowMore(fullLength,currentLength);

      if (needMore) {
        scope.fullList += buttonTemplate(fullLength,currentLength,defaultOptions.increment);
      }

      // Set the variables for the recursion
      options.currentLength = currentLength;
      options.array = array;


/* NEEDS WORK Below

      // Set click handlers
      if (needMore) {
        var children = element.children();
        var button = angular.element(children[children.length - 1].children[0]);
        button.bind('click', function(event) {
          event.stopPropagation();
          update(scope, element, options);
        });
      }

    };

    return {
      replace: true,
      link: function(scope, element, attr) {

        // Do the same as regular AngularJS html binding
        element
          .addClass('ng-binding')
          .data('$binding', attr.ngBindHtml);

        // Options being passed to the showMore directive
        // Will result in a JSON object
        var options = {
          array: [],
          currentLength: 0
        };

        // Watch for changes on the thing it is bound to
        scope.$watch(attr.ngBindHtml, function(array) {
          scope.fullList = array;
          //Set the opened variable - default to false
          update(scope, element, options);
        });
      }
    };
  });

})(window.angular);

*/
