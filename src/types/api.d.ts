export {};

declare global {
  interface Window {
    api?: {
      loadApiKey: () => Promise<string | null>;
      saveApiKey: (key: string) => Promise<boolean>;
    };
  }
}
