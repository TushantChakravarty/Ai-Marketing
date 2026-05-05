import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store';
import { setUser, setTokens, setLoading, setHasCompletedOnboarding } from '../store/slices/auth.slice';
import { setCurrentBusiness } from '../store/slices/business.slice';
import { StorageUtil } from '../utils/storage.util';
import { useGetMyBusinessesQuery } from '../store/api/business.api';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingSetupNavigator from './OnboardingSetupNavigator';
import LoadingOverlay from '../components/common/LoadingOverlay';

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, hasCompletedOnboarding } =
    useAppSelector(s => s.auth);
  const currentBusiness = useAppSelector(s => s.business.currentBusiness);

  const { data: businessData } = useGetMyBusinessesQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (businessData?.data?.length && !currentBusiness) {
      dispatch(setCurrentBusiness(businessData.data[0]));
    }
  }, [businessData, currentBusiness, dispatch]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const [user, token, refreshToken, onboardingDone, savedBusiness] = await Promise.all([
          StorageUtil.getUser(),
          StorageUtil.getToken(),
          StorageUtil.getRefreshToken(),
          StorageUtil.getOnboardingCompleted(),
          StorageUtil.getCurrentBusiness(),
        ]);

        if (user && token && refreshToken) {
          dispatch(setUser(user));
          dispatch(
            setTokens({
              accessToken: token,
              refreshToken,
              expiresAt: Date.now() + 3600 * 1000,
            }),
          );
          dispatch(setHasCompletedOnboarding(onboardingDone));
          if (savedBusiness) {
            dispatch(setCurrentBusiness(savedBusiness));
          }
        }
      } catch {
        // If token loading fails, user stays unauthenticated
      } finally {
        dispatch(setLoading(false));
      }
    };

    bootstrapAuth();
  }, [dispatch]);

  const showOnboarding =
    isAuthenticated && !currentBusiness && !hasCompletedOnboarding;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : showOnboarding ? (
        <OnboardingSetupNavigator />
      ) : (
        <MainNavigator />
      )}
      <LoadingOverlay visible={isLoading} transparent />
    </NavigationContainer>
  );
};

export default AppNavigator;
