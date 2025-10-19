import * as LocalAuthentication from "expo-local-authentication";

export async function useBiometrics() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const saved = await LocalAuthentication.isEnrolledAsync();
  if (!saved) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock App",
    fallbackLabel: "Use password",
  });

  return result.success;
}
