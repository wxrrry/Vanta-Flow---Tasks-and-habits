/** Событие установки PWA (Chrome / Edge) — вынесено в модуль, чтобы ts-loader видел тип без глобалов */
export type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
};
