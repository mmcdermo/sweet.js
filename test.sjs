macro class {
  case $className:ident {
    constructor $constParam $constBody
    $($methodName:ident $methodParam $methodBody) ... } => {

    function $className $constParam $constBody

    $($className.prototype.$methodName
      = function $methodName $methodParam $methodBody; ) ...
  }
}
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
console.log("semi-less");

if (bob) {
   console.log("thingy");
   console.log("second one");
   console.log("duuuuuuuuuuude");
}  


console.log("Indeed2!");
console.log("Indeed3!");
console.log("Indeed4!");