"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  X,
  BookOpen,
  Check,
  BarChart3,
  TrendingUp,
  Eye,
  Square,
  CheckSquare,
  Globe,
  GlobeLock,
  Search,
  Type,
  ExternalLink,
  FileText,
  Brain,
  Download,
  Loader2,
  CalendarDays,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import type { Post, Series } from "@/lib/types/post";
import { SlugEditModal } from "@/components/modals/SlugEditModal";
import { BulkActionConfirmModal } from "@/components/modals/BulkActionConfirmModal";
import { SocialMediaContentModal } from "@/components/modals/SocialMediaContentModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Highlight } from "@/components/ui/Highlight";
import { useAdminPosts } from "@/hooks/useAdminPosts";
import { useSeries } from "@/hooks/useSeries";
import { useDeletePost } from "@/hooks/usePostMutations";
import { useBulkPostAction } from "@/hooks/useBulkPostMutations";
import { useCreateSeries, useUpdateSeries, useDeleteSeries } from "@/hooks/useSeriesMutations";
import { useDebounce } from "@/hooks/useDebounce";
import type { AdminPostsFilters } from "@/lib/queryKeys";
import { getUtcDateOnly } from "@/lib/analytics/date-range";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { ViewsChart } from "@/components/charts/ViewsChart";
import { CountChart } from "@/components/charts/CountChart";
import { ReadingChart } from "@/components/charts/ReadingChart";
import {
  ChartExportWrapper,
  type ChartExportHandle,
  type ExportScale,
  type ExportAspectRatio,
} from "@/components/charts/ChartExportWrapper";
import { useBatchChartExport } from "@/hooks/useBatchChartExport";
import {
  useCategoryAnalytics,
  useViewsAnalytics,
  useCountAnalytics,
  useReadingAnalytics,
} from "@/hooks/usePostAnalytics";
import { useSnippets, useCreateSnippet, useUpdateSnippet, useDeleteSnippet } from "@/hooks/useSnippets";
import { ShortcutInput } from "@/components/editor/ShortcutInput";
import type { CustomSnippet } from "@/lib/types/snippet";
import { KnowledgePresetsTab } from "@/components/admin/KnowledgePresetsTab";
import { AdminCalendar, type CalendarPost } from "@/components/admin/AdminCalendar";

type BulkAction = "delete" | "publish" | "unpublish";

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-4 w-4"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-4 w-4"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.291 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142l-.126.742a12.833 12.833 0 0 0-2.787-.13c-1.21.07-2.2.415-2.865 1.002-.684.604-1.045 1.411-.99 2.216.05.879.485 1.622 1.229 2.096.682.435 1.569.636 2.488.565 1.248-.096 2.218-.543 2.88-1.329.52-.62.86-1.467.976-2.521a4.525 4.525 0 0 1 1.065.258c1.164.438 1.957 1.217 2.362 2.31.588 1.586.621 4.013-1.569 6.127-1.82 1.755-4.093 2.549-7.156 2.582z" />
  </svg>
);

