//First comment
macro class {
  case $className:ident {
    constructor $constParam $constBody
    $($methodName:ident $methodParam $methodBody) ... } => {

    function $className $constParam $constBody

    $($className.prototype.$methodName
      = function $methodName $methodParam $methodBody; ) ...

  }
}
//Comment here

class Person {
    constructor(name) {
    this.name = name;
  }

  say(msg) {
    console.log(this.name + " says: " + msg);
  }
}
var bob = new Person("Bob");
bob.say("Macros are sweet!");
		
//Foo
console.log("I think so!");

var alice = new Person("Alice");
alice.say("Yes they are!");