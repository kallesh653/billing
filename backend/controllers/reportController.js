const Bill = require('../models/Bill');
const Purchase = require('../models/Purchase');
const SubCode = require('../models/SubCode');
const StockLedger = require('../models/StockLedger');
const Supplier = require('../models/Supplier');
const moment = require('moment');

// @desc    Sales Report
// @route   GET /api/reports/sales
// @access  Private
exports.salesReport = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const filter = { status: 'Completed' };
    if (startDate) filter.billDate = { $gte: new Date(startDate) };
    if (endDate) filter.billDate = { ...filter.billDate, $lte: new Date(endDate) };
    if (userId) filter.userId = userId;

    const bills = await Bill.find(filter).populate('userId', 'name').sort({ billDate: -1 });
    const totalSales = bills.reduce((sum, b) => sum + b.grandTotal, 0);

    res.json({ success: true, count: bills.length, totalSales, bills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Item-wise Sales Report
// @route   GET /api/reports/itemwise-sales
// @access  Private
exports.itemwiseSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: 'Completed' };
    if (startDate) filter.billDate = { $gte: new Date(startDate) };
    if (endDate) filter.billDate = { ...filter.billDate, $lte: new Date(endDate) };

    const bills = await Bill.find(filter);

    const itemSales = {};
    bills.forEach(bill => {
      bill.items.forEach(item => {
        const key = item.subCode.toString();
        if (!itemSales[key]) {
          itemSales[key] = {
            itemName: item.itemName,
            subCodeName: item.subCodeName,
            quantity: 0,
            totalAmount: 0,
            profit: 0
          };
        }
        itemSales[key].quantity += item.quantity;
        itemSales[key].totalAmount += item.itemTotal;
        itemSales[key].profit += (item.price - item.costPrice) * item.quantity;
      });
    });

    const report = Object.values(itemSales);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    User-wise Sales Report
// @route   GET /api/reports/userwise-sales
// @access  Private/Admin
exports.userwiseSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: 'Completed' };
    if (startDate) filter.billDate = { $gte: new Date(startDate) };
    if (endDate) filter.billDate = { ...filter.billDate, $lte: new Date(endDate) };

    const report = await Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          totalBills: { $sum: 1 },
          totalSales: { $sum: '$grandTotal' }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Daily Collection Report
// @route   GET /api/reports/daily-collection
// @access  Private
exports.dailyCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: 'Completed' };
    if (startDate) filter.billDate = { $gte: new Date(startDate) };
    if (endDate) filter.billDate = { ...filter.billDate, $lte: new Date(endDate) };

    const bills = await Bill.find(filter);

    const dailyData = {};
    bills.forEach(bill => {
      const date = moment(bill.billDate).format('YYYY-MM-DD');
      if (!dailyData[date]) {
        dailyData[date] = { date, totalBills: 0, cash: 0, upi: 0, card: 0, mixed: 0, totalSales: 0 };
      }
      dailyData[date].totalBills += 1;
      dailyData[date].totalSales += bill.grandTotal;
      dailyData[date][bill.paymentMode.toLowerCase()] += bill.grandTotal;
    });

    const report = Object.values(dailyData).sort((a, b) => b.date.localeCompare(a.date));
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Purchase Summary Report
// @route   GET /api/reports/purchase-summary
// @access  Private/Admin
exports.purchaseSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate) filter.invoiceDate = { $gte: new Date(startDate) };
    if (endDate) filter.invoiceDate = { ...filter.invoiceDate, $lte: new Date(endDate) };

    const purchases = await Purchase.find(filter).populate('supplier', 'supplierName').sort({ invoiceDate: -1 });
    const totalAmount = purchases.reduce((sum, p) => sum + p.invoiceAmount, 0);
    const totalPending = purchases.reduce((sum, p) => sum + p.pendingAmount, 0);

    res.json({ success: true, count: purchases.length, totalAmount, totalPending, purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Stock Report
// @route   GET /api/reports/stock
// @access  Private/Admin
exports.stockReport = async (req, res) => {
  try {
    const items = await SubCode.find({ isActive: true })
      .populate('mainCode', 'name')
      .select('name subCode currentStock unit minStockAlert price costPrice')
      .sort({ currentStock: 1 });

    const report = items.map(item => {
      const currentStock = item.currentStock !== undefined && item.currentStock !== null
        ? Number(item.currentStock)
        : 0;
      const minStockAlert = item.minStockAlert !== undefined && item.minStockAlert !== null
        ? Number(item.minStockAlert)
        : 0;
      const costPrice = item.costPrice !== undefined && item.costPrice !== null
        ? Number(item.costPrice)
        : 0;

      return {
        itemName: item.name,
        subCode: item.subCode,
        mainCode: item.mainCode?.name || 'N/A',
        currentStock: currentStock,
        unit: item.unit || 'Piece',
        minStockAlert: minStockAlert,
        isLowStock: currentStock <= minStockAlert && minStockAlert > 0,
        value: currentStock * costPrice
      };
    });

    res.json({ success: true, report });
  } catch (error) {
    console.error('[Stock Report] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock report',
      error: error.message
    });
  }
};

// @desc    Profit Report
// @route   GET /api/reports/profit
// @access  Private/Admin
exports.profitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: 'Completed' };
    if (startDate) filter.billDate = { $gte: new Date(startDate) };
    if (endDate) filter.billDate = { ...filter.billDate, $lte: new Date(endDate) };

    const bills = await Bill.find(filter);

    let totalRevenue = 0;
    let totalCost = 0;
    const itemProfits = {};

    bills.forEach(bill => {
      totalRevenue += bill.grandTotal;
      bill.items.forEach(item => {
        const cost = item.costPrice * item.quantity;
        const revenue = item.itemTotal;
        const profit = revenue - cost;

        totalCost += cost;

        const key = item.subCode.toString();
        if (!itemProfits[key]) {
          itemProfits[key] = {
            itemName: item.itemName,
            quantitySold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            profitPercent: 0
          };
        }
        itemProfits[key].quantitySold += item.quantity;
        itemProfits[key].revenue += revenue;
        itemProfits[key].cost += cost;
        itemProfits[key].profit += profit;
      });
    });

    const report = Object.values(itemProfits).map(item => ({
      ...item,
      profitPercent: item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(2) : 0
    }));

    const totalProfit = totalRevenue - totalCost;

    res.json({
      success: true,
      summary: { totalRevenue, totalCost, totalProfit, profitPercent: ((totalProfit / totalRevenue) * 100).toFixed(2) },
      report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Supplier Report
// @route   GET /api/reports/supplier
// @access  Private/Admin
exports.supplierReport = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    const report = suppliers.map(s => ({
      supplierName: s.supplierName,
      mobile: s.mobile,
      totalPurchased: s.totalPurchased,
      totalPending: s.totalPending
    }));

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Stock Ledger Report
// @route   GET /api/reports/stock-ledger
// @access  Private/Admin
exports.stockLedgerReport = async (req, res) => {
  try {
    const { itemId, startDate, endDate } = req.query;

    const filter = {};
    if (itemId) filter.itemId = itemId;
    if (startDate) filter.transactionDate = { $gte: new Date(startDate) };
    if (endDate) filter.transactionDate = { ...filter.transactionDate, $lte: new Date(endDate) };

    const ledger = await StockLedger.find(filter)
      .populate('itemId', 'name subCode')
      .sort({ transactionDate: -1 });

    res.json({ success: true, count: ledger.length, ledger });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
