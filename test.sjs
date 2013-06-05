//Comment 3
macro class {
  case $className:ident {
    constructor $constParam $constBody
    $($methodName:ident $methodParam $methodBody) ... } => {

    function $className $constParam $constBody
//Another comment
    $($className.prototype.$methodName
      = function $methodName $methodParam $methodBody; ) ...

  }
}
//Comment 0
class Person {
//Some comment
  constructor(name) {
    this.name = name;
  }
  
  say(msg) {
    console.log(this.name + " says: " + msg);

  }
}
//Comment 1
//Comment 2
var uselessVar = "yeaaaa"
var bob = new Person("Bob");
bob.say("Macros are sweet!"); 
console.log("Test log");
/*Comment 98*/ /*Comment 98.5*/ console.log("Console logged 0");


console.log("no semicolon")
console.log("Console logged");

console.log("Console logged 1");
var alice = new Person("Alice");
alice.say("Yes they are!");

console.log("Console logged 2!");

var abc = 875;