import type { Bookmark } from "./bookmarks";

export type LayoutMode = "one" | "two" | "three" | "four";

export type PaneState = {
  id: string;
  title: string;
  url: string;
};

export type Workspace = {
  id: string;
  name: string;
  layout: LayoutMode;
  panes: PaneState[];
};

const emptyPane = (id: string): PaneState => ({
  id,
  title: "空白窗格",
  url: ""
});

const paneFrom = (id: string, bookmark?: Bookmark): PaneState => {
  if (!bookmark) {
    return emptyPane(id);
  }

  return {
    id,
    title: bookmark.title,
    url: bookmark.url
  };
};

const internalPane = (id: string, title: string, url: string): PaneState => ({
  id,
  title,
  url
});

export function buildDefaultWorkspaces(bookmarks: Bookmark[]): Workspace[] {
  const find = (id: string) => bookmarks.find((bookmark) => bookmark.id === id);

  return [
    {
      id: "tieba",
      name: "台风吧",
      layout: "one",
      panes: [
        paneFrom("pane-1", find("tieba-typhoon")),
        emptyPane("pane-2"),
        emptyPane("pane-3"),
        emptyPane("pane-4")
      ]
    },
    {
      id: "realtime",
      name: "台风实时监控",
      layout: "four",
      panes: [
        paneFrom("pane-1", find("rammb-tc")),
        paneFrom("pane-2", find("jtwc")),
        paneFrom("pane-3", find("tropical-tidbits")),
        paneFrom("pane-4", find("zoom-earth"))
      ]
    },
    {
      id: "westpac-satellite",
      name: "西太卫星云图",
      layout: "four",
      panes: [
        paneFrom("pane-1", find("fy4a")),
        paneFrom("pane-2", find("nict-himawari")),
        paneFrom("pane-3", find("himawari-target")),
        paneFrom("pane-4", find("digital-typhoon"))
      ]
    },
    {
      id: "hainan-now",
      name: "华南/海南近岸实况",
      layout: "four",
      panes: [
        paneFrom("pane-1", find("hainan-qx")),
        paneFrom("pane-2", find("hainan-live")),
        paneFrom("pane-3", find("haikou-radar")),
        paneFrom("pane-4", find("hko-weather-chart"))
      ]
    },
    {
      id: "forums",
      name: "论坛研判",
      layout: "four",
      panes: [
        paneFrom("pane-1", find("tybbs")),
        paneFrom("pane-2", find("tieba-typhoon")),
        paneFrom("pane-3", find("tyboard")),
        paneFrom("pane-4", find("storm2k"))
      ]
    },
    {
      id: "environment",
      name: "环境场分析",
      layout: "four",
      panes: [
        paneFrom("pane-1", find("earth")),
        paneFrom("pane-2", find("ventusky")),
        paneFrom("pane-3", find("meteologix")),
        paneFrom("pane-4", find("cimss-dlm"))
      ]
    },
    {
      id: "nmc-weather-charts",
      name: "NMC 天气图",
      layout: "one",
      panes: [
        internalPane("pane-1", "NMC 天气图工作台", "internal://nmc-weather-charts"),
        emptyPane("pane-2"),
        emptyPane("pane-3"),
        emptyPane("pane-4")
      ]
    }
  ];
}
