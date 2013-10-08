define("appkit/adapters/application",
  [],
  function() {
    "use strict";
    var EIDBRecordAdapter = DS.Adapter.extend({
      find: function(store, type, id) {
        return this.request(type, 'getRecord', Number(id)).then(function(record) {
          if (record) {
            record.id = record[type.idAttr];
            return record;
          }

          throw 'Record not found';
        });
      },

      findQuery: function(store, type, query) {
        var self = this;

        return this.request(type, 'find', query).then(function(records) {
          return self.mapIds(type, records);
        });
      },

      createRecord: function(store, type, record) {
        var json = record.toJSON();

        return this.request(type, 'addRecord', json).then(function(id) {
          json.id = id;
          return json;
        });
      },

      updateRecord: function(store, type, record) {
        var json = record.toJSON(),
            key = record.id;

        return this.request(type, 'putRecord', json, Number(key)).then(function(id) {
          json.id = id;
          return json;
        });
      },

      deleteRecord: function(store, type, record) {
        var key = record.id;
        return this.request(type, 'deleteRecord', Number(key));
      },

      findAll: function(store, type) {
        var self = this;

        return this.request(type, 'getAll').then(function(records) {
          if (!records) { return []; }
          return self.mapIds(type, records);
        });
      },

      request: function(type, method) {
        var dbName = type.dbName,
            storeName = type.storeName || this.storeNameForType(type),
            idAttr = type.idAttr,
            reqArgs = [].slice.call(arguments, 2),
            fullArgs = [dbName, storeName].concat(reqArgs);

        return EIDB[method].apply(EIDB, fullArgs);
      },

      mapIds: function(type, records) {
        return records.map(function(record) {
          record.id = record[type.idAttr];
          return record;
        });
      },

      storeNameForType: function(type) {
        return Ember.String.pluralize(type.typeKey);
      }
    });


    return EIDBRecordAdapter;
  });
define("appkit/app",
  ["resolver","appkit/utils/register_components","appkit/views/edit_todo","appkit/utils/setup_eidb"],
  function(Resolver, registerComponents, editTodoView, setupEIDB) {
    "use strict";

    var App = Ember.Application.extend({
      LOG_ACTIVE_GENERATION: true,
      LOG_MODULE_RESOLVER: true,
      LOG_TRANSITIONS: true,
      LOG_TRANSITIONS_INTERNAL: true,
      LOG_VIEW_LOOKUPS: true,
      modulePrefix: 'appkit', // TODO: loaded via config
      Resolver: Resolver
    });

    App.initializer({
      name: 'Register Components',
      initialize: function(container, application) {
        registerComponents(container);
      }
    });

    App.initializer({
      name: 'Setup EasyIndexedDB',
      initialize: function(container, application) {
        setupEIDB();
      }
    });

    Ember.Handlebars.helper('edit-todo', editTodoView);


    return App;
  });
define("appkit/controllers/todo",
  [],
  function() {
    "use strict";
    // controllers/todo.js
    var TodoController = Ember.ObjectController.extend({
      isCompleted: function(key, value){
        var model = this.get('model');

        if (arguments.length === 2) {
          // property being used as a setter
          model.set('isCompleted', value);
          model.save();
          return value;
       } else {
          // property being used as a getter
          return model.get('isCompleted');
        }
      }.property('model.isCompleted'),

      isEditing: false,

      actions: {
        editTodo: function () {
          this.set('isEditing', true);
        },
        removeTodo: function () {
          var todo = this.get('model');
          todo.deleteRecord();
          todo.save();
        },
        acceptChanges: function () {
          this.set('isEditing', false);
          this.get('model').save();
        }
      }
    });


    return TodoController;
  });
define("appkit/controllers/todos",
  [],
  function() {
    "use strict";
    // controllers/todos.js

    var isEmpty  = Ember.isEmpty;
    var filterBy = Ember.computed.filterBy;
    var notEmpty = Ember.computed.notEmpty;

    var TodosController = Ember.ArrayController.extend({
      active:    filterBy('[]', 'isCompleted', false),
      completed: filterBy('[]', 'isCompleted', true),
      hasCompleted: notEmpty('completed.[]'),

      inflection: function () {
        var active = this.get('active.length');
        return active === 1 ? 'item' : 'items';
      }.property('active.[]'),

      allAreDone: function (key, value) {
        if (arguments.length === 2) {
          this.setEach('isCompleted', value);
          this.invoke('save');
          return value;
        } else {
          return !isEmpty(this) && this.everyProperty('isCompleted', true);
        }
      }.property('@each.isCompleted'),

      actions: {
        createTodo: function () {
          // Get the todo title set by the "New Todo" text field
          var title = this.get('newTitle');
          if (!title.trim()) { 
            this.set('newTitle', ""); 
            return; 
          }

          // Create the new Todo model
          var todo = this.store.createRecord('todo', {
            title: title,
            isCompleted: false
          });

          // Clear the "New Todo" text field
          this.set('newTitle', '');

          // Save the new model
          todo.save();
        },
        clearCompleted: function () {
          var completed = this.filterProperty('isCompleted', true);
          completed.invoke('deleteRecord');
          completed.invoke('save');
        }
      }
    });


    return TodosController;
  });
