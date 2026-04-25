import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Copy,
  ExternalLink,
  Grid2X2,
  Maximize2,
  Menu,
  PanelLeft,
  RefreshCcw,
  Search,
  Square,
  Star,
  StarOff,
  X
} from "lucide-react";
import { categories, defaultBookmarks, type Bookmark, type BookmarkCategory } from "./data/bookmarks";
import { buildDefaultWorkspaces, type LayoutMode, type PaneState, type Workspace } from "./data/workspaces";
import "./styles.css";

type WebviewElement = HTMLElement & {
  reload: () => void;
  reloadIgnoringCache: () => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  getURL: () => string;
  getTitle: () => string;
};

const STORAGE_KEY = "jerrys-typhoon-workbench:v1";
const paneOrder = ["pane-1", "pane-2", "pane-3", "pane-4"];
const refreshOptions = [0, 5, 10, 30, 60];
const referenceImages = [
  {
    title: "速度转换",
    url: "file:///D:/New%20project/windspeed.jpg"
  },
  {
    title: "云图参考",
    url: "file:///D:/New%20project/devo.jpg"
  }
];

type PersistedState = {
  panes: PaneState[];
  selectedPaneId: string;
  layout: LayoutMode;
  workspaceId: string;
  autoRefresh: boolean;
  favoriteIds: string[];
  sidebarCollapsed: boolean;
  bookmarkTitles: Record<string, string>;
  bookmarkRefreshIntervals: Record<string, number>;
  customBookmarks: Bookmark[];
  workspaces: Workspace[];
};

const defaultWorkspaces = buildDefaultWorkspaces(defaultBookmarks);
const initialWorkspace = defaultWorkspaces[0];

function getInitialState(): PersistedState {
  const fallback: PersistedState = {
    panes: initialWorkspace.panes,
    selectedPaneId: "pane-1",
    layout: initialWorkspace.layout,
    workspaceId: initialWorkspace.id,
    autoRefresh: true,
    favoriteIds: defaultBookmarks.filter((bookmark) => bookmark.pinned).map((bookmark) => bookmark.id),
    sidebarCollapsed: false,
    bookmarkTitles: {},
    bookmarkRefreshIntervals: {},
    customBookmarks: [],
    workspaces: defaultWorkspaces
  };

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = { ...fallback, ...JSON.parse(raw) };
    return {
      ...parsed,
      panes: normalizePanes(parsed.panes),
      customBookmarks: Array.isArray(parsed.customBookmarks) ? parsed.customBookmarks : [],
      workspaces: normalizeWorkspaces(parsed.workspaces),
      layout: normalizeLayout(parsed.layout),
      selectedPaneId: paneOrder.includes(parsed.selectedPaneId) ? parsed.selectedPaneId : "pane-1"
    };
  } catch {
    return fallback;
  }
}

