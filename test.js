function Person(name$2) {
    this.name = name$2;
}
Person.prototype.say = function say(msg$4) {
    console.log(this.name + ' says: ' + msg$4);
};
var bob$6 = new Person('Bob');
bob$6.say('Macros are sweet!');
console.log('I think so!');
var alice$7 = new Person('Alice');
alice$7.say('Yes they are!');
 //@ sourceMappingURL=test.sourceMap