define("appkit/models/todo",
  [],
  function() {
    "use strict";
    // models/todo.js
    var Todo = DS.Model.extend({
      title: DS.attr('string'),
      isCompleted: DS.attr('boolean')
    });

    Todo.reopenClass({
      dbName: 'EAK_Todos',
      storeName: 'todos',
      idAttr: '_key'
    });


    return Todo;
  });
define("appkit/router",
  [],
  function() {
    "use strict";
    var Router = Ember.Router.extend(); // ensure we don't share routes between all Router instances

    Router.map(function(){
      this.resource('todos', { path: '/' }, function() {
        // additional child routes
        this.route('active');
        this.route('completed');
      });
    });


    return Router;
  });
define("appkit/routes/todos",
  [],
  function() {
    "use strict";
    // routes/todos.js
    var TodosRoute = Ember.Route.extend({
      model: function() {
        return this.store.find('todo');
      }
    });


    return TodosRoute;
  });
define("appkit/routes/todos/active",
  [],
  function() {
    "use strict";
    // routes/todos/active.js
    var TodosActiveRoute = Ember.Route.extend({
      model: function(){
        return this.store.filter('todo', function (todo) {
          return !todo.get('isCompleted');
        });
      },
      renderTemplate: function(controller){
        this.render('todos/index', {controller: controller});
      }
    });


    return TodosActiveRoute;
  });
define("appkit/routes/todos/completed",
  [],
  function() {
    "use strict";
    // routes/todos/completed.js

    var TodosCompletedRoute = Ember.Route.extend({
      model: function(){
        return this.store.filter('todo', function (todo) {
          return todo.get('isCompleted');
        });
      },
      renderTemplate: function(controller){
        this.render('todos/index', { controller: controller });
      }
    });


    return TodosCompletedRoute;
  });
define("appkit/routes/todos/index",
  [],
  function() {
    "use strict";
    // routes/todos/index.js
    var TodosIndexRoute = Ember.Route.extend({
      model: function() {
        return this.modelFor('todos');
      }
    });


    return TodosIndexRoute;
  });
define("appkit/utils/register_components",
  [],
  function() {
    "use strict";
    /* global requirejs */
    /* global require */

    function registerComponents(container) {
      var seen = requirejs._eak_seen;
      var templates = seen, match;
      if (!templates) { return; }

      for (var prop in templates) {
        if (match = prop.match(/templates\/components\/(.*)$/)) {
          require(prop, null, null, true);
          registerComponent(container, match[1]);
        }
      }
    }


    function registerComponent(container, name) {
      Ember.assert("You provided a template named 'components/" + name + "', but custom components must include a '-'", name.match(/-/));

      var fullName         = 'component:' + name,
          templateFullName = 'template:components/' + name;

      container.injection(fullName, 'layout', templateFullName);

      var Component = container.lookupFactory(fullName);

      if (!Component) {
        container.register(fullName, Ember.Component);
        Component = container.lookupFactory(fullName);
      }

      Ember.Handlebars.helper(name, Component);
    }


    return registerComponents;
  });
define("appkit/utils/setup_eidb",
  [],
  function() {
    "use strict";
    var dbName = 'EAK_Todos',
        storeName = 'todos';

    function setupEIDB() {
      EIDB.open(dbName).then(function(db) {
        if (!db.hasObjectStore(storeName)) {
          EIDB.createObjectStore(dbName, storeName).then(function() {

            // The following is a workaround for bug when using IndexedDBShim in Safari
            // (first record, that has id of 0, can't be updated)
            return EIDB.addRecord(dbName, storeName, {});
          }).then(function(id) {
            EIDB.deleteRecord(dbName, storeName, id);
          });
        }
      });
    }


    return setupEIDB;
  });
define("appkit/views/edit_todo",
  [],
  function() {
    "use strict";
    // views/edit_todo.js
    var EditTodoView = Ember.TextField.extend({
      didInsertElement: function() {
        this.$().focus();
      }
    });

    return EditTodoView;
  });
//@ sourceMappingURL=app.js.map