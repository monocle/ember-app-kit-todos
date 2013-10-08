import Resolver from 'resolver';
import registerComponents from 'appkit/utils/register_components';
import editTodoView from 'appkit/views/edit_todo';
import setupEIDB from 'appkit/utils/setup_eidb';

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

export default App;