function App() {
  const [query, setQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<BookmarkCategory>>(new Set(categories));
  const [state, setState] = useState<PersistedState>(() => getInitialState());
  const [lastRefresh, setLastRefresh] = useState<string>("尚未刷新");
  const [draggingBookmarkId, setDraggingBookmarkId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ bookmark: Bookmark; x: number; y: number } | null>(null);
  const [workspaceMenu, setWorkspaceMenu] = useState<{ workspace: Workspace; x: number; y: number } | null>(null);
  const [renameDialog, setRenameDialog] = useState<{ bookmark: Bookmark; value: string } | null>(null);
  const [importDialog, setImportDialog] = useState({ open: false, title: "", url: "", category: "自定义" as BookmarkCategory });
  const [workspaceEditor, setWorkspaceEditor] = useState<Workspace | null>(null);
  const [paneStatuses, setPaneStatuses] = useState<Record<string, "idle" | "loading" | "ready" | "failed">>({});
  const [referenceViewer, setReferenceViewer] = useState<{ title: string; url: string } | null>(null);
  const webviews = useRef(new Map<string, WebviewElement>());

  const bookmarks = useMemo(
    () =>
      [...defaultBookmarks, ...state.customBookmarks].map((bookmark) => ({
        ...bookmark,
        title: state.bookmarkTitles[bookmark.id] || bookmark.title,
        refreshIntervalMinutes: state.bookmarkRefreshIntervals[bookmark.id] ?? bookmark.refreshIntervalMinutes ?? (bookmark.refresh ? 5 : 0)
      })),
    [state.bookmarkRefreshIntervals, state.bookmarkTitles, state.customBookmarks]
  );
  const activePanes = normalizePanes(state.panes).slice(0, layoutSize(state.layout));
  const favoriteSet = useMemo(() => new Set(state.favoriteIds), [state.favoriteIds]);

  const filteredBookmarks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const sortedBookmarks = [...bookmarks].sort(
      (a, b) => Number(favoriteSet.has(b.id)) - Number(favoriteSet.has(a.id))
    );
    if (!normalized) {
      return sortedBookmarks;
    }

    return sortedBookmarks.filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(normalized) ||
        bookmark.category.toLowerCase().includes(normalized) ||
        bookmark.url.toLowerCase().includes(normalized)
    );
  }, [bookmarks, favoriteSet, query]);

  const groupedBookmarks = useMemo(() => {
    return categories.map((category) => ({
      category,
      bookmarks: filteredBookmarks.filter((bookmark) => bookmark.category === category)
    }));
  }, [filteredBookmarks]);

  const favoriteBookmarks = useMemo(
    () => bookmarks.filter((bookmark) => favoriteSet.has(bookmark.id)),
    [bookmarks, favoriteSet]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const closeMenu = () => {
      setContextMenu(null);
      setWorkspaceMenu(null);
    };
    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", closeMenu);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", closeMenu);
    };
  }, []);

  useEffect(() => {
    if (!state.autoRefresh) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      refreshDuePanes();
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, [activePanes, bookmarks, state.autoRefresh]);

  function updatePane(paneId: string, patch: Partial<PaneState>) {
    setState((current) => ({
      ...current,
      panes: normalizePanes(current.panes).map((pane) => (pane.id === paneId ? { ...pane, ...patch } : pane))
    }));
  }

  function openBookmark(bookmark: Bookmark) {
    updatePane(state.selectedPaneId, {
      title: bookmark.title,
      url: bookmark.url
    });
  }

  function addBookmarkToWorkbench(bookmark: Bookmark, targetPaneId?: string) {
    setState((current) => {
      const panes = normalizePanes(current.panes);
      const currentSize = layoutSize(current.layout);
      const explicitTarget = targetPaneId;
      const firstEmptyVisible = panes.slice(0, currentSize).find((pane) => !pane.url)?.id;
      const shouldGrow = !explicitTarget && !firstEmptyVisible && currentSize < 4;
      const nextLayout = shouldGrow ? sizeToLayout(currentSize + 1) : current.layout;
      const nextSize = layoutSize(nextLayout);
      const targetId = explicitTarget ?? firstEmptyVisible ?? panes.slice(0, nextSize).find((pane) => !pane.url)?.id ?? current.selectedPaneId;

      return {
        ...current,
        layout: nextLayout,
        selectedPaneId: targetId,
        panes: panes.map((pane) =>
          pane.id === targetId
            ? {
                ...pane,
                title: bookmark.title,
                url: bookmark.url
              }
            : pane
        )
      };
    });
  }

  function toggleFavorite(bookmarkId: string) {
    setState((current) => {
      const favorites = new Set(current.favoriteIds);
      if (favorites.has(bookmarkId)) {
        favorites.delete(bookmarkId);
      } else {
        favorites.add(bookmarkId);
      }

      return {
        ...current,
        favoriteIds: [...favorites]
      };
    });
  }

  function renameBookmark(bookmark: Bookmark, title: string) {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === bookmark.title) {
      return;
    }

    setState((current) => ({
      ...current,
      bookmarkTitles: {
        ...current.bookmarkTitles,
        [bookmark.id]: nextTitle
      },
      panes: current.panes.map((pane) => (pane.url === bookmark.url ? { ...pane, title: nextTitle } : pane))
    }));
  }

  function resetBookmarkTitle(bookmark: Bookmark) {
    setState((current) => {
      const nextTitles = { ...current.bookmarkTitles };
      delete nextTitles[bookmark.id];
      const originalTitle = defaultBookmarks.find((item) => item.id === bookmark.id)?.title ?? bookmark.title;

      return {
        ...current,
        bookmarkTitles: nextTitles,
        panes: current.panes.map((pane) => (pane.url === bookmark.url ? { ...pane, title: originalTitle } : pane))
      };
    });
  }

  function setBookmarkRefreshInterval(bookmark: Bookmark, minutes: number) {
    setState((current) => ({
      ...current,
      bookmarkRefreshIntervals: {
        ...current.bookmarkRefreshIntervals,
        [bookmark.id]: minutes
      }
    }));
  }

  function loadWorkspace(workspace: Workspace) {
    setState((current) => ({
      ...current,
      panes: normalizePanes(workspace.panes),
      selectedPaneId: "pane-1",
      layout: workspace.layout,
      workspaceId: workspace.id
    }));
  }

  function importBookmark() {
    const rawUrl = importDialog.url.trim();
    if (!rawUrl) {
      return;
    }

    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const title = importDialog.title.trim() || url.replace(/^https?:\/\//i, "");
    const bookmark: Bookmark = {
      id: `custom-${Date.now()}`,
      title,
      url,
      category: importDialog.category,
      refresh: true,
      refreshIntervalMinutes: 5
    };

    setState((current) => ({
      ...current,
      customBookmarks: [...current.customBookmarks, bookmark]
    }));
    setImportDialog({ open: false, title: "", url: "", category: "自定义" });
  }

  function createWorkspace() {
    const workspace: Workspace = {
      id: `workspace-${Date.now()}`,
      name: "新快捷模式",
      layout: "one",
      panes: normalizePanes([])
    };

    setState((current) => ({
      ...current,
      workspaces: [...current.workspaces, workspace],
      workspaceId: workspace.id,
      layout: workspace.layout,
      panes: workspace.panes
    }));
    setWorkspaceEditor(workspace);
  }

  function renameWorkspace(workspace: Workspace) {
    const nextName = window.prompt("快捷模式名称", workspace.name)?.trim();
    if (!nextName || nextName === workspace.name) {
      return;
    }

    setState((current) => ({
      ...current,
      workspaces: current.workspaces.map((item) => (item.id === workspace.id ? { ...item, name: nextName } : item))
    }));
  }

  function deleteWorkspace(workspace: Workspace) {
    if (state.workspaces.length <= 1) {
      return;
    }
    if (!window.confirm(`删除快捷模式「${workspace.name}」？`)) {
      return;
    }

    setState((current) => {
      const workspaces = current.workspaces.filter((item) => item.id !== workspace.id);
      const fallbackWorkspace = workspaces[0];
      const removingActive = current.workspaceId === workspace.id;
      return {
        ...current,
        workspaces,
        workspaceId: removingActive ? fallbackWorkspace.id : current.workspaceId,
        layout: removingActive ? fallbackWorkspace.layout : current.layout,
        panes: removingActive ? normalizePanes(fallbackWorkspace.panes) : current.panes
      };
    });
  }

  function saveWorkspace(workspace: Workspace) {
    const normalized = {
      ...workspace,
      panes: normalizePanes(workspace.panes)
    };

    setState((current) => ({
      ...current,
      workspaces: current.workspaces.map((item) => (item.id === normalized.id ? normalized : item)),
      workspaceId: current.workspaceId === normalized.id ? normalized.id : current.workspaceId,
      layout: current.workspaceId === normalized.id ? normalized.layout : current.layout,
      panes: current.workspaceId === normalized.id ? normalized.panes : current.panes
    }));
    setWorkspaceEditor(null);
  }

  function saveCurrentAsWorkspace() {
    const name = window.prompt("保存当前布局为快捷模式", "当前追踪布局")?.trim();
    if (!name) {
      return;
    }

    const workspace: Workspace = {
      id: `workspace-${Date.now()}`,
      name,
      layout: state.layout,
      panes: normalizePanes(state.panes)
    };

    setState((current) => ({
      ...current,
      workspaces: [...current.workspaces, workspace],
      workspaceId: workspace.id
    }));
  }

  function setLayout(layout: LayoutMode) {
    setState((current) => ({
      ...current,
      layout,
      selectedPaneId: paneOrder[Math.min(layoutSize(layout), paneOrder.length) - 1] ?? current.selectedPaneId
    }));
  }

  function refreshPane(paneId: string, ignoreCache = false) {
    const webview = webviews.current.get(paneId);
    if (!webview) {
      return;
    }

    if (ignoreCache) {
      webview.reloadIgnoringCache();
    } else {
      webview.reload();
    }
    setLastRefresh(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
  }

  function refreshAll(ignoreCache = false) {
    activePanes.forEach((pane) => {
      if (pane.url) {
        refreshPane(pane.id, ignoreCache);
      }
    });
    setLastRefresh(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
  }

  function refreshDuePanes() {
    const now = Date.now();
    activePanes.forEach((pane) => {
      const bookmark = bookmarks.find((item) => item.url === pane.url);
      const interval = bookmark?.refreshIntervalMinutes ?? 0;
      if (!interval || !pane.url) {
        return;
      }

      const webview = webviews.current.get(pane.id);
      const last = Number(webview?.dataset.lastAutoRefresh || 0);
      if (webview && now - last >= interval * 60 * 1000) {
        webview.dataset.lastAutoRefresh = String(now);
        refreshPane(pane.id, true);
      }
    });
  }

  function navigate(paneId: string, direction: "back" | "forward") {
    const webview = webviews.current.get(paneId);
    if (!webview) {
      return;
    }
    if (direction === "back" && webview.canGoBack()) {
      webview.goBack();
    }
    if (direction === "forward" && webview.canGoForward()) {
      webview.goForward();
    }
  }

  function copyUrl(pane: PaneState) {
    void navigator.clipboard.writeText(pane.url);
  }

  function openExternal(pane: PaneState) {
    window.open(pane.url, "_blank", "noopener,noreferrer");
  }

  function closePane(paneId: string) {
    updatePane(paneId, {
      title: "空白窗格",
      url: ""
    });
  }

  function maximizePane(pane: PaneState) {
    setState((current) => ({
      ...current,
      selectedPaneId: pane.id,
      layout: "one",
      panes: [pane, ...normalizePanes(current.panes).filter((item) => item.id !== pane.id)].map((item, index) => ({
        ...item,
        id: paneOrder[index]
      }))
    }));
  }

  function toggleCategory(category: BookmarkCategory) {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  return (
    <main className={`app-shell ${state.sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Compass size={21} />
          </div>
          <div className="brand-copy">
            <h1>杰瑞的台风工作台</h1>
            <p>Jerry&apos;s Typhoon Workbench</p>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setState((current) => ({ ...current, sidebarCollapsed: !current.sidebarCollapsed }))}
            title={state.sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            <Menu size={17} />
          </button>
        </div>

        {!state.sidebarCollapsed && (
          <div className="sidebar-tools">
            <label className="search-box">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索收藏或网址" />
            </label>
            <button className="import-site-button" onClick={() => setImportDialog({ ...importDialog, open: true })}>
              导入网页
            </button>
          </div>
        )}

        <nav
          className="bookmark-list"
          onWheelCapture={(event) => {
            event.preventDefault();
            event.currentTarget.scrollBy({
              top: event.deltaY,
              left: 0,
              behavior: "auto"
            });
          }}
        >
          {!state.sidebarCollapsed && favoriteBookmarks.length > 0 && (
            <section className="category-block favorites-block">
              <button className="category-title favorite-category" type="button">
                <span>常用收藏</span>
                <small>{favoriteBookmarks.length}</small>
              </button>
              <div className="category-items">
                {favoriteBookmarks.map((bookmark) => (
                  <button
                    className="bookmark-item is-favorite"
                    key={`favorite-${bookmark.id}`}
                    title={bookmark.url}
                    onClick={() => openBookmark(bookmark)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setContextMenu({ bookmark, x: event.clientX, y: event.clientY });
                    }}
                    onDoubleClick={() => toggleFavorite(bookmark.id)}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("application/x-bookmark-id", bookmark.id);
                      event.dataTransfer.effectAllowed = "copy";
                      setDraggingBookmarkId(bookmark.id);
                    }}
                    onDragEnd={() => setDraggingBookmarkId(null)}
                  >
                    <span className="bookmark-name">
                      <Star size={12} fill="currentColor" />
                      {bookmark.title}
                    </span>
                    <span className={`refresh-dot ${bookmark.refreshIntervalMinutes ? "is-live" : ""}`} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {groupedBookmarks.map(({ category, bookmarks }) => (
            <section className="category-block" key={category}>
              <button
                className="category-title"
                onClick={() => {
                  if (state.sidebarCollapsed) {
                    setState((current) => ({ ...current, sidebarCollapsed: false }));
                  } else {
                    toggleCategory(category);
                  }
                }}
                title={category}
              >
                <span>{category}</span>
                <small>{bookmarks.length}</small>
              </button>
              {!state.sidebarCollapsed && expandedCategories.has(category) && (
                <div className="category-items">
                  {bookmarks.map((bookmark) => {
                    const isFavorite = favoriteSet.has(bookmark.id);
                    return (
                    <button
                      className={`bookmark-item ${isFavorite ? "is-favorite" : ""}`}
                      key={bookmark.id}
                      title={bookmark.url}
                      onClick={() => openBookmark(bookmark)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setContextMenu({ bookmark, x: event.clientX, y: event.clientY });
                      }}
                      onDoubleClick={() => toggleFavorite(bookmark.id)}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("application/x-bookmark-id", bookmark.id);
                        event.dataTransfer.effectAllowed = "copy";
                        setDraggingBookmarkId(bookmark.id);
                      }}
                      onDragEnd={() => {
                        setDraggingBookmarkId(null);
                      }}
                    >
                      <span className="bookmark-name">
                        {isFavorite ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
                        {bookmark.title}
                      </span>
                      <span className={`refresh-dot ${bookmark.refresh ? "is-live" : ""}`} />
                    </button>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </nav>
      </aside>

      <section className="workbench">
        <header className="toolbar">
          <div className="toolbar-group workspace-tabs">
            {state.workspaces.map((workspace) => (
              <button
                className={workspace.id === state.workspaceId ? "is-active" : ""}
                key={workspace.id}
                onClick={() => loadWorkspace(workspace)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setWorkspaceMenu({ workspace, x: event.clientX, y: event.clientY });
                }}
              >
                {workspace.name}
              </button>
            ))}
            <button className="add-workspace-button" onClick={createWorkspace} title="添加快捷模式">
              +
            </button>
            <button className="save-workspace-button" onClick={saveCurrentAsWorkspace} title="保存当前布局为快捷模式">
              保存当前
            </button>
          </div>

          <div className="toolbar-group reference-tabs">
            {referenceImages.map((image) => (
              <button key={image.url} onClick={() => setReferenceViewer(image)}>
                {image.title}
              </button>
            ))}
          </div>

          <div className="toolbar-group icon-group" aria-label="布局">
            <button className={state.layout === "one" ? "is-active" : ""} onClick={() => setLayout("one")} title="单屏">
              <Square size={17} />
              <span>1</span>
            </button>
            <button className={state.layout === "two" ? "is-active" : ""} onClick={() => setLayout("two")} title="双屏">
              <PanelLeft size={17} />
              <span>2</span>
            </button>
            <button className={state.layout === "three" ? "is-active" : ""} onClick={() => setLayout("three")} title="三屏：左大右二小">
              <Grid2X2 size={17} />
              <span>3</span>
            </button>
            <button className={state.layout === "four" ? "is-active" : ""} onClick={() => setLayout("four")} title="四屏">
              <Grid2X2 size={17} />
              <span>4</span>
            </button>
          </div>

          <div className="toolbar-group icon-group">
            <button onClick={() => refreshAll()} title="全部刷新">
              <RefreshCcw size={17} />
            </button>
            <button
              className={state.autoRefresh ? "is-active" : ""}
              onClick={() => setState((current) => ({ ...current, autoRefresh: !current.autoRefresh }))}
              title="自动刷新：5 分钟"
            >
              5m
            </button>
          </div>
        </header>

        <section
          className={`pane-grid layout-${state.layout}`}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes("application/x-bookmark-id")) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={(event) => {
            const bookmarkId = event.dataTransfer.getData("application/x-bookmark-id");
            const bookmark = bookmarks.find((item) => item.id === bookmarkId);
            if (bookmark) {
              event.preventDefault();
              setDraggingBookmarkId(null);
              addBookmarkToWorkbench(bookmark);
            }
          }}
        >
          {activePanes.map((pane) => (
            <article
              className={`pane ${pane.id === state.selectedPaneId ? "is-selected" : ""}`}
              key={pane.id}
              onMouseDown={() => setState((current) => ({ ...current, selectedPaneId: pane.id }))}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes("application/x-bookmark-id")) {
                  event.preventDefault();
                  event.stopPropagation();
                  event.dataTransfer.dropEffect = "copy";
                }
              }}
              onDrop={(event) => {
                const bookmarkId = event.dataTransfer.getData("application/x-bookmark-id");
                const bookmark = bookmarks.find((item) => item.id === bookmarkId);
                if (bookmark) {
                  event.preventDefault();
                  event.stopPropagation();
                  setDraggingBookmarkId(null);
                  addBookmarkToWorkbench(bookmark, pane.id);
                }
              }}
            >
              {draggingBookmarkId && (
                <div
                  className="pane-drop-target"
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(event) => {
                    const bookmarkId = event.dataTransfer.getData("application/x-bookmark-id");
                    const bookmark = bookmarks.find((item) => item.id === bookmarkId);
                    if (bookmark) {
                      event.preventDefault();
                      event.stopPropagation();
                      setDraggingBookmarkId(null);
                      addBookmarkToWorkbench(bookmark, pane.id);
                    }
                  }}
                >
                  <span>释放到此窗格</span>
                </div>
              )}
              <div className="pane-bar">
                <div className="pane-title">
                  <PanelLeft size={14} />
                  <span>{pane.title}</span>
                </div>
                <div className="pane-actions">
                  <button onClick={() => navigate(pane.id, "back")} title="后退">
                    <ArrowLeft size={14} />
                  </button>
                  <button onClick={() => navigate(pane.id, "forward")} title="前进">
                    <ArrowRight size={14} />
                  </button>
                  <button onClick={() => refreshPane(pane.id)} title="刷新">
                    <RefreshCcw size={14} />
                  </button>
                  <button disabled={!pane.url} onClick={() => copyUrl(pane)} title="复制链接">
                    <Copy size={14} />
                  </button>
                  <button disabled={!pane.url} onClick={() => openExternal(pane)} title="在外部浏览器打开">
                    <ExternalLink size={14} />
                  </button>
                  <button onClick={() => maximizePane(pane)} title="最大化">
                    <Maximize2 size={14} />
                  </button>
                  <button onClick={() => closePane(pane.id)} title="关闭">
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="pane-content">
                {pane.url ? (
                  <webview
                    className="site-webview"
                    ref={(node) => {
                      if (node) {
                        webviews.current.set(pane.id, node as WebviewElement);
                        node.addEventListener("did-start-loading", () =>
                          setPaneStatuses((current) => ({ ...current, [pane.id]: "loading" }))
                        );
                        node.addEventListener("did-stop-loading", () =>
                          setPaneStatuses((current) => ({ ...current, [pane.id]: "ready" }))
                        );
                        node.addEventListener("did-fail-load", () =>
                          setPaneStatuses((current) => ({ ...current, [pane.id]: "failed" }))
                        );
                      } else {
                        webviews.current.delete(pane.id);
                      }
                    }}
                    src={pane.url}
                    partition="persist:typhoon-workbench"
                    allowpopups={true}
                    webpreferences="contextIsolation=yes"
                  />
                ) : (
                  <div className="empty-pane">
                    <Compass size={30} />
                    <strong>选择左侧收藏打开页面</strong>
                    <span>当前窗格会记住你打开的网站。</span>
                  </div>
                )}
                {pane.url && paneStatuses[pane.id] === "loading" && <div className="pane-status">加载中...</div>}
                {pane.url && paneStatuses[pane.id] === "failed" && (
                  <div className="pane-error">
                    <strong>页面加载失败</strong>
                    <button onClick={() => refreshPane(pane.id)}>重试</button>
                    <button onClick={() => openExternal(pane)}>外部打开</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <footer className="statusbar">
          <span>当前：{state.workspaces.find((workspace) => workspace.id === state.workspaceId)?.name ?? "自定义工作区"}</span>
          <span>布局：{layoutLabel(state.layout)}</span>
          <span>自动刷新：{state.autoRefresh ? "每 5 分钟" : "关闭"}</span>
          <span>最近刷新：{lastRefresh}</span>
        </footer>
      </section>

      {contextMenu && (
        <div
          className="bookmark-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              setRenameDialog({
                bookmark: contextMenu.bookmark,
                value: contextMenu.bookmark.title
              });
              setContextMenu(null);
            }}
          >
            修改名称
          </button>
          <button
            onClick={() => {
              resetBookmarkTitle(contextMenu.bookmark);
              setContextMenu(null);
            }}
          >
            恢复默认名称
          </button>
          <div className="context-menu-label">刷新间隔</div>
          {refreshOptions.map((minutes) => (
            <button
              key={minutes}
              onClick={() => {
                setBookmarkRefreshInterval(contextMenu.bookmark, minutes);
                setContextMenu(null);
              }}
            >
              {minutes === 0 ? "不自动刷新" : `${minutes} 分钟`}
            </button>
          ))}
        </div>
      )}

      {workspaceMenu && (
        <div
          className="bookmark-context-menu"
          style={{ left: workspaceMenu.x, top: workspaceMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              setWorkspaceEditor(workspaceMenu.workspace);
              setWorkspaceMenu(null);
            }}
          >
            编辑快捷模式
          </button>
          <button
            onClick={() => {
              setWorkspaceEditor({ ...workspaceMenu.workspace });
              setWorkspaceMenu(null);
            }}
          >
            重命名
          </button>
          <button
            onClick={() => {
              deleteWorkspace(workspaceMenu.workspace);
              setWorkspaceMenu(null);
            }}
          >
            删除快捷模式
          </button>
        </div>
      )}

      {importDialog.open && (
        <div className="modal-backdrop" onMouseDown={() => setImportDialog({ open: false, title: "", url: "", category: "自定义" })}>
          <form
            className="rename-modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              importBookmark();
            }}
          >
            <h2>导入网页</h2>
            <input
              autoFocus
              value={importDialog.url}
              placeholder="https://example.com"
              onChange={(event) => setImportDialog((current) => ({ ...current, url: event.target.value }))}
            />
            <input
              value={importDialog.title}
              placeholder="名称，可留空"
              onChange={(event) => setImportDialog((current) => ({ ...current, title: event.target.value }))}
            />
            <select
              value={importDialog.category}
              onChange={(event) =>
                setImportDialog((current) => ({ ...current, category: event.target.value as BookmarkCategory }))
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="rename-actions">
              <button type="button" onClick={() => setImportDialog({ open: false, title: "", url: "", category: "自定义" })}>
                取消
              </button>
              <button type="submit">导入</button>
            </div>
          </form>
        </div>
      )}

      {renameDialog && (
        <div className="modal-backdrop" onMouseDown={() => setRenameDialog(null)}>
          <form
            className="rename-modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              renameBookmark(renameDialog.bookmark, renameDialog.value);
              setRenameDialog(null);
            }}
          >
            <h2>修改标签名称</h2>
            <input
              autoFocus
              value={renameDialog.value}
              onChange={(event) =>
                setRenameDialog((current) => (current ? { ...current, value: event.target.value } : current))
              }
            />
            <div className="rename-actions">
              <button type="button" onClick={() => setRenameDialog(null)}>
                取消
              </button>
              <button type="submit">保存</button>
            </div>
          </form>
        </div>
      )}

      {workspaceEditor && (
        <div className="modal-backdrop" onMouseDown={() => setWorkspaceEditor(null)}>
          <form
            className="workspace-modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              saveWorkspace(workspaceEditor);
            }}
          >
            <h2>编辑快捷模式</h2>
            <label>
              <span>名称</span>
              <input
                value={workspaceEditor.name}
                onChange={(event) => setWorkspaceEditor((current) => (current ? { ...current, name: event.target.value } : current))}
              />
            </label>
            <label>
              <span>屏数</span>
              <select
                value={workspaceEditor.layout}
                onChange={(event) => setWorkspaceEditor((current) => (current ? { ...current, layout: event.target.value as LayoutMode } : current))}
              >
                <option value="one">1 屏</option>
                <option value="two">2 屏</option>
                <option value="three">3 屏</option>
                <option value="four">4 屏</option>
              </select>
            </label>
            <div className="workspace-slots">
              {normalizePanes(workspaceEditor.panes)
                .slice(0, layoutSize(workspaceEditor.layout))
                .map((pane, index) => (
                  <label key={pane.id}>
                    <span>窗格 {index + 1}</span>
                    <select
                      value={pane.url}
                      onChange={(event) => {
                        const bookmark = bookmarks.find((item) => item.url === event.target.value);
                        setWorkspaceEditor((current) => {
                          if (!current) {
                            return current;
                          }
                          const panes = normalizePanes(current.panes);
                          panes[index] = bookmark
                            ? { ...panes[index], title: bookmark.title, url: bookmark.url }
                            : { ...panes[index], title: "空白窗格", url: "" };
                          return { ...current, panes };
                        });
                      }}
                    >
                      <option value="">空白</option>
                      {bookmarks.map((bookmark) => (
                        <option key={bookmark.id} value={bookmark.url}>
                          {bookmark.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
            </div>
            <div className="rename-actions">
              <button type="button" onClick={() => setWorkspaceEditor(null)}>
                取消
              </button>
              <button type="submit">保存</button>
            </div>
          </form>
        </div>
      )}

      {referenceViewer && (
        <div className="reference-overlay" onMouseDown={() => setReferenceViewer(null)}>
          <div className="reference-viewer" onMouseDown={(event) => event.stopPropagation()}>
            <div className="reference-header">
              <strong>{referenceViewer.title}</strong>
              <button onClick={() => setReferenceViewer(null)}>关闭</button>
            </div>
            <img src={referenceViewer.url} alt={referenceViewer.title} />
          </div>
        </div>
      )}
    </main>
  );
}

function layoutLabel(layout: LayoutMode) {
  const labels: Record<LayoutMode, string> = {
    one: "单屏",
    two: "双屏",
    three: "三屏",
    four: "四屏"
  };
  return labels[layout];
}

function layoutSize(layout: LayoutMode) {
  const sizes: Record<LayoutMode, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4
  };
  return sizes[layout];
}

function normalizeLayout(layout: unknown): LayoutMode {
  if (layout === "one" || layout === "two" || layout === "three" || layout === "four") {
    return layout;
  }
  if (layout === "single") {
    return "one";
  }
  if (layout === "vertical" || layout === "horizontal") {
    return "two";
  }
  if (layout === "quad") {
    return "four";
  }
  return "one";
}

function normalizePanes(panes: PaneState[] | undefined): PaneState[] {
  const source = Array.isArray(panes) ? panes : [];
  return paneOrder.map((id, index) => {
    const existing = source[index] ?? source.find((pane) => pane.id === id);
    return {
      id,
      title: existing?.title || "空白窗格",
      url: existing?.url || ""
    };
  });
}

function normalizeWorkspaces(workspaces: Workspace[] | undefined): Workspace[] {
  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    return defaultWorkspaces;
  }

  const normalized = workspaces.map((workspace) => ({
    id: workspace.id || `workspace-${Date.now()}`,
    name: workspace.name || "未命名快捷模式",
    layout: normalizeLayout(workspace.layout),
    panes: normalizePanes(workspace.panes)
  }));

  const existingIds = new Set(normalized.map((workspace) => workspace.id));
  const missingDefaults = defaultWorkspaces.filter((workspace) => !existingIds.has(workspace.id));
  return [...normalized, ...missingDefaults];
}

function sizeToLayout(size: number): LayoutMode {
  if (size <= 1) {
    return "one";
  }
  if (size === 2) {
    return "two";
  }
  if (size === 3) {
    return "three";
  }
  return "four";
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
