const importFilename = 'brandon_transactions.csv'
const transactionSheetName = 'Transactions'
const paymentLineRegex = /^([1-9]|0[1-9]|1[012])[- \/.]([1-9]|0[1-9]|[12][0-9]|3[01])[- \/.](\d{4}) \w+ - \$\d+\.\d{2} to ([A-Z][a-zA-Z]+)$/

function onOpen() {
  // Add a menu with some items, some separators, and a sub-menu.
  SpreadsheetApp.getUi().createMenu('Utilities')
      .addItem('Import Transaction CSV', 'importFinances')
      .addItem('Finalize New Transactions', 'finalizeTransactions')
      .addToUi();
}

function finalizeTransactions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(transactionSheetName);
  const lastPaymentInfo = getLastPayment(sheet);
  const newTransactionRange = sheet.getRange(lastPaymentInfo.index + 1, 1, sheet.getLastRow() - lastPaymentInfo.index, 8);
  newTransactionRange.sort(1).shiftRowGroupDepth(1);
  sheet.getRange(newTransactionRange.getRow(), newTransactionRange.getLastColumn(), newTransactionRange.getHeight()).setValue(true);
  
  addTotalString(lastPaymentInfo, sheet);
}

function addTotalString(lastPaymentInfo, sheet) {
  const brandonPays = sum(sheet.getRange(lastPaymentInfo.index + 1, 6, sheet.getLastRow() - lastPaymentInfo.index).getValues().map(value => parseFloat(value)));
  const ashlynnPays = sum(sheet.getRange(lastPaymentInfo.index + 1, 7, sheet.getLastRow() - lastPaymentInfo.index).getValues().map(value => parseFloat(value)));
  
  const today = Utilities.formatDate(new Date(), "GMT-7", "MM/dd/yyyy");
  const payment = Math.abs(brandonPays - ashlynnPays).toFixed(2);
  const payee = brandonPays < ashlynnPays ? 'Brandon' : 'Ashlynn';
  const total_string = `${today} VENMO - $${payment} to ${payee}`;
  
  sheet.appendRow([total_string]);
  sheet.getRange(sheet.getLastRow(), 1, 1, 8).mergeAcross()
                                             .setFontWeight('Bold')
                                             .setFontStyle('italic')
                                             .setHorizontalAlignment("center")
                                             .setBorder(false, null, true, null, null, null, null, SpreadsheetApp.BorderStyle.SOLID_THICK);
}

function importFinances() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(transactionSheetName);
  const newTransactionRange = addTransactions(sheet);
  addCheckboxes(sheet, newTransactionRange);
}

function addTransactions(sheet) {
  const csvData = importCSVFromGoogleDrive(importFilename);
  const rowStart = sheet.getLastRow();
  let transactions = csvData.map((transaction,index) => new Transaction(rowStart + index + 1, transaction[0], transaction[2], -transaction[4]));
  const lastPaymentDateMatch = paymentLineRegex.exec(getLastPayment(sheet).value);
  const lastPaymentDate = new Date(parseInt(lastPaymentDateMatch[3]), parseInt(lastPaymentDateMatch[1]) - 1, parseInt(lastPaymentDateMatch[2]));
  transactions = transactions.filter(transaction => transaction.amount > 0); // Remove payments, keep only debits
  transactions = transactions.filter(transaction => transaction.dateObj >= lastPaymentDate);
  transactions.map(transaction => sheet.appendRow(transaction.row));
    
  return {'start': rowStart, 'end': sheet.getLastRow()};
}

function addCheckboxes(sheet, transactionRange) {
  sheet.getRange(transactionRange.start, 8, transactionRange.end - transactionRange.start + 1).insertCheckboxes();
}

function sum(nums) {
  return nums.reduce((a, b) => a + b, 0);
}

function importCSVFromGoogleDrive(filename) {
  let file = DriveApp.getFilesByName(filename).next();
  let csvData = Utilities.parseCsv(file.getBlob().getDataAsString()).slice(1); // Skip header
  return csvData
}

function getLastPayment(sheet) {
  const sheetData = sheet.getDataRange().getValues();
  const paymentData = sheetData.filter(row => paymentLineRegex.test(row[0].toString()));
  const lastPayment = paymentData[paymentData.length - 1];
  return {'index': sheetData.indexOf(lastPayment) + 1, 'value': lastPayment[0]};
}
