const WalletService = require('../services/walletService');
const TransactionService = require('../services/transactionService');
const PaymentService = require('../services/paymentService');
const Wallet = require('../models/Wallet');
const CreditRule = require('../models/CreditRule');
const apiResponse = require('../utils/apiResponse');

exports.getWallet = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const wallet = await WalletService.getOrCreateWallet(userId);
    const stats = await WalletService.getWalletStats(userId);

    return res.status(200).json(
      new apiResponse(200, { wallet, stats }, 'Wallet fetched successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error fetching wallet: ${error.message}`)
    );
  }
};

exports.getBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const balance = await WalletService.getBalance(userId);

    return res.status(200).json(
      new apiResponse(200, { balance }, 'Balance fetched successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error fetching balance: ${error.message}`)
    );
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      type,
      status,
      source,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {
      type,
      status,
      source,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const result = await TransactionService.getUserTransactions(userId, filters);

    return res.status(200).json(
      new apiResponse(200, result, 'Transactions fetched successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error fetching transactions: ${error.message}`)
    );
  }
};

exports.getTransactionAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;

    const analytics = await TransactionService.getTransactionAnalytics(userId, parseInt(days));

    return res.status(200).json(
      new apiResponse(200, analytics, 'Transaction analytics fetched successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error fetching analytics: ${error.message}`)
    );
  }
};

exports.exportTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { format = 'json', startDate, endDate } = req.query;

    const data = await WalletService.exportTransactionData(userId, format, startDate, endDate);

    if (format === 'csv') {
      // Convert to CSV
      const csv = _jsonToCSV(data.transactions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      return res.send(csv);
    } else if (format === 'pdf') {
      // PDF export would require a library like pdfkit
      // Implementation depends on requirements
      return res.status(501).json(
        new apiResponse(501, null, 'PDF export coming soon')
      );
    }

    return res.status(200).json(
      new apiResponse(200, data, 'Transactions exported successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error exporting transactions: ${error.message}`)
    );
  }
};

exports.deductCredits = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, source, featureType } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json(
        new apiResponse(400, null, 'Invalid amount')
      );
    }

    const result = await WalletService.deductCredits(
      userId,
      amount,
      source,
      featureType,
      {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );

    if (!result.success) {
      return res.status(402).json(
        new apiResponse(402, result, 'Insufficient credits')
      );
    }

    return res.status(200).json(
      new apiResponse(200, result, 'Credits deducted successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error deducting credits: ${error.message}`)
    );
  }
};

exports.addCredits = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, source, type = 'purchase' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json(
        new apiResponse(400, null, 'Invalid amount')
      );
    }

    const result = await WalletService.addCredits(userId, amount, source, type);

    return res.status(200).json(
      new apiResponse(200, result, 'Credits added successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error adding credits: ${error.message}`)
    );
  }
};

exports.checkBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requiredAmount } = req.body;

    const hasEnough = await WalletService.hasEnoughCredits(userId, requiredAmount);

    return res.status(200).json(
      new apiResponse(200, { hasEnoughCredits: hasEnough, required: requiredAmount }, 'Balance checked')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error checking balance: ${error.message}`)
    );
  }
};

exports.getCreditRules = async (req, res) => {
  try {
    const rules = await CreditRule.find({ isActive: true }).lean();

    return res.status(200).json(
      new apiResponse(200, rules, 'Credit rules fetched successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error fetching rules: ${error.message}`)
    );
  }
};

exports.getWalletStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await WalletService.getWalletStats(userId);

    return res.status(200).json(
      new apiResponse(200, stats, 'Wallet stats fetched successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error fetching stats: ${error.message}`)
    );
  }
};

exports.setupAutoRecharge = async (req, res) => {
  try {
    const userId = req.user._id;
    const { enabled, threshold, amount } = req.body;

    const wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      {
        'autoRecharge.enabled': enabled,
        'autoRecharge.threshold': threshold || 500,
        'autoRecharge.amount': amount || 1000,
      },
      { new: true }
    );

    return res.status(200).json(
      new apiResponse(200, wallet, 'Auto-recharge configured successfully')
    );
  } catch (error) {
    return res.status(500).json(
      new apiResponse(500, null, `Error configuring auto-recharge: ${error.message}`)
    );
  }
};

// Helper function to convert JSON to CSV
function _jsonToCSV(transactions) {
  if (!transactions || transactions.length === 0) {
    return 'No transactions';
  }

  const headers = ['Date', 'Type', 'Source', 'Amount', 'Status', 'Balance After'];
  const rows = transactions.map(t => [
    new Date(t.createdAt).toLocaleDateString(),
    t.type,
    t.source,
    t.amount,
    t.status,
    t.balanceAfter,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csv;
}

module.exports = exports;
