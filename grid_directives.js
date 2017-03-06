//   <grid-screen resource="/api/data.json">
//     <grid-columns>
//       <grid-column title="Product"     field="product"></grid-column>
//       <grid-column title="Description" field="description"></grid-column>
//       <grid-column title="Cost"        field="cost"></grid-column>
//     </grid-columns>
//     <grid with-inline-editor></grid>
//   </grid-screen>

// 3 domain objects: editor, edit, columns, rows

angular.module("app").directive("gridScreen", function($http) {
  return {
    restrict: 'E',
    controller: function($scope) {
      // columns, editor
      this.setEditor = function(editor) {
        $scope.cols.unshift(editor);
      };
      this.useEditor = function(useEditor) {
        $scope.useEditor = useEditor;
      }
      this.setColumns = function(cols) {
        $scope.cols = cols;
      };
    },
    link: function(scope, element, attributes) {
      $http.get(attributes.resource).success(function(response) {
        scope.rows = response.data;
        scope.$broadcast('ready-to-render', scope.rows, scope.cols, scope.useEditor);
      });
    }
  };
});
angular.module("app").directive("gridColumns", function() {
  return {
    restrict: 'E',
    require: ['^gridScreen', 'gridColumns'],
    controller: function() {
      var columns = [];
      this.addColumn = function(col) {
        columns.push(col);
      };
      this.getColumns = function() {
        return columns;
      };
    },
    link: function(scope, element, attributes, controllers) {
      var gridScreenController  = controllers[0];
      var gridColumnsController = controllers[1];
      gridScreenController.setColumns(gridColumnsController.getColumns());
      console.log('linked gridColumns');
    }
  };
});
angular.module("app").directive("gridColumn", function() {
  return {
    restrict: 'E',
    require: '^gridColumns',
    link: function(scope, element, attributes, gridColumnsController) {
      gridColumnsController.addColumn({
        title: attributes.title,
        field: attributes.field
      });
      console.log('linked gridColumn', attributes.title);
    }
  };
});
angular.module("app").service("gridDataMapper", function() {
  return {
    toJSGridFields: function(cols, useEditor) {
      var fields = cols.map(function(col) {
        return {
          name: col.field,
          type: 'text'
        };
      });
      if(useEditor) {
        fields.unshift({ name: 'edit', type: 'control' });
      }
      return fields;
    }
  }
});
angular.module("app").directive("grid", function(gridDataMapper) {
  return {
    restrict: 'E',
    templateUrl: "/templates/as_js_grid.html",
    replace: true,
    link: function(scope, element, attributes) {
      scope.$on('ready-to-render', function(e, rows, cols, useEditor) {
        $(element).jsGrid({
          width: "100%",
          editing: useEditor,
          data: rows,
          fields: gridDataMapper.toJSGridFields(cols, useEditor)
        });
      });
    }
  };
});
angular.module("app").directive("withInlineEditor", function() {
  return {
    restrict: 'A',
    require: '^gridScreen',
    link: function(scope, element, attributes, gridScreenController) {
      gridScreenController.useEditor(true);
      console.log('linked withInlineEditor');
    }
  };
});
angular.module("app").directive("editorInitializer", function($compile, $templateCache) {
  return {
    restrict: 'E',
    templateUrl: '/templates/editor_initializer.html',
    controller: function($scope) {
      $scope.editing = false;
      $scope.edit = function(row) {
        $scope.$broadcast('edit', row);
      };
    },
    link: function(scope, element, attributes) {
      scope.$on('edit', function(e, row) {
        scope.editing = !scope.editing;
        $(element.parents("tr")).toggleClass("editing", scope.editing);
        if(scope.editing) {
          scope.editor = scope.editor || $compile($templateCache.get("/templates/editor.html"))(scope);
          $(scope.editor).insertAfter(element.parents("tr"));
        } else {
          $(scope.editor).remove();
        }
      });
      console.log('linked editorInitializer');
    }
  };
});
