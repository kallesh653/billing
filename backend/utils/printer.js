const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

const printBill = async (billData, settings) => {
  try {
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `printer:${settings.printerName || 'ThermalPrinter'}`,
      characterSet: 'SLOVENIA',
      removeSpecialCharacters: false,
      lineCharacter: '=',
      width: settings.paperWidth || 48
    });

    // Header
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(settings.shopName || 'Juicy');
    printer.bold(false);
    printer.setTextNormal();
    printer.println(settings.shopAddress || '');
    printer.println(`Mobile: ${settings.shopMobile || ''}`);
    if (settings.gstNumber) {
      printer.println(`GST: ${settings.gstNumber}`);
    }
    printer.drawLine();

    // Bill details
    printer.alignLeft();
    printer.println(`Bill No: ${billData.billNo}`.padEnd(24) + `Date: ${new Date(billData.billDate).toLocaleDateString()}`);
    printer.println(`Time: ${new Date(billData.billDate).toLocaleTimeString()}`.padEnd(24) + `User: ${billData.userName}`);

    if (billData.customerName) {
      printer.println(`Customer: ${billData.customerName}`);
    }
    if (billData.customerMobile) {
      printer.println(`Mobile: ${billData.customerMobile}`);
    }

    printer.drawLine();

    // Items header
    printer.println('Item'.padEnd(22) + 'Qty'.padEnd(6) + 'Rate'.padEnd(10) + 'Total');
    printer.drawLine();

    // Items
    billData.items.forEach(item => {
      const itemName = item.itemName.substring(0, 22).padEnd(22);
      const qty = item.quantity.toString().padEnd(6);
      const rate = item.price.toFixed(2).padEnd(10);
      const total = item.itemTotal.toFixed(2);
      printer.println(itemName + qty + rate + total);
    });

    printer.drawLine();

    // Totals
    printer.alignRight();
    printer.println(`Subtotal: ${billData.subtotal.toFixed(2)}`);

    if (billData.discountAmount > 0) {
      printer.println(`Discount: -${billData.discountAmount.toFixed(2)}`);
    }

    if (billData.gstAmount > 0) {
      printer.println(`GST: ${billData.gstAmount.toFixed(2)}`);
    }

    printer.drawLine();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(`TOTAL: ${billData.grandTotal.toFixed(2)}`);
    printer.setTextNormal();
    printer.bold(false);

    printer.drawLine();

    // Payment details
    printer.alignCenter();
    printer.println(`Payment Mode: ${billData.paymentMode}`);

    if (billData.paymentMode === 'Mixed') {
      if (billData.paymentDetails.cash > 0) printer.println(`Cash: ${billData.paymentDetails.cash.toFixed(2)}`);
      if (billData.paymentDetails.upi > 0) printer.println(`UPI: ${billData.paymentDetails.upi.toFixed(2)}`);
      if (billData.paymentDetails.card > 0) printer.println(`Card: ${billData.paymentDetails.card.toFixed(2)}`);
    }

    printer.drawLine();

    // Footer
    printer.println(settings.footerText || 'Thank You! Visit Again');
    printer.drawLine();

    printer.cut();

    await printer.execute();
    console.log('✅ Bill printed successfully');

    return { success: true, message: 'Bill printed successfully' };
  } catch (error) {
    console.error('❌ Print error:', error);
    return { success: false, message: error.message };
  }
};

module.exports = { printBill };
