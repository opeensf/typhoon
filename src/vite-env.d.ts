/// <reference types="vite/client" />

type NmcChart = {
  sourceUrl: string;
  time: string;
  localPath: string;
  fileUrl: string;
};

type NmcChartLevel = {
  id: string;
  label: string;
  pageUrl: string;
  charts: NmcChart[];
};

type NmcChartResponse = {
  fetchedAt: number;
  ttlMs: number;
  cacheHit: boolean;
  warning?: string;
  levels: Record<string, NmcChartLevel>;
};

interface Window {
  typhoonApi?: {
    getNmcCharts: (options?: { force?: boolean }) => Promise<NmcChartResponse>;
  };
}

declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      partition?: string;
      allowpopups?: boolean;
      webpreferences?: string;
    };
  }
}
