function Person(name$2$1) {
    this.name = name$2$1;
}
Person.prototype.say = function say(msg$4$3) {
    console.log(this.name + ' says: ' + msg$4$3);
};
var uselessVar$6$5 = 'yeaaaa';
var bob$7$6 = new Person('Bob');
bob$7$6.say('Macros are sweet!');
console.log('Test log');
console.log('Console logged 0');
console.log('no semicolon');
console.log('Console logged');
console.log('Console logged 1');
var alice$8$7 = new Person('Alice');
alice$8$7.say('Yes they are!');
console.log('Console logged 2!');
var abc$9$8 = 875;