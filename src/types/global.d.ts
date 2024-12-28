declare namespace GM {
  type Value = string | number | boolean | null | undefined | any[] | Record<string, any>;
  
  interface GMInfo {
    script: {
      name: string;
      namespace: string;
      description: string;
      version: string;
    };
    scriptMetaStr: string;
    scriptHandler: string;
    version: string;
  }

  interface NotificationDetails {
    text: string;
    title?: string;
    image?: string;
    highlight?: boolean;
    silent?: boolean;
    timeout?: number;
    onclick?: () => void;
    ondone?: () => void;
  }

  function getValue<T extends Value>(key: string, defaultValue?: T): Promise<T>;
  function setValue(key: string, value: Value): Promise<void>;
  function deleteValue(key: string): Promise<void>;
  function listValues(): Promise<string[]>;
  function getResourceUrl(name: string): Promise<string>;
  function addStyle(css: string): void;
  function openInTab(url: string, options?: { active?: boolean; insert?: boolean }): void;
  function registerMenuCommand(caption: string, commandFunc: () => void, accessKey?: string): void;
  function notification(details: NotificationDetails): void;
}

interface Window {
  GM: typeof GM;
} 