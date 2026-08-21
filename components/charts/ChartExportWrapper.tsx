"use client";

import { useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import FileSaver from "file-saver";
import { Button } from "@/components/ui/Button";
import { Download, Loader2, ChevronDown } from "lucide-react";
import { useTheme } from "@/components/common/ThemeProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";

export type ExportScale = 1 | 2 | 3;
export type ExportAspectRatio = "horizontal" | "vertical" | "square";

export interface ChartExportHandle {
  exportChart: (scale?: ExportScale, aspectRatio?: ExportAspectRatio) => Promise<Blob | null>;
}

interface ChartExportWrapperProps {
  children: React.ReactNode;
  filename: string;
  title: string;
  description?: string;
  showExportButton?: boolean;
  onExportAll?: (scale: ExportScale, aspectRatio: ExportAspectRatio) => void;
  isExportingAll?: boolean;
}

const EXPORT_DIMENSIONS: Record<ExportAspectRatio, { width: number; height: number }> = {
  horizontal: { width: 1200, height: 675 },
  vertical: { width: 675, height: 1200 },
  square: { width: 1080, height: 1080 },
};

const TITLE_HEIGHT = 60;
const PADDING = 32;

function exportSvgToBlob(
  svgElement: SVGSVGElement,
  title: string,
  aspectRatio: ExportAspectRatio,
  scale: ExportScale,
  backgroundColor: string,
  textColor: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const dimensions = EXPORT_DIMENSIONS[aspectRatio];
    const canvasWidth = dimensions.width * scale;
    const canvasHeight = dimensions.height * scale;

    const chartAreaWidth = dimensions.width - PADDING * 2;
    const chartAreaHeight = dimensions.height - TITLE_HEIGHT - PADDING * 2;

    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

    const originalWidth = svgElement.clientWidth || svgElement.getBoundingClientRect().width;
    const originalHeight = svgElement.clientHeight || svgElement.getBoundingClientRect().height;

    const scaleX = chartAreaWidth / originalWidth;
    const scaleY = chartAreaHeight / originalHeight;
    const fitScale = Math.min(scaleX, scaleY);

    const scaledWidth = originalWidth * fitScale;
    const scaledHeight = originalHeight * fitScale;

    const offsetX = PADDING + (chartAreaWidth - scaledWidth) / 2;
    const offsetY = TITLE_HEIGHT + PADDING + (chartAreaHeight - scaledHeight) / 2;

    const wrapperSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    wrapperSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    wrapperSvg.setAttribute("width", dimensions.width.toString());
    wrapperSvg.setAttribute("height", dimensions.height.toString());
    wrapperSvg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", backgroundColor);
    wrapperSvg.appendChild(bgRect);

    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", PADDING.toString());
    titleText.setAttribute("y", (PADDING + 28).toString());
    titleText.setAttribute("font-size", "24");
    titleText.setAttribute("font-weight", "600");
    titleText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
    titleText.setAttribute("fill", textColor);
    titleText.textContent = title;
    wrapperSvg.appendChild(titleText);

    const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    chartGroup.setAttribute("transform", `translate(${offsetX}, ${offsetY}) scale(${fitScale})`);

    svgClone.removeAttribute("width");
    svgClone.removeAttribute("height");
    svgClone.setAttribute("width", originalWidth.toString());
    svgClone.setAttribute("height", originalHeight.toString());

    while (svgClone.firstChild) {
      chartGroup.appendChild(svgClone.firstChild);
    }

    const defs = svgClone.querySelector("defs");
    if (defs) {
      wrapperSvg.appendChild(defs.cloneNode(true));
    }

    wrapperSvg.appendChild(chartGroup);

    const svgData = new XMLSerializer().serializeToString(wrapperSvg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/png",
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };

    img.src = url;
  });
}

