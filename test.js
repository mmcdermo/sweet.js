function Person(name$2) {
    this.name = name$2;
}
Person.prototype.say = function say(msg$4) {
    //Macroo comment
    console.log(this.name + ' says: ' + msg$4);
};
var bob$6 = new Person('Bob');
/* Test */
bob$6.say('Macros are sweet!');
//Foo
console.log('I think so!');
//Bar
var alice$7 = new Person('Alice');
/* BAm */
alice$7.say('Yes they are!');
 //@ sourceMappingURL=test.sm