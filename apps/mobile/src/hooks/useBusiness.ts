import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCurrentBusiness,
  addBusiness,
  updateBusiness as updateBusinessAction,
  setPlatformConnections,
  addPlatformConnection,
  removePlatformConnection,
  setBusinessLoading,
} from '../store/slices/business.slice';
import { BusinessService, CreateBusinessData } from '../services/business.service';
import type { Business, Platform } from '../types';

export const useBusiness = () => {
  const dispatch = useAppDispatch();
  const { currentBusiness, businesses, platformConnections, isLoading } =
    useAppSelector(s => s.business);

  const createBusiness = useCallback(
    async (data: CreateBusinessData) => {
      dispatch(setBusinessLoading(true));
      try {
        const response = await BusinessService.createBusiness(data);
        const business = response.data;
        dispatch(addBusiness(business));
        dispatch(setCurrentBusiness(business));
        return business;
      } finally {
        dispatch(setBusinessLoading(false));
      }
    },
    [dispatch],
  );

  const loadBusinesses = useCallback(async () => {
    dispatch(setBusinessLoading(true));
    try {
      const response = await BusinessService.getMyBusinesses();
      const biz = response.data;
      if (biz.length > 0) {
        dispatch(setCurrentBusiness(biz[0]));
      }
      return biz;
    } finally {
      dispatch(setBusinessLoading(false));
    }
  }, [dispatch]);

  const updateBusiness = useCallback(
    async (businessId: string, data: Partial<CreateBusinessData>) => {
      dispatch(setBusinessLoading(true));
      try {
        const response = await BusinessService.updateBusiness(businessId, data);
        const updated = response.data;
        dispatch(updateBusinessAction(updated));
        return updated;
      } finally {
        dispatch(setBusinessLoading(false));
      }
    },
    [dispatch],
  );

  const loadPlatformConnections = useCallback(
    async (businessId: string) => {
      const response =
        await BusinessService.getPlatformConnections(businessId);
      dispatch(setPlatformConnections(response.data));
      return response.data;
    },
    [dispatch],
  );

  const disconnectPlatform = useCallback(
    async (businessId: string, platform: Platform) => {
      await BusinessService.disconnectPlatform(businessId, platform);
      dispatch(removePlatformConnection(platform));
    },
    [dispatch],
  );

  const selectBusiness = useCallback(
    (business: Business) => {
      dispatch(setCurrentBusiness(business));
    },
    [dispatch],
  );

  return {
    currentBusiness,
    businesses,
    platformConnections,
    isLoading,
    createBusiness,
    loadBusinesses,
    updateBusiness,
    loadPlatformConnections,
    disconnectPlatform,
    selectBusiness,
    addPlatformConnectionToStore: (conn: ReturnType<typeof addPlatformConnection>['payload']) => {
      dispatch(addPlatformConnection(conn));
    },
  };
};