export const ChartExportWrapper = forwardRef<ChartExportHandle, ChartExportWrapperProps>(
  ({ children, filename, title, description, showExportButton = true, onExportAll, isExportingAll = false }, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [selectedScale, setSelectedScale] = useState<ExportScale>(2);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<ExportAspectRatio>("horizontal");
    const { theme } = useTheme();

    const backgroundColor = theme === "dark" ? "#0a0a0a" : "#ffffff";
    const textColor = theme === "dark" ? "#fafafa" : "#0a0a0a";

    const exportChart = useCallback(
      async (
        scale: ExportScale = selectedScale,
        aspectRatio: ExportAspectRatio = selectedAspectRatio
      ): Promise<Blob | null> => {
        if (!chartContainerRef.current) return null;

        const svgElement = chartContainerRef.current.querySelector("svg.recharts-surface");
        if (!svgElement) {
          console.error("SVG element not found");
          return null;
        }

        try {
          const blob = await exportSvgToBlob(
            svgElement as SVGSVGElement,
            title,
            aspectRatio,
            scale,
            backgroundColor,
            textColor
          );
          return blob;
        } catch (error) {
          console.error("Chart export failed:", error);
          return null;
        }
      },
      [selectedScale, selectedAspectRatio, backgroundColor, textColor, title]
    );

    const handleExport = useCallback(async () => {
      setIsModalOpen(false);
      setIsExporting(true);
      try {
        const blob = await exportChart(selectedScale, selectedAspectRatio);
        if (blob) {
          const timestamp = new Date().toISOString().slice(0, 10);
          const ratioSuffix =
            selectedAspectRatio === "horizontal" ? "h" : selectedAspectRatio === "vertical" ? "v" : "sq";
          FileSaver.saveAs(blob, `${filename}-${ratioSuffix}-${timestamp}.png`);
        }
      } finally {
        setIsExporting(false);
      }
    }, [exportChart, filename, selectedScale, selectedAspectRatio]);

    const openExportModal = useCallback(() => {
      setIsModalOpen(true);
    }, []);

    const openBatchExportModal = useCallback(() => {
      setIsBatchModalOpen(true);
    }, []);

    const handleBatchExport = useCallback(() => {
      setIsBatchModalOpen(false);
      onExportAll?.(selectedScale, selectedAspectRatio);
    }, [onExportAll, selectedScale, selectedAspectRatio]);

    useImperativeHandle(ref, () => ({
      exportChart,
    }));

    const isAnyExporting = isExporting || isExportingAll;

    return (
      <div className="chart-export-wrapper">
        <div className="chart-export-header flex items-start justify-between p-4 pb-0 gap-2">
          <div className="min-w-0">
            <h2 className="chart-export-title text-base sm:text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          {showExportButton && (
            <div className="chart-export-button-group flex flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={openExportModal}
                disabled={isAnyExporting}
                className="gap-1 rounded-r-none border-r-0"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="hidden sm:inline">{isExporting ? "저장 중..." : "저장"}</span>
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isAnyExporting} className="px-1.5 rounded-l-none">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[120px]">
                  <DropdownMenuItem onClick={openExportModal} disabled={isAnyExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    이미지 저장
                  </DropdownMenuItem>
                  {onExportAll && (
                    <DropdownMenuItem onClick={openBatchExportModal} disabled={isAnyExporting}>
                      <Download className="h-4 w-4 mr-2" />
                      전체 저장
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div ref={chartContainerRef} className="chart-export-content p-4 pt-2">
          {children}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[340px] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>이미지 저장 옵션</DialogTitle>
            </DialogHeader>
            <div className="export-options-form grid gap-4 py-4">
              <div className="export-option-scale">
                <label className="text-sm font-medium mb-2 block">해상도</label>
                <Select
                  value={selectedScale.toString()}
                  onValueChange={(v) => setSelectedScale(Number(v) as ExportScale)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">표준 (1x)</SelectItem>
                    <SelectItem value="2">고화질 (2x)</SelectItem>
                    <SelectItem value="3">초고화질 (3x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="export-option-aspect-ratio">
                <label className="text-sm font-medium mb-2 block">비율</label>
                <Select
                  value={selectedAspectRatio}
                  onValueChange={(v) => setSelectedAspectRatio(v as ExportAspectRatio)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">가로 (16:9)</SelectItem>
                    <SelectItem value="vertical">세로 (9:16)</SelectItem>
                    <SelectItem value="square">정방 (1:1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
          <DialogContent className="max-w-[340px] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>전체 차트 저장 옵션</DialogTitle>
            </DialogHeader>
            <div className="batch-export-options-form grid gap-4 py-4">
              <div className="batch-export-option-scale">
                <label className="text-sm font-medium mb-2 block">해상도</label>
                <Select
                  value={selectedScale.toString()}
                  onValueChange={(v) => setSelectedScale(Number(v) as ExportScale)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">표준 (1x)</SelectItem>
                    <SelectItem value="2">고화질 (2x)</SelectItem>
                    <SelectItem value="3">초고화질 (3x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="batch-export-option-aspect-ratio">
                <label className="text-sm font-medium mb-2 block">비율</label>
                <Select
                  value={selectedAspectRatio}
                  onValueChange={(v) => setSelectedAspectRatio(v as ExportAspectRatio)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">가로 (16:9)</SelectItem>
                    <SelectItem value="vertical">세로 (9:16)</SelectItem>
                    <SelectItem value="square">정방 (1:1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                4개의 차트(태그별 공개 글, 고유 사용자 조회수, 공개 글 생성 추이, 세션 완료율)를 ZIP 파일로 저장합니다.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBatchModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handleBatchExport} disabled={isExportingAll}>
                {isExportingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    전체 저장
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

ChartExportWrapper.displayName = "ChartExportWrapper";
