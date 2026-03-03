const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class WalletService {
  /**
   * Get or create wallet for user
   */
  static async getOrCreateWallet(userId) {
    try {
      let wallet = await Wallet.findOne({ user: userId });
      
      if (!wallet) {
        wallet = new Wallet({
          user: userId,
          balance: 0,
          totalPurchased: 0,
          totalUsed: 0,
          bonusCredits: 0,
          currency: 'CREDITS',
        });
        await wallet.save();
      }
      
      return wallet;
    } catch (error) {
      throw new Error(`Error getting/creating wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balance for user (safe server-side check)
   */
  static async getBalance(userId) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      return wallet ? wallet.balance : 0;
    } catch (error) {
      throw new Error(`Error fetching balance: ${error.message}`);
    }
  }

  /**
   * Deduct credits from wallet with atomic transaction
   * Returns transaction details if successful
   */
  static async deductCredits(userId, amount, source, featureType, request = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      // Fetch wallet with lock
      const wallet = await Wallet.findOne({ user: userId }).session(session);
      
      if (!wallet) {
        throw new Error('Wallet not found for user');
      }

      if (wallet.isFrozen) {
        throw new Error('Wallet is frozen. Cannot perform transactions.');
      }

      if (wallet.balance < amount) {
        await session.abortTransaction();
        return {
          success: false,
          error: 'Insufficient credits',
          required: amount,
          available: wallet.balance,
        };
      }

      // Update wallet balance
      wallet.balance -= amount;
      wallet.totalUsed = (wallet.totalUsed || 0) + amount;
      wallet.lastCreditUsedAt = new Date();
      await wallet.save({ session });

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: 'usage',
        source: featureType || source,
        amount,
        status: 'completed',
        balanceAfter: wallet.balance,
        balanceBefore: wallet.balance + amount,
        description: source,
        ipAddress: request.ip,
        userAgent: request.userAgent,
        metadata: {
          featureType,
          source,
        },
      });

      await transaction.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        balance: wallet.balance,
        transaction: transaction._id,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new Error(error.message);
    } finally {
      session.endSession();
    }
  }

  /**
   * Add credits to wallet with atomic transaction
   */
  static async addCredits(userId, amount, source, type = 'purchase', metadata = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      const wallet = await Wallet.findOne({ user: userId }).session(session);
      
      if (!wallet) {
        throw new Error('Wallet not found for user');
      }

      // Add credits based on type
      if (type === 'purchase') {
        wallet.totalPurchased = (wallet.totalPurchased || 0) + amount;
      } else if (type === 'bonus') {
        wallet.bonusCredits = (wallet.bonusCredits || 0) + amount;
      }

      wallet.balance += amount;
      wallet.lastCreditPurchaseAt = new Date();
      await wallet.save({ session });

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: type === 'bonus' ? 'bonus' : 'purchase',
        source,
        amount,
        status: 'completed',
        balanceAfter: wallet.balance,
        balanceBefore: wallet.balance - amount,
        description: `${type === 'bonus' ? 'Bonus' : 'Purchase'} credits from ${source}`,
        metadata,
      });

      await transaction.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        balance: wallet.balance,
        transaction: transaction._id,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new Error(error.message);
    } finally {
      session.endSession();
    }
  }

  /**
   * Refund credits for failed transaction
   */
  static async refundCredits(userId, amount, reason, referenceId, request = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await Wallet.findOne({ user: userId }).session(session);
      
      if (!wallet) {
        throw new Error('Wallet not found for user');
      }

      wallet.balance += amount;
      await wallet.save({ session });

      const transaction = new Transaction({
        user: userId,
        type: 'refund',
        source: 'refund_usage',
        amount,
        status: 'completed',
        balanceAfter: wallet.balance,
        balanceBefore: wallet.balance - amount,
        description: reason,
        referenceId,
        ipAddress: request.ip,
        userAgent: request.userAgent,
      });

      await transaction.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        balance: wallet.balance,
        transaction: transaction._id,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new Error(error.message);
    } finally {
      session.endSession();
    }
  }

  /**
   * Get transaction history for user
   */
  static async getTransactionHistory(userId, filters = {}) {
    try {
      const {
        type,
        status,
        source,
        startDate,
        endDate,
        limit = 50,
        page = 1,
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

      const transactions = await Transaction
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Transaction.countDocuments(query);

      return {
        transactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error fetching transaction history: ${error.message}`);
    }
  }

  /**
   * Check if user has enough credits (safe validation)
   */
  static async hasEnoughCredits(userId, requiredAmount) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      return wallet && wallet.balance >= requiredAmount;
    } catch (error) {
      throw new Error(`Error checking credits: ${error.message}`);
    }
  }

  /**
   * Manual credit adjustment by admin
   */
  static async adminAdjustCredits(userId, amount, reason, adminId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await Wallet.findOne({ user: userId }).session(session);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const type = amount > 0 ? 'bonus' : 'adjustment';
      const balanceBefore = wallet.balance;

      wallet.balance += amount;
      if (amount > 0) {
        wallet.bonusCredits = (wallet.bonusCredits || 0) + amount;
      }

      await wallet.save({ session });

      const transaction = new Transaction({
        user: userId,
        type,
        source: 'admin_grant',
        amount: Math.abs(amount),
        status: 'completed',
        balanceAfter: wallet.balance,
        balanceBefore,
        description: reason,
        metadata: { adminId, adjustedBy: adminId },
      });

      await transaction.save({ session });
      await session.commitTransaction();

      return {
        success: true,
        balance: wallet.balance,
        transaction: transaction._id,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new Error(error.message);
    } finally {
      session.endSession();
    }
  }

  /**
   * Freeze/unfreeze wallet
   */
  static async toggleWalletFreeze(userId, freeze = true, reason = '', adminId) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      wallet.isFrozen = freeze;
      if (freeze) {
        wallet.frozenReason = reason;
        wallet.frozenAt = new Date();
        wallet.frozenBy = adminId;
      } else {
        wallet.frozenReason = undefined;
        wallet.frozenAt = undefined;
        wallet.frozenBy = undefined;
      }

      await wallet.save();
      return wallet;
    } catch (error) {
      throw new Error(`Error toggling freeze: ${error.message}`);
    }
  }

  /**
   * Export transaction history as structured data
   */
  static async exportTransactionData(userId, format = 'json', startDate, endDate) {
    try {
      const query = { user: userId };

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const transactions = await Transaction.find(query).sort({ createdAt: -1 });
      const wallet = await Wallet.findOne({ user: userId });

      return {
        userId,
        wallet: {
          balance: wallet.balance,
          totalPurchased: wallet.totalPurchased,
          totalUsed: wallet.totalUsed,
          bonusCredits: wallet.bonusCredits,
        },
        transactions,
        exportDate: new Date(),
        format,
      };
    } catch (error) {
      throw new Error(`Error exporting data: ${error.message}`);
    }
  }

  /**
   * Get wallet dashboard stats
   */
  static async getWalletStats(userId) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const monthlyTransactions = await Transaction.find({
        user: userId,
        createdAt: { $gte: thirtyDaysAgo },
      });

      const monthlyUsage = monthlyTransactions
        .filter(t => t.type === 'usage')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyPurchased = monthlyTransactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        totalPurchased: wallet.totalPurchased,
        totalUsed: wallet.totalUsed,
        bonusCredits: wallet.bonusCredits,
        monthlyUsage,
        monthlyPurchased,
        isFrozen: wallet.isFrozen,
        autoRecharge: wallet.autoRecharge,
      };
    } catch (error) {
      throw new Error(`Error fetching wallet stats: ${error.message}`);
    }
  }
}

module.exports = WalletService;
