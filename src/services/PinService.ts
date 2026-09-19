import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = '@admin_pin';
const DEFAULT_PIN = '1234';

export class PinService {
  /**
   * Retrieves the current admin PIN from persistent storage.
   * Defaults to '1234' if none has been set yet.
   */
  static async getPin(): Promise<string> {
    try {
      const pin = await AsyncStorage.getItem(PIN_KEY);
      return pin !== null ? pin : DEFAULT_PIN;
    } catch (error) {
      console.error('Error reading PIN:', error);
      return DEFAULT_PIN;
    }
  }

  /**
   * Saves a new admin PIN to persistent storage.
   */
  static async setPin(newPin: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(PIN_KEY, newPin);
      return true;
    } catch (error) {
      console.error('Error saving PIN:', error);
      return false;
    }
  }
}

