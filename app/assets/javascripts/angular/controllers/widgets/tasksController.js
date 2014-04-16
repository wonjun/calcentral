(function(angular) {
  'use strict';

  /**
   * Tasks controller
   */
  angular.module('calcentral.controllers').controller('TasksController', function(apiService, $filter, $http, $scope) {

    // Initial mode for Tasks view
    $scope.currentTaskMode = 'scheduled';
    $scope.taskModes = ['scheduled', 'unscheduled', 'completed'];

    var calculateCounts = function() {
      $scope.counts = {
        scheduled: $scope.overdueTasks.length + $scope.dueTodayTasks.length + $scope.futureTasks.length,
        unscheduled: $scope.unscheduledTasks.length
      };
      setCounts();
    };

    var setCounts = function() {
      var isScheduled = ($scope.currentTaskMode === 'scheduled');
      $scope.counts.current = isScheduled ? $scope.counts.scheduled : $scope.counts.unscheduled;
      $scope.counts.opposite = isScheduled ? $scope.counts.unscheduled : $scope.counts.scheduled;
    };

    $scope.updateTaskLists = function() {
      $scope.overdueTasks = $filter('orderBy')($scope.tasks.filter(filterOverdue), 'dueDate.epoch');
      $scope.dueTodayTasks = $filter('orderBy')($scope.tasks.filter(filterDueToday), 'dueDate.epoch');
      $scope.futureTasks = $filter('orderBy')($scope.tasks.filter(filterFuture), 'dueDate.epoch');
      $scope.unscheduledTasks = $filter('orderBy')($scope.tasks.filter(filterUnScheduled), 'updatedDate.epoch', true);
      $scope.completedTasks = $filter('orderBy')($scope.tasks.filter(filterCompleted), 'completedDate.epoch', true);
      calculateCounts();
    };


    $scope.getTasks = function() {
      return $http.get('/api/my/tasks').success(function(data) {
        apiService.updatedFeeds.feedLoaded(data);
        angular.extend($scope, data);
        if ($scope.tasks) {
          $scope.updateTaskLists();
        }
      });
    };

    $scope.$on('calcentral.api.updatedFeeds.updateServices', function(event, services) {
      if (services && services['MyTasks::Merged']) {
        $scope.getTasks();
      }
    });
    $scope.getTasks();

    var toggleStatus = function(task) {
      if (task.status === 'completed') {
        task.status = 'needsAction';
      } else {
        task.status = 'completed';
      }
    };

    /**
     * If completed, give task a completed date epoch *after* sending to
     * backend (and successful response) so model can reflect correct changes.
     * Otherwise, remove completedDate prop after backend response.
     */
    $scope.changeTaskState = function(task) {
      var changedTask = angular.copy(task);
      // Reset task back to original state.
      toggleStatus(task);

      // Disable checkbox while processing.
      task.editorIsProcessing = true;

      if (changedTask.status === 'completed') {
        changedTask.completedDate = {
          'epoch': (new Date()).getTime() / 1000
        };
      } else {
        delete changedTask.completedDate;
      }

      apiService.analytics.sendEvent('Tasks', 'Set completed', 'completed: ' + !!changedTask.completedDate);
      $http.post('/api/my/tasks', changedTask).success(function(data) {
        task.editorIsProcessing = false;
        angular.extend(task, data);
        $scope.updateTaskLists();
      }).error(function() {
        apiService.analytics.sendEvent('Error', 'Set completed failure', 'completed: ' + !!changedTask.completedDate);
        //Some error notification would be helpful.
      });
    };

    $scope.clearCompletedTasks = function() {
      apiService.analytics.sendEvent('Tasks', 'Clear completed tasks', 'Clear completed tasks');
      $http.post('/api/my/tasks/clear_completed', {
        emitter: 'Google'
      }).success(function(data) {
        if (data.tasksCleared) {
          $scope.getTasks();
        }
      }).error(function() {
        apiService.analytics.sendEvent('Error', 'Clear completed tasks failure', 'Clear completed tasks failure');
        //Some error notification would be helpful.
      });
    };

    // Switch mode for scheduled/unscheduled/completed tasks
    $scope.switchTasksMode = function(tasksMode) {
      apiService.analytics.sendEvent('Tasks', 'Switch mode', tasksMode);
      $scope.currentTaskMode = tasksMode;
      setCounts();
    };

    // Delete Google tasks
    $scope.deleteTask = function(task) {
      task.isDeleting = true;
      task.editorIsProcessing = true;

      // Payload for proxy
      var deltask = {
        'task_id': task.id,
        'emitter': 'Google'
      };

      $http.post('/api/my/tasks/delete/' + task.id, deltask).success(function() {

        // task.$index is duplicated between buckets, so need to iterate through ALL tasks
        for (var i = 0; i < $scope.tasks.length; i++) {
          if ($scope.tasks[i].id === task.id) {
            $scope.tasks.splice(i, 1);
            break;
          }
        }
        $scope.updateTaskLists();
        apiService.analytics.sendEvent('Tasks', 'Delete', task);
      }).error(function() {
        apiService.analytics.sendEvent('Error', 'Delete task failure');
        //Some error notification would be helpful.
      });

    };

    var filterOverdue = function(task) {
      return (task.status !== 'completed' && task.bucket === 'Overdue');
    };

    var filterDueToday = function(task) {
      return (task.status !== 'completed' && task.bucket === 'Today');
    };

    var filterFuture = function(task) {
      return (task.status !== 'completed' && task.bucket === 'Future');
    };

    var filterUnScheduled = function(task) {
      return (!task.dueDate && task.status !== 'completed');
    };

    var filterCompleted = function(task) {
      return (task.status === 'completed');
    };

    // Show more button implementation
    $scope.overdueLimit = 7;
    $scope.dueTodayLimit = 7;
    $scope.futureLimit = 7;
    $scope.showMoreIncrement = 5;

    // ng-click to show more elements
    var showMoreTasks = function(categoryLimit) {
      categoryLimit += $scope.showMoreIncrement;
    };

    $scope.showMoreTasksOverdue = showMoreTasks($scope.overdueLimit);
    $scope.showMoreTasksDueToday = showMoreTasks($scope.dueTodayLimit);
    $scope.showMoreTasksFuture = showMoreTasks($scope.futureLimit);

    // ng-show for only when more elements left to be shown
    var showMore = function(categoryLength, categoryLimit){
      return categoryLength > categoryLimit;
    };
    $scope.showMoreOverdue = showMore($scope.overdueTasks.length, $scope.overdueLimit);
    $scope.showMoreDueToday = showMore($scope.dueTodayTasks.length, $scope.dueTodayLimit);
    $scope.showMoreFuture = showMore($scope.futureTasks.length, $scope.futureLimit);

    /**
    * If there are < "showMoreIncrement" elements remaining,
    * it should show "Show X More" where X is the # of remaining
    * elements
    */
    var showMoreVariable = function(categoryLength, categoryLimit) {
      return Math.min($scope.showMoreIncrement, categoryLength - categoryLimit);
    };

    $scope.showMoreVariableOverdue = showMoreVariable($scope.overdueTasks.length, $scope.overdueLimit);
    $scope.showMoreVariableDueToday = showMoreVariable($scope.dueTodayTasks.length, $scope.dueTodayLimit);
    $scope.showMoreVariableFuture = showMoreVariable($scope.futureTasks.length, $scope.futureLimit);

  });

})(window.angular);
