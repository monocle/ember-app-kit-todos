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

export default Todo;
