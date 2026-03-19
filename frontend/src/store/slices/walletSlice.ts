import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentAPI } from '@/lib/api';
import type { WalletData, WalletTransaction, WithdrawRequest, PaymentMethod, PaginationMeta } from '@/types';

interface WalletState {
  wallet: WalletData | null;
  walletLoading: boolean;

  transactions: WalletTransaction[];
  transactionsLoading: boolean;
  transactionsPagination: PaginationMeta | null;

  withdrawals: WithdrawRequest[];
  withdrawalsLoading: boolean;

  paymentMethods: PaymentMethod[];
  paymentMethodsLoading: boolean;

  error: string | null;
}

const initialState: WalletState = {
  wallet: null,
  walletLoading: false,
  transactions: [],
  transactionsLoading: false,
  transactionsPagination: null,
  withdrawals: [],
  withdrawalsLoading: false,
  paymentMethods: [],
  paymentMethodsLoading: false,
  error: null,
};

export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async () => {
    const { data } = await paymentAPI.getWallet();
    return data.data;
  }
);

export const fetchWalletTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (params?: { page?: number; limit?: number; type?: string }) => {
    const { data } = await paymentAPI.getWalletTransactions(params);
    return { transactions: data.data, pagination: data.pagination };
  }
);

export const fetchWithdrawals = createAsyncThunk(
  'wallet/fetchWithdrawals',
  async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await paymentAPI.getMyWithdrawals(params);
    return data.data;
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'wallet/fetchPaymentMethods',
  async () => {
    const { data } = await paymentAPI.getPaymentMethods();
    return data.data;
  }
);

export const addPaymentMethod = createAsyncThunk(
  'wallet/addPaymentMethod',
  async (methodData: { type: string; details: Record<string, string>; label?: string; gateway?: string }) => {
    const { data } = await paymentAPI.addPaymentMethod(methodData);
    return data.data;
  }
);

export const deletePaymentMethod = createAsyncThunk(
  'wallet/deletePaymentMethod',
  async (id: string) => {
    await paymentAPI.deletePaymentMethod(id);
    return id;
  }
);

export const topUpWallet = createAsyncThunk(
  'wallet/topUp',
  async (data: { amount: number; currency: string }) => {
    const { data: res } = await paymentAPI.topUpWallet(data);
    return res.data;
  }
);

export const requestWithdraw = createAsyncThunk(
  'wallet/requestWithdraw',
  async (data: { amount: number; payoutMethod: string; payoutDetails: Record<string, string> }) => {
    const { data: res } = await paymentAPI.requestWithdraw(data);
    return res.data;
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearWalletError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Wallet
      .addCase(fetchWallet.pending, (state) => { state.walletLoading = true; })
      .addCase(fetchWallet.fulfilled, (state, action) => { state.walletLoading = false; state.wallet = action.payload; })
      .addCase(fetchWallet.rejected, (state, action) => { state.walletLoading = false; state.error = action.error.message || 'Failed'; })

      // Transactions
      .addCase(fetchWalletTransactions.pending, (state) => { state.transactionsLoading = true; })
      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload.transactions;
        state.transactionsPagination = action.payload.pagination;
      })
      .addCase(fetchWalletTransactions.rejected, (state, action) => { state.transactionsLoading = false; state.error = action.error.message || 'Failed'; })

      // Withdrawals
      .addCase(fetchWithdrawals.pending, (state) => { state.withdrawalsLoading = true; })
      .addCase(fetchWithdrawals.fulfilled, (state, action) => { state.withdrawalsLoading = false; state.withdrawals = action.payload; })
      .addCase(fetchWithdrawals.rejected, (state, action) => { state.withdrawalsLoading = false; state.error = action.error.message || 'Failed'; })

      // Payment Methods
      .addCase(fetchPaymentMethods.pending, (state) => { state.paymentMethodsLoading = true; })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => { state.paymentMethodsLoading = false; state.paymentMethods = action.payload; })
      .addCase(fetchPaymentMethods.rejected, (state, action) => { state.paymentMethodsLoading = false; state.error = action.error.message || 'Failed'; })

      // Add Payment Method
      .addCase(addPaymentMethod.fulfilled, (state, action) => { state.paymentMethods.push(action.payload); })

      // Delete Payment Method
      .addCase(deletePaymentMethod.fulfilled, (state, action) => { state.paymentMethods = state.paymentMethods.filter((m) => m._id !== action.payload); })

      // Top Up
      .addCase(topUpWallet.fulfilled, (state, action) => { state.wallet = action.payload; })

      // Withdraw
      .addCase(requestWithdraw.fulfilled, (state, action) => { state.withdrawals.unshift(action.payload); });
  },
});

export const { clearWalletError } = walletSlice.actions;
export default walletSlice.reducer;
