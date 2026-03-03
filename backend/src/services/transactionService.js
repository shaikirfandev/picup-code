const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

class TransactionService {
  /**
   * Get filtered transactions for user
   */
  static async getUserTransactions(userId, filters = {}) {
    try {
      const {
        type,
        status,
        source,
        startDate,
        endDate,
        limit = 20,
        page = 1,
        sortBy = 'createdAt',
        sortOrder = -1,
      } = filters;

      const query = { user: userId };

      if (type) query.type = type;
      if (status) query.status = status;
      if (source) query.source = source;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const transactions = await Transaction
        .find(query)
        .populate('payment', 'gateway status amount')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Transaction.countDocuments(query);

      return {
        data: transactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId).populate('user', 'username email');
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      return transaction;
    } catch (error) {
      throw new Error(`Error fetching transaction: ${error.message}`);
    }
  }

  /**
   * Get analytics for transactions
   */
  static async getTransactionAnalytics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const transactions = await Transaction.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      // Get daily breakdown
      const dailyBreakdown = await Transaction.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            spent: {
              $sum: {
                $cond: [{ $eq: ['$type', 'usage'] }, '$amount', 0],
              },
            },
            earned: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['purchase', 'bonus']] },
                  '$amount',
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        byType: transactions,
        dailyBreakdown,
        period: { days, from: startDate },
      };
    } catch (error) {
      throw new Error(`Error fetching analytics: ${error.message}`);
    }
  }

  /**
   * Bulk create transactions (for imports, seeds)
   */
  static async bulkCreateTransactions(transactions) {
    try {
      const result = await Transaction.insertMany(transactions, { ordered: false });
      return { inserted: result.length, transactions: result };
    } catch (error) {
      throw new Error(`Error bulk creating transactions: ${error.message}`);
    }
  }

  /**
   * Create transaction from payment
   */
  static async createFromPayment(userId, paymentId, amount, gateway) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      
      const transaction = new Transaction({
        user: userId,
        type: 'purchase',
        source: 'manual_purchase',
        amount,
        status: 'completed',
        balanceAfter: wallet.balance,
        balanceBefore: wallet.balance - amount,
        description: `Credit purchase via ${gateway}`,
        referenceId: paymentId,
        referenceType: 'payment',
        payment: paymentId,
        metadata: { gateway, paymentId },
      });

      await transaction.save();
      return transaction;
    } catch (error) {
      throw new Error(`Error creating payment transaction: ${error.message}`);
    }
  }

  /**
   * Get top spending users
   */
  static async getTopSpenders(limit = 10) {
    try {
      const spenders = await Transaction.aggregate([
        { $match: { type: 'usage', status: 'completed' } },
        {
          $group: {
            _id: '$user',
            totalSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
      ]);

      return spenders;
    } catch (error) {
      throw new Error(`Error fetching top spenders: ${error.message}`);
    }
  }

  /**
   * Reverse transaction (mark as reversed)
   */
  static async reverseTransaction(transactionId, reason) {
    try {
      const transaction = await Transaction.findById(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      transaction.status = 'reversed';
      transaction.metadata = transaction.metadata || {};
      transaction.metadata.reversedReason = reason;
      transaction.metadata.reversedAt = new Date();

      await transaction.save();
      return transaction;
    } catch (error) {
      throw new Error(`Error reversing transaction: ${error.message}`);
    }
  }
}

module.exports = TransactionService;
