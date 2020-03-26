let Transaction = class Transaction {
  constructor(row, date, name, amount) {
    this.rowNumber = row;
    
    const dateArray = date.split('/');
    this.dateObj = typeof date === 'Date' ? date : new Date(dateArray[2], dateArray[0] - 1, dateArray[1]);
    this.date = Utilities.formatDate(this.dateObj, "GMT", "MM/dd/yyyy");
    this.name = name;
    this.amount = amount;
    this.payer = 'Brandon';
    this.splitType = 'Even';
    this.brandonPaysFormula = this.constructPaysFormula('Brandon');
    this.ashlynnPaysFormula = this.constructPaysFormula('Ashlynn');
    this.isDone = 'FALSE';
  }
  
  get row() {
    return [this.date, this.name, this.amount, this.payer, this.splitType, this.brandonPaysFormula, this.ashlynnPaysFormula, this.isDone];
  }
  
  constructPaysFormula(name) {
    return `=MAX(SUM(IF($E${this.rowNumber}="Even", $C${this.rowNumber} / 2, 0), IF($E${this.rowNumber}="${name}", $C${this.rowNumber}, 0), IF($E${this.rowNumber}="Income", $C${this.rowNumber} * Summary!$E$2, 0)) - IF($D${this.rowNumber}="${name}", $C${this.rowNumber}, 0), 0)`;
  }
};