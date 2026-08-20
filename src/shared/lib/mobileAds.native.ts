type MobileAdsPackage = typeof import('react-native-google-mobile-ads');

let initialization: Promise<boolean> | null = null;

function getMobileAdsPackage() {
  // Keep the native module lazy so Expo Go can open screens that do not render ads.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-google-mobile-ads') as MobileAdsPackage;
}

export function initializeMobileAds() {
  if (initialization) return initialization;

  initialization = initialize();
  return initialization;
}

async function initialize() {
  try {
    const { AdsConsent, MaxAdContentRating, default: mobileAds } = getMobileAdsPackage();
    const consentInfo = await AdsConsent.gatherConsent({ tagForUnderAgeOfConsent: false });

    if (!consentInfo.canRequestAds) {
      initialization = null;
      return false;
    }

    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.T,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();

    return true;
  } catch (error) {
    console.warn('AdMob initialization failed:', error);
    initialization = null;
    return false;
  }
}

export async function showAdPrivacyOptions() {
  try {
    const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } = getMobileAdsPackage();
    const consentInfo = await AdsConsent.requestInfoUpdate({ tagForUnderAgeOfConsent: false });

    if (
      consentInfo.privacyOptionsRequirementStatus !==
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    ) {
      return false;
    }

    await AdsConsent.showPrivacyOptionsForm();
    return true;
  } catch (error) {
    console.warn('AdMob privacy options failed:', error);
    return false;
  }
}
