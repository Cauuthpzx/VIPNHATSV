import type { StyleValue } from "vue";
import type { TableToolBarType } from "../components/types";
import type { TableDefaultToolbar } from "../typing";

import { useI18n } from "@layui/component/language";
import { isArray, isNumber, isValueArray } from "@layui/component/utils";
import { computed, inject, ref } from "vue";
import { layer } from "@layui/layer-vue";

import { LAY_TABLE_CONTEXT } from "../constant";

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

  // 报表导出
  const exporting = ref(false);

  const exportData = async () => {
    if (exporting.value) return;
    exporting.value = true;

    let loadingId: string | undefined;
    let source: Array<any>;

    if (props.exportAllFn) {
      loadingId = layer.load(0, { shade: [0.3, "#000"] });
      try {
        source = await props.exportAllFn();
      } catch {
        layer.close(loadingId);
        layer.msg("Xuất dữ liệu thất bại", { icon: 2, time: 2000 });
        exporting.value = false;
        return;
      }
      layer.close(loadingId);
    } else {
      source = props.tableDataSource;
    }

    let tableStr = ``;
    for (const tableHeadColumn of props.hierarchicalColumns) {
      tableStr += "<tr>";
      for (const column of tableHeadColumn) {
        if (!column.ignoreExport) {
          // 如果 column.type 等于 checkbox 或 radio 时，该列不导出
          if ((column.type && column.type === "number") || !column.type) {
            tableStr += `<td colspan=${columnsState.setColSpanValue(
              column,
            )} rowspan=${columnsState.setRowSpanValue(column)}>${
              column.title || ""
            }</td>`;
          }
        }
      }
      tableStr += "</tr>";
    }
    const doExport = (rows: Array<any>) => {
      rows.forEach((item, rowIndex) => {
        tableStr += "<tr>";
        props.lastLevelAllColumns.forEach((tableColumn, columnIndex) => {
          if (!tableColumn.ignoreExport) {
            // 如果该列是特殊列，并且类型为 number 时，特殊处理
            if (tableColumn.type && tableColumn.type === "number") {
              tableStr += `<td ss:Type="Number">${rowIndex + 1}</td>`;
            }
            else {
              // 如果不是特殊列，进行字段匹配处理
              if (tableColumn.type === undefined) {
                let columnData;
                Object.keys(item).forEach((name) => {
                  if (tableColumn.key === name) {
                    columnData = item;
                  }
                });
                // 拼接列
                const rowColSpan = props.spanMethod?.(
                  item,
                  tableColumn,
                  rowIndex,
                  columnIndex,
                );
                const rowspan = rowColSpan ? rowColSpan[0] : 1;
                const colspan = rowColSpan ? rowColSpan[1] : 1;

                // 如果 rowspan 和 colspan 是 0 说明该列作为合并列的辅助列。
                // 则不再进行结构拼接。
                if (rowspan !== 0 && colspan !== 0) {
                  const text = columnData ? columnData[tableColumn.key] : "";
                  const xType = tableColumn.exportCellType ?? (isNumber(text) ? "ss:Type='Number'" : "x:str");

                  tableStr += `<td colspan=${colspan} rowspan=${rowspan} ${xType}>${text}</td>`;
                }
              }
            }
          }
        });
        tableStr += "</tr>";
        if (item.children)
          doExport(item.children);
      });
    };
    doExport(source);
    const worksheet = "Sheet1";
    const uri = "data:application/vnd.ms-excel;base64,";
    const exportTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
        <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
            <x:Name>${worksheet}</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
            </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
            <table syle="table-layout: fixed;word-wrap: break-word; word-break: break-all;">${tableStr}</table>
        </body>
    </html>`;

    // Dùng <a download> thay vì window.location.href để không navigate đi
    const blob = new Blob([exportTemplate], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${worksheet}.xls`;
    a.click();
    URL.revokeObjectURL(url);

    layer.msg(`Xuất thành công ${source.length} dòng`, { icon: 1, time: 2000 });
    exporting.value = false;
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