export default function AdminPostsPage() {
  useUser({ or: "redirect" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["posts", "series", "analytics", "snippets", "knowledge", "calendar", "books"];
  const activeTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "posts";

  const setActiveTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", tab);
      router.replace(`?${params.toString()}`);
    },
    [router]
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [slugEditModalOpen, setSlugEditModalOpen] = useState(false);
  const [postToEditSlug, setPostToEditSlug] = useState<Post | null>(null);

  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [editingSeriesName, setEditingSeriesName] = useState("");
  const [newSeriesName, setNewSeriesName] = useState("");
  const [deleteSeriesDialogOpen, setDeleteSeriesDialogOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<Series | null>(null);

  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("desc");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [analyticsTab, setAnalyticsTab] = useState<"category" | "views" | "count" | "reading">("category");
  const [periodPreset, setPeriodPreset] = useState<"7d" | "30d" | "90d" | "1y" | "all" | "custom">("30d");
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 30);
    return getUtcDateOnly(d);
  });
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>(() => getUtcDateOnly());
  const [analyticsType, setAnalyticsType] = useState<"all" | "LONG" | "SHORT">("all");

  const categoryChartRef = useRef<ChartExportHandle>(null);
  const viewsChartRef = useRef<ChartExportHandle>(null);
  const countChartRef = useRef<ChartExportHandle>(null);
  const readingChartRef = useRef<ChartExportHandle>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const { exportAllChartsAsZip, isExporting: isBatchExporting } = useBatchChartExport();

  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeTabElement = tabsContainerRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeTabElement) {
        const container = tabsContainerRef.current;
        const elementRect = activeTabElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (elementRect.left < containerRect.left || elementRect.right > containerRect.right) {
          activeTabElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }
    }
  }, [activeTab]);

  const handlePeriodPresetChange = useCallback(
    (preset: typeof periodPreset) => {
      setPeriodPreset(preset);
      if (preset === "custom") return;
      const now = new Date();
      let start = new Date();
      switch (preset) {
        case "7d":
          start.setUTCDate(now.getUTCDate() - 6);
          break;
        case "30d":
          start.setUTCDate(now.getUTCDate() - 29);
          break;
        case "90d":
          start.setUTCDate(now.getUTCDate() - 89);
          break;
        case "1y":
          start.setUTCFullYear(now.getUTCFullYear() - 1);
          break;
        case "all":
          start = new Date("2020-01-01T00:00:00.000Z");
          break;
      }
      setAnalyticsStartDate(getUtcDateOnly(start));
      setAnalyticsEndDate(getUtcDateOnly(now));
    },
    []
  );

  const handleExportAllCharts = useCallback(
    (scale: ExportScale, aspectRatio: ExportAspectRatio) => {
      exportAllChartsAsZip(
        [
          { name: "category-chart", ref: categoryChartRef },
          { name: "views-chart", ref: viewsChartRef },
          { name: "count-chart", ref: countChartRef },
          { name: "reading-chart", ref: readingChartRef },
        ],
        scale,
        aspectRatio
      );
    },
    [exportAllChartsAsZip]
  );

  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);

  const [newSnippetName, setNewSnippetName] = useState("");
  const [newSnippetContent, setNewSnippetContent] = useState("");
  const [newSnippetShortcut, setNewSnippetShortcut] = useState("");
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [editingSnippetName, setEditingSnippetName] = useState("");
  const [editingSnippetContent, setEditingSnippetContent] = useState("");
  const [editingSnippetShortcut, setEditingSnippetShortcut] = useState("");
  const [deleteSnippetDialogOpen, setDeleteSnippetDialogOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<CustomSnippet | null>(null);

  const [snsModalOpen, setSnsModalOpen] = useState(false);
  const [snsModalPost, setSnsModalPost] = useState<Post | null>(null);
  const [snsModalPlatform, setSnsModalPlatform] = useState<"linkedin" | "threads">("linkedin");

  const filters: AdminPostsFilters = useMemo(
    () => ({
      tag: selectedTag !== "all" ? selectedTag : undefined,
      type: selectedType !== "all" ? selectedType : undefined,
      sortBy,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: debouncedSearch || undefined,
    }),
    [selectedTag, selectedType, sortBy, startDate, endDate, debouncedSearch]
  );

  const { data: postsData, isLoading: isLoadingPosts } = useAdminPosts({ filters });
  const { data: seriesList = [], isLoading: isLoadingSeries } = useSeries({
    enabled: activeTab === "series",
  });

  const analyticsOptions = {
    startDate: analyticsStartDate,
    endDate: analyticsEndDate,
    type: analyticsType,
    enabled: activeTab === "analytics",
  };

  const { data: categoryData = [], isLoading: isLoadingCategory, isError: isErrorCategory } =
    useCategoryAnalytics(analyticsOptions);
  const { data: viewsData = [], isLoading: isLoadingViews, isError: isErrorViews } = useViewsAnalytics(analyticsOptions);
  const { data: countData = [], isLoading: isLoadingCount, isError: isErrorCount } = useCountAnalytics(analyticsOptions);
  const { data: readingData = [], isLoading: isLoadingReading, isError: isErrorReading } =
    useReadingAnalytics(analyticsOptions);

  const { data: snippets = [], isLoading: isLoadingSnippets } = useSnippets();
  const createSnippetMutation = useCreateSnippet();
  const updateSnippetMutation = useUpdateSnippet();
  const deleteSnippetMutation = useDeleteSnippet();

  const deletePostMutation = useDeletePost();
  const bulkActionMutation = useBulkPostAction({
    onSuccess: () => {
      setSelectedPostIds(new Set());
      setBulkActionDialogOpen(false);
      setBulkAction(null);
    },
  });
  const createSeriesMutation = useCreateSeries();
  const updateSeriesMutation = useUpdateSeries();
  const deleteSeriesMutation = useDeleteSeries();

  const posts = useMemo(() => postsData?.posts ?? [], [postsData?.posts]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => {
      post.tags.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [posts]);

  const selectedPosts = useMemo(() => posts.filter((post) => selectedPostIds.has(post.id)), [posts, selectedPostIds]);

  const isAllSelected = posts.length > 0 && selectedPostIds.size === posts.length;
  const isSomeSelected = selectedPostIds.size > 0;

  const handleToggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(new Set(posts.map((post) => post.id)));
    }
  }, [isAllSelected, posts]);

  const handleTogglePost = useCallback((postId: string) => {
    setSelectedPostIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  }, []);

  const handleBulkActionClick = useCallback((action: BulkAction) => {
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  }, []);

  const handleBulkActionConfirm = useCallback(() => {
    if (!bulkAction || selectedPostIds.size === 0) return;
    bulkActionMutation.mutate({
      action: bulkAction,
      postIds: Array.from(selectedPostIds),
    });
  }, [bulkAction, selectedPostIds, bulkActionMutation]);

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleSlugEditClick = (post: Post) => {
    setPostToEditSlug(post);
    setSlugEditModalOpen(true);
  };

  const handleResetFilters = () => {
    setSelectedTag("all");
    setSelectedType("all");
    setSortBy("desc");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      await deletePostMutation.mutateAsync(postToDelete.id);
      toast.success("글이 삭제되었습니다.");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      router.refresh();
    } catch {
      toast.error("글 삭제 중 오류가 발생했습니다.");
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleAddSeries = async () => {
    if (!newSeriesName.trim()) return;

    try {
      const slug = newSeriesName
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/^-|-$/g, "");

      await createSeriesMutation.mutateAsync({ name: newSeriesName, slug });
      toast.success("시리즈가 생성되었습니다.");
      setNewSeriesName("");
    } catch {
      toast.error("시리즈 생성에 실패했습니다.");
    }
  };

  const handleUpdateSeries = async (id: string) => {
    if (!editingSeriesName.trim()) return;

    try {
      const slug = editingSeriesName
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/^-|-$/g, "");

      await updateSeriesMutation.mutateAsync({ id, name: editingSeriesName, slug });
      toast.success("시리즈가 수정되었습니다.");
      setEditingSeriesId(null);
      setEditingSeriesName("");
    } catch {
      toast.error("시리즈 수정에 실패했습니다.");
    }
  };

  const handleDeleteSeriesClick = (series: Series) => {
    setSeriesToDelete(series);
    setDeleteSeriesDialogOpen(true);
  };

  const handleDeleteSeriesConfirm = async () => {
    if (!seriesToDelete) return;

    try {
      await deleteSeriesMutation.mutateAsync(seriesToDelete.id);
      toast.success("시리즈가 삭제되었습니다.");
      setDeleteSeriesDialogOpen(false);
      setSeriesToDelete(null);
    } catch {
      toast.error("시리즈 삭제에 실패했습니다.");
    }
  };

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnippetName.trim() || !newSnippetContent.trim()) return;

    try {
      await createSnippetMutation.mutateAsync({
        name: newSnippetName.trim(),
        content: newSnippetContent.trim(),
        shortcut: newSnippetShortcut.trim() || null,
      });
      toast.success("스니펫이 추가되었습니다.");
      setNewSnippetName("");
      setNewSnippetContent("");
      setNewSnippetShortcut("");
    } catch {
      toast.error("스니펫 추가에 실패했습니다.");
    }
  };

  const handleStartEditSnippet = (snippet: CustomSnippet) => {
    setEditingSnippetId(snippet.id);
    setEditingSnippetName(snippet.name);
    setEditingSnippetContent(snippet.content);
    setEditingSnippetShortcut(snippet.shortcut || "");
  };

  const handleCancelEditSnippet = () => {
    setEditingSnippetId(null);
    setEditingSnippetName("");
    setEditingSnippetContent("");
    setEditingSnippetShortcut("");
  };

  const handleUpdateSnippet = async (id: string) => {
    if (!editingSnippetName.trim() || !editingSnippetContent.trim()) return;

    try {
      await updateSnippetMutation.mutateAsync({
        id,
        data: {
          name: editingSnippetName.trim(),
          content: editingSnippetContent.trim(),
          shortcut: editingSnippetShortcut.trim() || null,
        },
      });
      toast.success("스니펫이 수정되었습니다.");
      handleCancelEditSnippet();
    } catch {
      toast.error("스니펫 수정에 실패했습니다.");
    }
  };

  const handleDeleteSnippetClick = (snippet: CustomSnippet) => {
    setSnippetToDelete(snippet);
    setDeleteSnippetDialogOpen(true);
  };

  const handleDeleteSnippetConfirm = async () => {
    if (!snippetToDelete) return;

    try {
      await deleteSnippetMutation.mutateAsync(snippetToDelete.id);
      toast.success("스니펫이 삭제되었습니다.");
      setDeleteSnippetDialogOpen(false);
      setSnippetToDelete(null);
    } catch {
      toast.error("스니펫 삭제에 실패했습니다.");
    }
  };

  const handleOpenSnsModal = (post: Post, platform: "linkedin" | "threads") => {
    setSnsModalPost(post);
    setSnsModalPlatform(platform);
    setSnsModalOpen(true);
  };

  return (
    <div className="admin-posts-page min-h-screen bg-background">
      <header className="admin-header sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              나가기
            </Button>
            <h1 className="text-lg font-semibold">관리</h1>
          </div>
          <Button variant="default" size="sm" onClick={() => router.push("/admin/write")} className="gap-2">
            <Plus className="h-4 w-4" />새 글 작성
          </Button>
        </div>
      </header>

      <div className="admin-tabs border-b border-border overflow-x-auto" ref={tabsContainerRef}>
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-12 bg-transparent border-0 p-0 flex-nowrap w-max min-w-full">
              <TabsTrigger
                value="posts"
                data-tab="posts"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                글 관리
              </TabsTrigger>
              <TabsTrigger
                value="series"
                data-tab="series"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                시리즈 관리
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                data-tab="analytics"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                분석
              </TabsTrigger>
              <TabsTrigger
                value="snippets"
                data-tab="snippets"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <Type className="h-4 w-4 mr-2" />
                스니펫
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                data-tab="knowledge"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <Brain className="h-4 w-4 mr-2" />
                사전 지식
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                data-tab="calendar"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                캘린더
              </TabsTrigger>
              <TabsTrigger
                value="books"
                data-tab="books"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
                onClick={() => router.push("/admin/books")}
              >
                <BookOpen className="h-4 w-4 mr-2" />책 관리
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === "posts" && (
        <>
          <div className="posts-filters border-b border-border bg-muted/30">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-[2] min-w-[250px]">
                  <label className="text-sm font-medium mb-2 block">검색</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="제목, 태그, 시리즈, 날짜(YYYY-MM-DD)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">태그</label>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="모든 태그" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 태그</SelectItem>
                      {availableTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">유형</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="모든 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 유형</SelectItem>
                      <SelectItem value="LONG">Long</SelectItem>
                      <SelectItem value="SHORT">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">정렬</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">최신순</SelectItem>
                      <SelectItem value="asc">오래된순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">시작일</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">종료일</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    초기화
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {isSomeSelected && (
            <div className="bulk-action-toolbar border-b border-border bg-primary/5">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleAll}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label={isAllSelected ? "전체 선택 해제" : "전체 선택"}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <span className="text-sm font-medium">{selectedPostIds.size}개 선택됨</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkActionClick("publish")}
                      className="gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      공개
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkActionClick("unpublish")}
                      className="gap-2"
                    >
                      <GlobeLock className="h-4 w-4" />
                      비공개
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkActionClick("delete")}
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPostIds(new Set())}>
                    선택 해제
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="posts-content container mx-auto px-4 py-8">
            {isLoadingPosts ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">작성된 글이 없습니다.</p>
                <Button onClick={() => router.push("/admin/write")}>첫 글 작성하기</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className={`post-card border rounded-lg p-4 sm:p-6 transition-colors ${
                      selectedPostIds.has(post.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="post-card-checkbox-wrapper flex gap-3 items-start">
                        <button
                          onClick={() => handleTogglePost(post.id)}
                          className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0 mt-0.5"
                          aria-label={selectedPostIds.has(post.id) ? "선택 해제" : "선택"}
                        >
                          {selectedPostIds.has(post.id) ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="post-card-content flex-1 min-w-0">
                          <div className="post-card-header flex flex-wrap items-center gap-2 mb-2">
                            <h2 className="text-lg sm:text-xl font-semibold truncate max-w-full">
                              <Highlight text={post.title} query={debouncedSearch} />
                            </h2>
                            {post.type === "SHORT" && (
                              <span className="px-2 py-0.5 text-xs bg-violet-500/10 text-violet-500 rounded">
                                Short
                              </span>
                            )}
                            {!post.published && (
                              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">비공개</span>
                            )}
                          </div>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                          )}
                          <div className="post-card-meta flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                            <span>{formatDate(post.createdAt)}</span>
                            <span className="px-2 py-0.5 bg-muted rounded whitespace-nowrap">
                              오늘 고유 사용자 조회 {post.dailyViews || 0} / 누적 고유 사용자 조회 {post.totalViews || 0}
                            </span>
                            {post.type === "LONG" && post.completionRate !== null && (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded whitespace-nowrap">
                                세션 완료율 {post.completionRate}% ({post.readingSessions}개 세션 레코드)
                              </span>
                            )}
                          </div>
                          <div className="post-card-slugs flex flex-wrap items-center gap-2 mt-2 text-xs">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded font-mono">
                              /{post.slug}
                            </span>
                            {post.subSlug && (
                              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded font-mono">
                                /{post.subSlug}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSlugEditClick(post);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                              <span className="text-xs">변경</span>
                            </Button>
                          </div>
                          {post.tags.length > 0 && (
                            <div className="post-card-tags flex flex-wrap gap-1.5 mt-2">
                              {post.tags.map((tag, index) => (
                                <span key={index} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {post.type === "SHORT" && (post.linkedinUrl || post.threadsUrl) && (
                            <div className="post-card-sns flex items-center gap-2 mt-2">
                              {post.linkedinUrl && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-muted-foreground hover:text-[#0A66C2] transition-colors">
                                      <LinkedInIcon />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem asChild>
                                      <a
                                        href={post.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        포스트 보러가기
                                      </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenSnsModal(post, "linkedin")}
                                      className="flex items-center gap-2"
                                    >
                                      <FileText className="h-4 w-4" />
                                      콘텐츠 확인하기
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              {post.threadsUrl && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                                      <ThreadsIcon />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem asChild>
                                      <a
                                        href={post.threadsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        포스트 보러가기
                                      </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenSnsModal(post, "threads")}
                                      className="flex items-center gap-2"
                                    >
                                      <FileText className="h-4 w-4" />
                                      콘텐츠 확인하기
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="post-card-actions flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/posts/${post.slug}`)}>
                          보기
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/write?id=${post.id}`)}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(post)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "series" && (
        <div className="series-content container mx-auto px-4 py-8">
          <div className="add-series-form flex gap-2 mb-8">
            <Input
              placeholder="새 시리즈 이름"
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSeries()}
              className="max-w-sm"
            />
            <Button onClick={handleAddSeries} disabled={createSeriesMutation.isPending || !newSeriesName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </div>

          {isLoadingSeries ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : seriesList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">등록된 시리즈가 없습니다.</p>
            </div>
          ) : (
            <div className="series-list space-y-4">
              {seriesList.map((series) => (
                <div
                  key={series.id}
                  className="series-item border border-border rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  {editingSeriesId === series.id ? (
                    <div className="edit-form flex-1 flex items-center gap-2">
                      <Input
                        value={editingSeriesName}
                        onChange={(e) => setEditingSeriesName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateSeries(series.id)}
                        className="max-w-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateSeries(series.id)}
                        disabled={updateSeriesMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSeriesId(null);
                          setEditingSeriesName("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="series-info flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-emerald-500" />
                        <div>
                          <h3 className="font-medium">{series.name}</h3>
                          <p className="text-sm text-muted-foreground">{series._count?.posts ?? 0}개의 포스트</p>
                        </div>
                      </div>
                      <div className="series-actions flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSeriesId(series.id);
                            setEditingSeriesName(series.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSeriesClick(series)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="analytics-content container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="analytics-filters border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">기간</label>
                <Select value={periodPreset} onValueChange={(v) => handlePeriodPresetChange(v as typeof periodPreset)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">최근 7일</SelectItem>
                    <SelectItem value="30d">최근 30일</SelectItem>
                    <SelectItem value="90d">최근 3개월</SelectItem>
                    <SelectItem value="1y">최근 1년</SelectItem>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="custom">사용자 정의</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">글 유형</label>
                <Select value={analyticsType} onValueChange={(v) => setAnalyticsType(v as typeof analyticsType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="LONG">Long</SelectItem>
                    <SelectItem value="SHORT">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {periodPreset === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">시작일</label>
                  <Input
                    type="date"
                    value={analyticsStartDate}
                    onChange={(e) => setAnalyticsStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">종료일</label>
                  <Input type="date" value={analyticsEndDate} onChange={(e) => setAnalyticsEndDate(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="analytics-tab-navigation flex flex-wrap gap-2 mb-4 sm:mb-6">
            <Button
              variant={analyticsTab === "category" ? "default" : "outline"}
              size="sm"
              onClick={() => setAnalyticsTab("category")}
              className="gap-1.5"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">카테고리별</span>
              <span className="sm:hidden">카테고리</span>
            </Button>
            <Button
              variant={analyticsTab === "views" ? "default" : "outline"}
              size="sm"
              onClick={() => setAnalyticsTab("views")}
              className="gap-1.5"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">고유 사용자 조회 TOP</span>
              <span className="sm:hidden">고유 사용자 조회</span>
            </Button>
            <Button
              variant={analyticsTab === "count" ? "default" : "outline"}
              size="sm"
              onClick={() => setAnalyticsTab("count")}
              className="gap-1.5"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">공개 글 생성 추이</span>
              <span className="sm:hidden">생성 추이</span>
            </Button>
            <Button
              variant={analyticsTab === "reading" ? "default" : "outline"}
              size="sm"
              onClick={() => setAnalyticsTab("reading")}
              className="gap-1.5"
            >
              <BookOpen className="h-4 w-4" />
              세션 완료율
            </Button>
          </div>

          <div className="analytics-chart-display border border-border rounded-lg overflow-hidden mb-4 sm:mb-6">
            {analyticsTab === "category" && (
              <ChartExportWrapper
                ref={categoryChartRef}
                filename="byungskerlog-category"
                title="태그별 공개 글 수"
                description="Post.createdAt 기준 선택한 작성일 기간의 공개 글 인벤토리"
                onExportAll={handleExportAllCharts}
                isExportingAll={isBatchExporting}
              >
                <CategoryChart data={categoryData} isLoading={isLoadingCategory} isError={isErrorCategory} />
              </ChartExportWrapper>
            )}
            {analyticsTab === "views" && (
              <ChartExportWrapper
                ref={viewsChartRef}
                filename="byungskerlog-views"
                title="고유 사용자 조회 TOP 10"
                description="PostView.viewedAt 기간 내 visitorId distinct 조회 수; 쿠키가 없는 기존 기록은 IP 호환 키를 사용"
                onExportAll={handleExportAllCharts}
                isExportingAll={isBatchExporting}
              >
                <ViewsChart data={viewsData} isLoading={isLoadingViews} isError={isErrorViews} />
              </ChartExportWrapper>
            )}
            {analyticsTab === "count" && (
              <ChartExportWrapper
                ref={countChartRef}
                filename="byungskerlog-count"
                title="기간별 공개 글 생성 추이"
                description="Post.createdAt 기준 선택한 작성일 기간의 공개 글 생성 수"
                onExportAll={handleExportAllCharts}
                isExportingAll={isBatchExporting}
              >
                <CountChart data={countData} isLoading={isLoadingCount} isError={isErrorCount} />
              </ChartExportWrapper>
            )}
            {analyticsTab === "reading" && (
              <ChartExportWrapper
                ref={readingChartRef}
                filename="byungskerlog-reading"
                title="세션 완료율 TOP 10 (Long 공개 글)"
                description="ReadingSession.createdAt 기준 세션 레코드 집계; 사람 수·기간별 읽기 시간 아님"
                onExportAll={handleExportAllCharts}
                isExportingAll={isBatchExporting}
              >
                <ReadingChart data={readingData} isLoading={isLoadingReading} isError={isErrorReading} />
              </ChartExportWrapper>
            )}
          </div>

          <section className="analytics-summary">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">현재 목록 페이지 요약</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="stat-card p-3 sm:p-4 border border-border rounded-lg text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">{posts.filter((p) => p.published).length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">현재 페이지 공개 글</p>
              </div>
              <div className="stat-card p-3 sm:p-4 border border-border rounded-lg text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {posts.filter((p) => !p.published).length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">현재 페이지 비공개 글</p>
              </div>
              <div className="stat-card p-3 sm:p-4 border border-border rounded-lg text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {posts.reduce((sum, p) => sum + (p.totalViews || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">현재 페이지 누적 고유 사용자 조회</p>
              </div>
              <div className="stat-card p-3 sm:p-4 border border-border rounded-lg text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {posts.reduce((sum, p) => sum + (p.dailyViews || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">현재 페이지 오늘 고유 사용자 조회</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "snippets" && (
        <div className="snippets-content container mx-auto px-4 py-8 max-w-2xl">
          <div className="mobile-notice md:hidden mb-6 p-4 border border-border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">추가 및 수정은 데스크탑에서 진행해주세요.</p>
          </div>

          <form
            onSubmit={handleCreateSnippet}
            className="add-snippet-form hidden md:block mb-8 p-4 border border-border rounded-lg"
          >
            <h2 className="text-sm font-semibold mb-4">새 스니펫 추가</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <Input
                placeholder="이름 (예: 구분선)"
                value={newSnippetName}
                onChange={(e) => setNewSnippetName(e.target.value)}
              />
              <Input
                placeholder="내용 (예: ---)"
                value={newSnippetContent}
                onChange={(e) => setNewSnippetContent(e.target.value)}
                className="font-mono"
              />
              <ShortcutInput
                value={newSnippetShortcut}
                onChange={setNewSnippetShortcut}
                placeholder="클릭 후 단축키 입력"
              />
            </div>
            <Button
              type="submit"
              disabled={createSnippetMutation.isPending || !newSnippetName.trim() || !newSnippetContent.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </form>

          {isLoadingSnippets ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : snippets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">등록된 스니펫이 없습니다.</p>
            </div>
          ) : (
            <div className="snippets-list space-y-3">
              {snippets.map((snippet) => (
                <div key={snippet.id} className="snippet-item border border-border rounded-lg p-4">
                  {editingSnippetId === snippet.id ? (
                    <div className="edit-form space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          value={editingSnippetName}
                          onChange={(e) => setEditingSnippetName(e.target.value)}
                          placeholder="이름"
                          autoFocus
                        />
                        <Input
                          value={editingSnippetContent}
                          onChange={(e) => setEditingSnippetContent(e.target.value)}
                          placeholder="내용"
                          className="font-mono"
                        />
                        <ShortcutInput
                          value={editingSnippetShortcut}
                          onChange={setEditingSnippetShortcut}
                          placeholder="클릭 후 단축키 입력"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateSnippet(snippet.id)}
                          disabled={updateSnippetMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          저장
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEditSnippet}>
                          <X className="h-4 w-4 mr-1" />
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="snippet-info flex items-center gap-4">
                        <span className="text-2xl font-mono bg-muted px-3 py-1 rounded">{snippet.content}</span>
                        <div>
                          <p className="font-medium">{snippet.name}</p>
                          {snippet.shortcut && (
                            <p className="text-xs text-muted-foreground">단축키: {snippet.shortcut}</p>
                          )}
                        </div>
                      </div>
                      <div className="snippet-actions flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEditSnippet(snippet)}
                          className="hidden md:flex"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSnippetClick(snippet)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "knowledge" && <KnowledgePresetsTab />}

      {activeTab === "calendar" && (
        <div className="calendar-content container mx-auto px-4 py-8">
          {isLoadingPosts ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : (
            <AdminCalendar
              posts={posts.map(
                (post): CalendarPost => ({
                  id: post.id,
                  title: post.title,
                  slug: post.slug,
                  type: (post.type ?? "LONG") as "LONG" | "SHORT",
                  published: post.published ?? false,
                  createdAt: typeof post.createdAt === "string" ? post.createdAt : post.createdAt.toISOString(),
                })
              )}
              onPostClick={(post) => router.push(`/admin/write?id=${post.id}`)}
            />
          )}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{postToDelete?.title}&rdquo; 글이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePostMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletePostMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePostMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteSeriesDialogOpen} onOpenChange={setDeleteSeriesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시리즈를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{seriesToDelete?.name}&rdquo; 시리즈가 삭제됩니다. 해당 시리즈에 속한 포스트는 삭제되지 않고
              무분류로 변경됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSeriesMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeriesConfirm}
              disabled={deleteSeriesMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSeriesMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteSnippetDialogOpen} onOpenChange={setDeleteSnippetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>스니펫을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{snippetToDelete?.name}&rdquo; 스니펫이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSnippetMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSnippetConfirm}
              disabled={deleteSnippetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSnippetMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {postToEditSlug && (
        <SlugEditModal
          open={slugEditModalOpen}
          onOpenChange={setSlugEditModalOpen}
          postId={postToEditSlug.id}
          currentSlug={postToEditSlug.slug}
          currentSubSlug={postToEditSlug.subSlug || null}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      <BulkActionConfirmModal
        open={bulkActionDialogOpen}
        onOpenChange={setBulkActionDialogOpen}
        action={bulkAction}
        selectedPosts={selectedPosts}
        onConfirm={handleBulkActionConfirm}
        isPending={bulkActionMutation.isPending}
      />

      {snsModalPost && (
        <SocialMediaContentModal
          open={snsModalOpen}
          onOpenChange={setSnsModalOpen}
          postId={snsModalPost.id}
          platform={snsModalPlatform}
          linkedinContent={snsModalPost.linkedinContent}
          threadsContent={snsModalPost.threadsContent}
          linkedinUrl={snsModalPost.linkedinUrl}
          threadsUrl={snsModalPost.threadsUrl}
        />
      )}
    </div>
  );
}
