//Comment 3
//Another comment
//Comment 0
function Person(name$2) {
    //Some comment
    this.name = name$2;
}
Person.prototype.say = function say(msg$4) {
    console.log(this.name + ' says: ' + msg$4);
};
//Comment 1
//Comment 2
var uselessVar$6 = 'yeaaaa';
var bob$7 = new Person('Bob');
bob$7.say('Macros are sweet!');
console.log('Test log');
/*Comment 98*/
/*Comment 98.5*/
console.log('Console logged 0');
console.log('no semicolon');
console.log('Console logged');
console.log('Console logged 1');
var alice$8 = new Person('Alice');
alice$8.say('Yes they are!');
console.log('Console logged 2!');
var abc$9 = 875;
 //@ sourceMappingURL=test.sm