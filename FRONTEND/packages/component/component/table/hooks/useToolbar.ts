import type { StyleValue } from "vue";
import type { TableToolBarType } from "../components/types";
import type { TableDefaultToolbar } from "../typing";

import { useI18n } from "@layui/component/language";
import { isArray, isValueArray } from "@layui/component/utils";
import { computed, inject, ref } from "vue";
import { layer } from "@layui/layer-vue";

import { LAY_TABLE_CONTEXT } from "../constant";
import { exportToXlsx } from "./useExcelExport";

export function useToolBar(props: TableToolBarType) {
  const { columnsState } = inject(LAY_TABLE_CONTEXT)!;

  const { t } = useI18n();

  const showToolbars = computed<TableDefaultToolbar[]>(() => {
    if (
      !props.defaultToolbar
      || (isArray(props.defaultToolbar) && props.defaultToolbar.length === 0)
    ) {
      return [];
    }

    if (isValueArray(props.defaultToolbar)) {
      return props.defaultToolbar;
    }

    return ["filter", "export", "print"];
  });

  const toolbarStyle = (toolbarName: TableDefaultToolbar) => {
    if (isValueArray(showToolbars.value)) {
      return { order: showToolbars.value.indexOf(toolbarName) } as StyleValue;
    }
  };

  // 报表导出 (XLSX with ExcelJS)
  const exporting = ref(false);

  const exportData = async () => {
    if (exporting.value) return;
    exporting.value = true;

    let source: Array<any>;

    if (props.exportAllFn) {
      try {
        source = await props.exportAllFn();
      } catch (err: any) {
        // EXPORT_CANCELLED = user đóng dialog chọn nguồn → im lặng
        if (err?.message === "EXPORT_CANCELLED") {
          exporting.value = false;
          return;
        }
        layer.msg("Xuất dữ liệu thất bại", { icon: 2, time: 2000 });
        exporting.value = false;
        return;
      }
    } else {
      source = props.tableDataSource;
    }

    try {
      await exportToXlsx(
        props.hierarchicalColumns,
        props.lastLevelAllColumns,
        source,
        {
          fileName: props.exportFileName || "Sheet1",
          getColSpan: (col: any) => columnsState.setColSpanValue(col),
          getRowSpan: (col: any) => columnsState.setRowSpanValue(col),
          spanMethod: props.spanMethod as any,
        },
      );
      layer.msg(`Xuất thành công ${source.length} dòng`, { icon: 1, time: 2000 });
    } catch (e) {
      console.error("Export XLSX error:", e);
      layer.msg("Xuất dữ liệu thất bại", { icon: 2, time: 2000 });
    } finally {
      exporting.value = false;
    }
  };

  const print = () => {
    const subOutputRankPrint = props.tableRef!;
    const newContent = subOutputRankPrint.innerHTML;
    const oldContent = document.body.innerHTML;
    document.body.innerHTML = newContent;
    window.print();
    window.location.reload();
    document.body.innerHTML = oldContent;
  };

  return {
    t,
    showToolbars,
    toolbarStyle,
    exportData,
    print,
  };
}
