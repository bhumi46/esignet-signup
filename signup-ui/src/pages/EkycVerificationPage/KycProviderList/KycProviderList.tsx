import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { SIGNUP_ROUTE } from "~constants/routes";
import { Button } from "~components/ui/button";
import { FormControl, FormField, FormItem } from "~components/ui/form";
import { Input } from "~components/ui/input";
import {
  Step,
  StepContent,
  StepDivider,
  StepFooter,
  StepHeader,
  StepTitle,
} from "~components/ui/step";
import { getSignInRedirectURL } from "~utils/link";
import { useKycProvidersList } from "~pages/shared/mutations";
import { UpdateProcessRequestDto } from "~typings/types";

import { CancelAlertPopover } from "../CancelAlertPopover";
import {
  EkycVerificationStep,
  EkycVerificationStore,
  hashCodeSelector,
  kycProviderSelector,
  kycProvidersListSelector,
  setCriticalErrorSelector,
  setKycProviderSelector,
  setStepSelector,
  useEkycVerificationStore,
} from "../useEkycVerificationStore";
import { KycProviderCardLayout } from "./components/KycProviderCardLayout";

export const KycProviderList = () => {
  const { t } = useTranslation("translation", {
    keyPrefix: "kyc_provider",
  });

  const {
    setStep,
    setCriticalError,
    setKycProvider,
    kycProvider,
    providerListStore,
    hashCode,
  } = useEkycVerificationStore(
    useCallback(
      (state: EkycVerificationStore) => ({
        setStep: setStepSelector(state),
        setCriticalError: setCriticalErrorSelector(state),
        setKycProvider: setKycProviderSelector(state),
        kycProvider: kycProviderSelector(state),
        providerListStore: kycProvidersListSelector(state),
        hashCode: hashCodeSelector(state),
      }),
      []
    )
  );

  useEffect(() => {}, [setStep]);

  const { hash: fromSignInHash } = useLocation();

  const [cancelButton, setCancelButton] = useState<boolean>(false);
  const [kycProvidersList, setKycProvidersList] = useState<any>([]);
  const [selectedKycProvider, setSelectedKycProvider] = useState<any>(null);
  const searchTextRef = useRef<HTMLInputElement | null>(null);

  /**
   * Handle the proceed button click, move forward to video preview page
   * @param e event
   */
  const handleContinue = (e: any) => {
    e.preventDefault();
    setStep(EkycVerificationStep.TermsAndCondition);
  };

  /**
   * Handle cancel button click, show the cancel alert popover
   * @param e event
   */
  const handleCancel = (e: any) => {
    e.preventDefault();
    setCancelButton(true);
  };

  /**
   * Handle the stay button click, close the cancel alert popover
   */
  const handleStay = () => {
    setCancelButton(false);
  };

  /**
   * Handle the dismiss button click, redirect to relying party page
   */
  const handleDismiss = () => {
    window.location.href = getSignInRedirectURL(
      "http://localhost:5000",
      fromSignInHash,
      SIGNUP_ROUTE
    );
  };

  /**
   * Select KycProvider card and highlight it
   * Also set the selected kycProvider & adding
   * it in the ekyc verification store
   * @param e kycProvider detail
   */
  const selectingKycProviders = (e: any) => {
    setKycProvider(e);
    setSelectedKycProvider(e.id);
  };

  const { kycProvidersList: kycApiCall } = useKycProvidersList();

  const getKycData = () => {
    if (hashCode !== null && hashCode !== undefined) {
      const hasState = hashCode.hasOwnProperty("state");
      const hasCode = hashCode.hasOwnProperty("code");

      if (hasState && hasCode) {
        if (kycApiCall.isPending) return;
        const updateProcessRequestDto: UpdateProcessRequestDto = {
          requestTime: new Date().toISOString(),
          request: {
            authorizationCode: hashCode.code,
            state: hashCode.state,
          },
        };

        return kycApiCall.mutate(updateProcessRequestDto, {
          onSuccess: ({ response }) => {
            setKycProvidersList(response?.identityVerifiers);
            if (response?.identityVerifiers.length === 1) {
              setKycProvider(response?.identityVerifiers[0]);
            }
            return;
          },
          onError: () => {},
        });
      }
    }
  };

  useEffect(() => {
    if (kycProvider !== null) {
      setStep(EkycVerificationStep.TermsAndCondition);
    }

    if (!providerListStore || providerListStore.length === 0) {
      getKycData();
    } else {
      setKycProvidersList(providerListStore);
    }
  }, []);

  return (
    <>
      {cancelButton && (
        <CancelAlertPopover
          description={"description"}
          handleStay={handleStay}
          handleDismiss={handleDismiss}
        />
      )}
      <div className="m-3 mt-10 flex flex-row items-stretch justify-center gap-x-1 sm:mb-20">
        <Step className="mx-10 max-w-[70rem] lg:mx-4 md:rounded-2xl md:shadow sm:rounded-2xl sm:shadow">
          <StepHeader className="px-5 py-5 sm:pb-[25px] sm:pt-[33px]">
            <StepTitle className="relative flex w-full flex-row items-center justify-between text-base font-semibold md:flex-col md:justify-center">
              <div
                className="w-full text-[22px] font-semibold"
                id="kyc-provider-header"
              >
                {t("header")}
              </div>
              {kycProvidersList && kycProvidersList.length > 2 && (
                <div id="search-box" className="w-full md:mt-2">
                  <FormField
                    name="username"
                    render={(field) => (
                      <FormItem className="space-y-0">
                        <div className="space-y-2">
                          <FormControl>
                            <Input
                              id="username"
                              placeholder={t("search_placeholder")}
                              className="py-6"
                              ref={searchTextRef}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </StepTitle>
          </StepHeader>
          <StepDivider />
          <StepContent className="px-6 py-5 text-sm">
            <div className="grid grid-cols-3 gap-x-4 gap-y-5 md:grid-cols-2 sm:grid-cols-1 sm:gap-y-3.5">
              {kycProvidersList?.map((keyInfo: any, index: number) => (
                <div
                  key={index}
                  className="w-full"
                  onClick={() => selectingKycProviders(keyInfo)}
                >
                  <KycProviderCardLayout
                    {...keyInfo}
                    selected={selectedKycProvider === keyInfo.id}
                  ></KycProviderCardLayout>
                </div>
              ))}
              {(!kycProvidersList || kycProvidersList.length === 0) && (
                <div>{t("no_kyc_provider")}</div>
              )}
            </div>
          </StepContent>
          <StepDivider />
          <StepFooter className="p-5">
            <div className="flex w-full flex-row items-center justify-end gap-x-4 sm:justify-center">
              <Button
                id="cancel-preview-button"
                name="cancel-preview-button"
                variant="cancel_outline"
                className="max-w-max p-4 font-semibold sm:w-full sm:max-w-none"
                onClick={handleCancel}
              >
                {t("cancel_button")}
              </Button>
              <Button
                id="proceed-preview-button"
                name="proceed-preview-button"
                className="max-w-max p-4 font-semibold sm:w-full sm:max-w-none"
                onClick={handleContinue}
                disabled={!selectedKycProvider}
              >
                {t("proceed_button")}
              </Button>
            </div>
          </StepFooter>
        </Step>
      </div>
    </>
  );
};