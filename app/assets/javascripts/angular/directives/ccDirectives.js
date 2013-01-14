(function() {
  /*global calcentral*/
  'use strict';

  // Date regex for mm/dd/yy modified from http://www.regular-expressions.info/dates.html
  var CC_DUE_DATE_REGEX = /^(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.]\d\d$/;
  calcentral.directive('mmddyyvalidator', function() {
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function(viewValue) {
          if (CC_DUE_DATE_REGEX.test(viewValue) || viewValue === '') {
            // Regex is valid
            ctrl.$setValidity('mmddyyvalidator', true);
            return viewValue;
          } else {
            // Regex invalid, return undefined (no model update)
            ctrl.$setValidity('mmddyyvalidator', false);
            return undefined;
          }
        });
      }
    };
  });

})();