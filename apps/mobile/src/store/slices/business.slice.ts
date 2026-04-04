import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Business, PlatformConnection } from '../../types';

interface BusinessState {
  currentBusiness: Business | null;
  businesses: Business[];
  platformConnections: PlatformConnection[];
  isLoading: boolean;
}

const initialState: BusinessState = {
  currentBusiness: null,
  businesses: [],
  platformConnections: [],
  isLoading: false,
};

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setCurrentBusiness(state, action: PayloadAction<Business | null>) {
      state.currentBusiness = action.payload;
    },
    setBusinesses(state, action: PayloadAction<Business[]>) {
      state.businesses = action.payload;
    },
    addBusiness(state, action: PayloadAction<Business>) {
      state.businesses.push(action.payload);
    },
    updateBusiness(state, action: PayloadAction<Business>) {
      const index = state.businesses.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.businesses[index] = action.payload;
      }
      if (state.currentBusiness?.id === action.payload.id) {
        state.currentBusiness = action.payload;
      }
    },
    setPlatformConnections(
      state,
      action: PayloadAction<PlatformConnection[]>,
    ) {
      state.platformConnections = action.payload;
    },
    addPlatformConnection(state, action: PayloadAction<PlatformConnection>) {
      state.platformConnections.push(action.payload);
    },
    removePlatformConnection(state, action: PayloadAction<string>) {
      state.platformConnections = state.platformConnections.filter(
        conn => conn.platform !== action.payload,
      );
    },
    setBusinessLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setCurrentBusiness,
  setBusinesses,
  addBusiness,
  updateBusiness,
  setPlatformConnections,
  addPlatformConnection,
  removePlatformConnection,
  setBusinessLoading,
} = businessSlice.actions;

export default businessSlice.reducer;
