// ! This is a helper function to delegate events from an element to any child with a specified selector.
// ? Use where required.

function delegateEvent(fromElement, eventName, targetSelector, callback) {
  fromElement.addEventListener(eventName, event => {
    let targetsList = [...event.currentTarget.querySelectorAll(targetSelector)];

    if (targetsList.includes(event.target)) {
      callback(event);
    }
  });
}

/*global jQuery, Handlebars, Router */
jQuery(function() {
  'use strict';

  Handlebars.registerHelper('eq', function(a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  var ENTER_KEY = 13;
  var ESCAPE_KEY = 27;

  var util = {
    uuid: function() {
      /*jshint bitwise:false */
      var i, random;
      var uuid = '';

      for (i = 0; i < 32; i++) {
        random = (Math.random() * 16) | 0;
        if (i === 8 || i === 12 || i === 16 || i === 20) {
          uuid += '-';
        }
        uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(
          16
        );
      }

      return uuid;
    },
    pluralize: function(count, word) {
      return count === 1 ? word : word + 's';
    },
    store: function(namespace, data) {
      if (arguments.length > 1) {
        return localStorage.setItem(namespace, JSON.stringify(data));
      } else {
        var store = localStorage.getItem(namespace);
        return (store && JSON.parse(store)) || [];
      }
    }
  };

  var App = {
    init: function() {
      this.todos = util.store('todos-jquery');
      this.todoTemplate = Handlebars.compile($('#todo-template').html());
      this.footerTemplate = Handlebars.compile($('#footer-template').html());
      this.bindEvents();

      new Router({
        '/:filter': function(filter) {
          this.filter = filter;
          this.render();
        }.bind(this)
      }).init('/all');
    },
    bindEvents: function() {
      document.querySelector(".new-todo").addEventListener("keyup", this.create.bind(this))
      //$('.new-todo').on('keyup', this.create.bind(this));

      document.querySelector(".toggle-all").addEventListener("change",this.toggleAll.bind(this))
      //$('.toggle-all').on('change', this.toggleAll.bind(this));
      
      var footer = document.querySelector(".footer")
      delegateEvent(footer, "click", ".clear-completed", this.destroyCompleted.bind(this))
      //$('.footer').on('click','.clear-completed',this.destroyCompleted.bind(this));


      var toDoList = document.querySelector(".todo-list")
      delegateEvent(toDoList, "change", ".toggle", this.toggle.bind(this))
      delegateEvent(toDoList, "dblclick", "label", this.editingMode.bind(this))
      delegateEvent(toDoList, "keyup", ".edit", this.editKeyup.bind(this))
      delegateEvent(toDoList, "focusout", ".edit", this.update.bind(this))
      delegateEvent(toDoList, "click", ".destroy", this.destroy.bind(this))

      
      //$('.todo-list')
        //.on('change', '.toggle', this.toggle.bind(this))
        //.on('dblclick', 'label', this.editingMode.bind(this))
        //.on('keyup', '.edit', this.editKeyup.bind(this))
        //.on('focusout', '.edit', this.update.bind(this))
        //.on('click', '.destroy', this.destroy.bind(this));
    },
    
    render: function() {
      var todos = this.getFilteredTodos();

      var todoLIst = document.querySelector(".todo-list")
      todoLIst.innerHTML = this.todoTemplate(todos)
      //$('.todo-list').html(this.todoTemplate(todos));

      var main = document.querySelector(".main")

        if (todos.length > 0){
          main.style.display = "block"
        } else {
          main.style.display = "none"
        }
      //$('.main').toggle(todos.length > 0);

      var toggleAll = document.querySelector(".toggle-all")

      toggleAll.checked = this.getActiveTodos().length === 0 
      //$('.toggle-all').prop('checked', this.getActiveTodos().length === 0);
      
      this.renderFooter();


      //$('.new-todo').focus();
      util.store('todos-jquery', this.todos);
    },
    renderFooter: function() {
      var todoCount = this.todos.length;
      var activeTodoCount = this.getActiveTodos().length;
      var template = this.footerTemplate({
        activeTodoCount: activeTodoCount,
        activeTodoWord: util.pluralize(activeTodoCount, 'item'),
        completedTodos: todoCount - activeTodoCount,
        filter: this.filter
      });

      var footer = document.querySelector(".footer")
      if(todoCount > 0){
        footer.style.display = "block"
      } else {
        footer.style.display = "none"
      }

     footer.innerHTML = template

    //$('.footer')  
                //.toggle(todoCount > 0)
                //.html(template);
},
    toggleAll: function(e) {
      
      var isChecked = e.target.checked
      //var isChecked = $(e.target).prop('checked');

      this.todos.forEach(function(todo) {
        todo.completed = isChecked;
      });

      this.render();
    },
    getActiveTodos: function() {
      return this.todos.filter(function(todo) {
        return !todo.completed;
      });
    },
    getCompletedTodos: function() {
      return this.todos.filter(function(todo) {
        return todo.completed;
      });
    },
    getFilteredTodos: function() {
      if (this.filter === 'active') {
        return this.getActiveTodos();
      }

      if (this.filter === 'completed') {
        return this.getCompletedTodos();
      }

      return this.todos;
    },
    destroyCompleted: function() {
      this.todos = this.getActiveTodos();
      this.render();
    },
    // accepts an element from inside the `.item` div and
    // returns the corresponding index in the `todos` array
    getIndexFromEl: function(el) {
     
     var id = el.closest("li")
     id.closest("li")
     id = id.getAttribute("data-id")
     
      //var id = $(el)
        //.closest('li')
        //.data('id');
      var todos = this.todos;
      var i = todos.length;

      while (i--) {
        if (todos[i].id === id) {
          return i;
        }
      }
    },
    create: function(e) {

      var $input = e.target
      //var $input = $(e.target);

      var val = $input.value.trim()
     // var val = $input.val().trim();

      if (e.which !== ENTER_KEY || !val) {
        return;
      }

      this.todos.push({
        id: util.uuid(),
        title: val,
        completed: false
      });

      $input.value = '';

      this.render();
    },
    toggle: function(e) {
      var i = this.getIndexFromEl(e.target);
      this.todos[i].completed = !this.todos[i].completed;
      this.render();
    },
    editingMode: function(e) {
      var $input = e.target
      //var $input = $(e.target)
      console.log($input.closest("li").querySelector(".edit"))
      
      var liNew = $input.closest("li")
      liNew.classList.add("editing")
      $input = liNew.querySelector(".edit")
      
      
      

        //.closest('li')
        //.addClass('editing')
        //.find('.edit');

        
      // puts caret at end of input
      var tmpStr = $input.value
      $input.value = ""
      $input.value = tmpStr

      //var tmpStr = $input.val();
      //$input.val('');
      //$input.val(tmpStr);
      //$input.focus();
    },
    editKeyup: function(e) {

      if (e.which === ENTER_KEY) {
        e.target.blur();
      }

      if (e.which === ESCAPE_KEY) {
        e.target.data = {abort: true}
        e.target.blur()
        
        //$(e.target)
          //.data('abort', true)
          //.blur();
      }
    },
    update: function(e) {
      var el = e.target;
      var $el = el
      var val = $el.value.trim();
      console.log($el.data)

      if ($el.data && $el.data.abort) {
        $el.data = {abort:false}
      } else if (!val) {
        this.destroy(e);
        return;
      } else {
        this.todos[this.getIndexFromEl(el)].title = val;
      }

      this.render();
    },
    destroy: function(e) {
      this.todos.splice(this.getIndexFromEl(e.target), 1);
      this.render();
    }
  };

  App.init();
});
