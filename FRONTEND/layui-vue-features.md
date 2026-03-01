# Layui-Vue — Danh sách tính năng đầy đủ

> Tổng hợp toàn bộ **100+ component** của thư viện Layui-Vue (monorepo local tại `packages/`).
> Mỗi mục ghi rõ: tên component, tag HTML, mô tả tính năng, props chính, và đường dẫn file nguồn.

---

## 1. Bố cục & Lưới (Layout & Grid)

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 1 | LayLayout | `<lay-layout>` | Khung bố cục trang, tự nhận diện chiều dọc khi có Header/Footer | `packages/component/component/layout/index.vue` |
| 2 | LayHeader | `<lay-header>` | Vùng header trên cùng của layout | `packages/component/component/header/index.vue` |
| 3 | LayBody | `<lay-body>` | Vùng nội dung chính | `packages/component/component/body/index.vue` |
| 4 | LaySide | `<lay-side>` | Sidebar bên trái/phải, tuỳ chỉnh width | `packages/component/component/side/index.vue` |
| 5 | LayFooter | `<lay-footer>` | Vùng footer cuối trang | `packages/component/component/footer/index.vue` |
| 6 | LayContainer | `<lay-container>` | Container cố định hoặc full-width (`fluid`) | `packages/component/component/container/index.vue` |
| 7 | LayRow | `<lay-row>` | Hàng trong hệ thống lưới 12 cột, tuỳ chỉnh khoảng cách (`space`) | `packages/component/component/row/index.vue` |
| 8 | LayCol | `<lay-col>` | Cột responsive: `xs, sm, md, lg` + offset/push/pull | `packages/component/component/col/index.vue` |

---

## 2. Điều hướng (Navigation)

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 9 | LayMenu | `<lay-menu>` | Menu điều hướng: chế độ cây, thu gọn, theme sáng/tối, nhiều cấp | `packages/component/component/menu/index.vue` |
| 10 | LayMenuItem | `<lay-menu-item>` | Mục menu đơn lẻ | `packages/component/component/menuItem/index.vue` |
| 11 | LaySubMenu | `<lay-sub-menu>` | Nhóm menu con có thể thu gọn/mở rộng | `packages/component/component/subMenu/index.vue` |
| 12 | LayBreadcrumb | `<lay-breadcrumb>` | Thanh breadcrumb (đường dẫn trang) | `packages/component/component/breadcrumb/index.vue` |
| 13 | LayBreadcrumbItem | `<lay-breadcrumb-item>` | Mục đơn trong breadcrumb | `packages/component/component/breadcrumbItem/index.vue` |
| 14 | LayTab | `<lay-tab>` | Tab chuyển đổi: đóng tab, vị trí trên/dưới/trái/phải, hiệu ứng thanh trượt | `packages/component/component/tab/index.vue` |
| 15 | LayTabItem | `<lay-tab-item>` | Panel tab đơn lẻ | `packages/component/component/tabItem/index.vue` |
| 16 | LayDropdown | `<lay-dropdown>` | Dropdown đa năng: trigger click/hover/focus/contextMenu, tự căn vị trí | `packages/component/component/dropdown/index.vue` |
| 17 | LayDropdownMenu | `<lay-dropdown-menu>` | Container menu trong Dropdown | `packages/component/component/dropdownMenu/index.vue` |
| 18 | LayDropdownMenuItem | `<lay-dropdown-menu-item>` | Mục menu trong Dropdown | `packages/component/component/dropdownMenuItem/index.vue` |
| 19 | LayDropdownSubMenu | `<lay-dropdown-sub-menu>` | Menu con lồng trong Dropdown | `packages/component/component/dropdownSubMenu/index.vue` |
| 20 | LayPageHeader | `<lay-page-header>` | Header trang với nút quay lại, tiêu đề, nội dung | `packages/component/component/pageHeader/index.vue` |

---

## 3. Thành phần cơ bản (Basic)

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 21 | LayButton | `<lay-button>` | Nút bấm: type (primary/warm/danger), size, icon, loading, border style | `packages/component/component/button/index.vue` |
| 22 | LayButtonGroup | `<lay-button-group>` | Nhóm nút gộp viền liền nhau | `packages/component/component/buttonGroup/index.vue` |
| 23 | LayButtonContainer | `<lay-button-container>` | Container căn chỉnh bố cục nhóm nút | `packages/component/component/buttonContainer/index.vue` |
| 24 | LayIcon | `<lay-icon>` | Hiển thị icon layui (`layui-icon-*`) | `packages/component/component/icon/index.ts` |
| 25 | LayTag | `<lay-tag>` | Nhãn/badge: màu, đóng được, hình dạng vuông/tròn, variant sáng/tối | `packages/component/component/tag/index.vue` |
| 26 | LayBadge | `<lay-badge>` | Huy hiệu số/dấu chấm overlay trên element con | `packages/component/component/badge/index.vue` |
| 27 | LayAvatar | `<lay-avatar>` | Avatar: ảnh, text, icon, tuỳ chỉnh size và bo tròn | `packages/component/component/avatar/index.vue` |
| 28 | LayAvatarList | `<lay-avatar-list>` | Nhóm avatar xếp chồng | `packages/component/component/avatarList/index.vue` |
| 29 | LayLogo | `<lay-logo>` | Container logo sidebar | `packages/component/component/logo/index.vue` |

---

## 4. Hiển thị dữ liệu (Data Display)

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 30 | LayTable | `<lay-table>` | Bảng dữ liệu đầy đủ tính năng: cột cố định, sắp xếp, phân trang, chọn dòng/ô, mở rộng dòng, dữ liệu cây, cuộn ảo, thay đổi kích cỡ cột, xuất file, in, toolbar | `packages/component/component/table/index.vue` |
| 31 | LayPage | `<lay-page>` | Phân trang: tuỳ chỉnh layout (count, prev, page, limits, next, refresh, skip) | `packages/component/component/page/index.vue` |
| 32 | LayTree | `<lay-tree>` | Cây phân cấp: lazy load, checkbox, tìm kiếm, accordion, kéo thả, đường nối | `packages/component/component/tree/index.vue` |
| 33 | LayCollapse | `<lay-collapse>` | Accordion thu gọn/mở rộng nhóm panel | `packages/component/component/collapse/index.vue` |
| 34 | LayCollapseItem | `<lay-collapse-item>` | Panel đơn trong Collapse | `packages/component/component/collapseItem/index.vue` |
| 35 | LayCarousel | `<lay-carousel>` | Carousel ảnh/nội dung: autoplay, hiệu ứng fade/slide/updown, indicator | `packages/component/component/carousel/index.vue` |
| 36 | LayCarouselItem | `<lay-carousel-item>` | Slide đơn trong Carousel | `packages/component/component/carouselItem/index.vue` |
| 37 | LayTimeline | `<lay-timeline>` | Timeline dọc hoặc ngang | `packages/component/component/timeline/index.vue` |
| 38 | LayTimelineItem | `<lay-timeline-item>` | Mục sự kiện trong Timeline | `packages/component/component/timelineItem/index.vue` |
| 39 | LayDescriptions | `<lay-descriptions>` | Danh sách mô tả key-value, hỗ trợ border, nhiều cột | `packages/component/component/descriptions/index.vue` |
| 40 | LayDescriptionsItem | `<lay-descriptions-item>` | Mục đơn trong Descriptions | `packages/component/component/descriptionsItem/index.vue` |
| 41 | LayCalendar | `<lay-calendar>` | Lịch tháng: tuỳ chỉnh cell, disable ngày | `packages/component/component/calendar/index.vue` |
| 42 | LayProgress | `<lay-progress>` | Thanh tiến trình: tuyến tính/vòng tròn, multi-segment, animation, indeterminate | `packages/component/component/progress/index.vue` |
| 43 | LayEmpty | `<lay-empty>` | Trạng thái trống: ảnh minh hoạ + mô tả | `packages/component/component/empty/index.vue` |
| 44 | LayCountUp | `<lay-count-up>` | **Thay đổi con số với animation** — đếm số từ A → B với hiệu ứng easing | `packages/component/component/countUp/index.vue` |
| 45 | LayQrcode | `<lay-qrcode>` | Tạo mã QR trên canvas, hỗ trợ nhúng ảnh | `packages/component/component/qrcode/index.vue` |
| 46 | LayBarcode | `<lay-barcode>` | Tạo mã vạch (barcode) nhiều format: CODE39, EAN, UPC... | `packages/component/component/barcode/index.vue` |

---

## 5. Container & Panel

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 47 | LayCard | `<lay-card>` | Thẻ card: tiêu đề, nội dung, footer, tuỳ chỉnh shadow | `packages/component/component/card/index.vue` |
| 48 | LayPanel | `<lay-panel>` | Panel đơn giản với shadow hover/always/never | `packages/component/component/panel/index.vue` |
| 49 | LayField | `<lay-field>` | Fieldset nhóm phần tử form với legend | `packages/component/component/field/index.vue` |
| 50 | LayLine | `<lay-line>` | Đường phân cách ngang/dọc, có thể chèn text giữa | `packages/component/component/line/index.vue` |
| 51 | LayQuote | `<lay-quote>` | Khối trích dẫn (blockquote) có viền trái màu | `packages/component/component/quote/index.vue` |
| 52 | LaySplitPanel | `<lay-split-panel>` | Panel chia đôi kéo thay đổi kích cỡ (resizable splitter) | `packages/component/component/splitPanel/index.vue` |
| 53 | LaySplitPanelItem | `<lay-split-panel-item>` | Panel con trong SplitPanel | `packages/component/component/splitPanelItem/index.vue` |
| 54 | LaySpace | `<lay-space>` | Tự động thêm khoảng cách giữa các phần tử con | `packages/component/component/space/index.vue` |

---

## 6. Nhập liệu (Form & Input)

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 55 | LayForm | `<lay-form>` | Form container: validate (async-validator), layout block/inline, label vị trí | `packages/component/component/form/index.vue` |
| 56 | LayFormItem | `<lay-form-item>` | Bao bọc 1 trường form: label, validate, tooltip | `packages/component/component/formItem/index.vue` |
| 57 | LayInput | `<lay-input>` | Ô nhập text: prefix/suffix icon, password toggle, clear, prepend/append slot | `packages/component/component/input/index.vue` |
| 58 | LayInputNumber | `<lay-input-number>` | Nhập số: nút tăng/giảm, step, precision, min/max | `packages/component/component/inputNumber/index.vue` |
| 59 | LayTextarea | `<lay-textarea>` | Ô nhập nhiều dòng: đếm ký tự, auto-resize, clear | `packages/component/component/textarea/index.vue` |
| 60 | LaySelect | `<lay-select>` | Dropdown chọn: đơn/nhiều, tìm kiếm, clear, tag collapse | `packages/component/component/select/index.vue` |
| 61 | LaySelectOption | `<lay-select-option>` | Option đơn trong Select | `packages/component/component/selectOption/index.vue` |
| 62 | LaySelectOptionGroup | `<lay-select-option-group>` | Nhóm option trong Select | `packages/component/component/selectOptionGroup/index.vue` |
| 63 | LayRadio | `<lay-radio>` | Radio button đơn | `packages/component/component/radio/index.vue` |
| 64 | LayRadioButton | `<lay-radio-button>` | Radio dạng nút (button style) | `packages/component/component/radioButton/index.vue` |
| 65 | LayRadioGroup | `<lay-radio-group>` | Nhóm radio | `packages/component/component/radioGroup/index.vue` |
| 66 | LayCheckbox | `<lay-checkbox>` | Checkbox: đơn/nhóm, indeterminate state | `packages/component/component/checkbox/index.vue` |
| 67 | LayCheckboxV2 | `<lay-checkbox-v2>` | Checkbox phiên bản cập nhật (cùng API) | `packages/component/component/checkboxV2/index.vue` |
| 68 | LayCheckboxGroup | `<lay-checkbox-group>` | Nhóm checkbox | `packages/component/component/checkboxGroup/index.vue` |
| 69 | LaySwitch | `<lay-switch>` | Công tắc bật/tắt: tuỳ màu, text, loading | `packages/component/component/switch/index.vue` |
| 70 | LayRate | `<lay-rate>` | Đánh giá sao: nửa sao, readonly, clear, icon tuỳ chỉnh | `packages/component/component/rate/index.vue` |
| 71 | LaySlider | `<lay-slider>` | Thanh trượt: range, marks, vertical, reverse | `packages/component/component/slider/index.vue` |
| 72 | LayColorPicker | `<lay-color-picker>` | Chọn màu: hue/saturation/alpha, preset, eyedropper, simple mode | `packages/component/component/colorPicker/index.vue` |
| 73 | LayDatePicker | `<lay-date-picker>` | Chọn ngày/giờ: date, datetime, year, month, time, yearmonth, range, shortcuts, disable ngày | `packages/component/component/datePicker/index.vue` |
| 74 | LayTimeSelect | `<lay-time-select>` | Chọn giờ từ dropdown: start/end/interval tuỳ chỉnh | `packages/component/component/timeSelect/index.vue` |
| 75 | LayAutocomplete | `<lay-autocomplete>` | Nhập text tự gợi ý: async fetch, keyboard navigation | `packages/component/component/autoComplete/index.vue` |
| 76 | LayTagInput | `<lay-tag-input>` | Nhập nhiều giá trị dạng tag: collapse, max count, tuỳ chỉnh tag | `packages/component/component/tagInput/index.vue` |
| 77 | LayCascader | `<lay-cascader>` | Chọn nhiều cấp (cascading): lazy load, multiple, tìm kiếm | `packages/component/component/cascader/index.vue` |
| 78 | LayCascaderPanel | `<lay-cascader-panel>` | Panel cascader dùng độc lập | `packages/component/component/cascaderPanel/index.vue` |
| 79 | LayTransfer | `<lay-transfer>` | Chuyển mục giữa 2 danh sách (shuttle/transfer) | `packages/component/component/transfer/index.vue` |
| 80 | LayTreeSelect | `<lay-tree-select>` | Dropdown chọn dạng cây: đơn/nhiều, lazy load, tìm kiếm | `packages/component/component/treeSelect/index.vue` |
| 81 | LayIconPicker | `<lay-icon-picker>` | Chọn icon từ dropdown: tìm kiếm, phân trang | `packages/component/component/iconPicker/index.vue` |
| 82 | LayCheckcard | `<lay-checkcard>` | Card chọn được (checkbox dạng card): title, mô tả, avatar | `packages/component/component/checkcard/index.vue` |
| 83 | LayCheckcardGroup | `<lay-checkcard-group>` | Nhóm checkcard | `packages/component/component/checkcardGroup/index.vue` |
| 84 | LaySegmented | `<lay-segmented>` | Segmented control — thanh chuyển đổi tuỳ chọn (giống tab nhỏ) | `packages/component/component/segmented/index.vue` |
| 85 | LayUpload | `<lay-upload>` | Tải file: kéo thả, nhiều file, giới hạn size, MIME filter, cắt ảnh (CropperJS) | `packages/component/component/upload/index.vue` |

---

## 7. Phản hồi & Overlay (Feedback)

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 86 | LayLayer | `<lay-layer>` | **Modal/Dialog/Drawer cốt lõi** — 8 loại: dialog, page, iframe, loading, drawer, photos, notify, prompt. Hỗ trợ kéo/thay đổi kích cỡ/phóng to/thu nhỏ | `packages/layer/src/component/index.vue` |
| — | layer (API) | `layer.msg()` / `layer.open()` / `layer.confirm()` / `layer.load()` / `layer.photos()` / `layer.drawer()` / `layer.notify()` | **API dạng hàm** — gọi trực tiếp không cần template | `packages/layer/` |
| 87 | LayTooltip | `<lay-tooltip>` | Tooltip hover/click/focus, tự hiện khi text bị cắt (ellipsis) | `packages/component/component/tooltip/index.vue` |
| 88 | LayPopconfirm | `<lay-popconfirm>` | Popup xác nhận nhỏ với nút Confirm/Cancel | `packages/component/component/popconfirm/index.vue` |
| 89 | LayLoading | `<lay-loading>` | Overlay loading bọc nội dung, 3 kiểu animation, text tip | `packages/component/component/loading/index.vue` |
| 90 | LaySkeleton | `<lay-skeleton>` | Skeleton placeholder khi đang tải dữ liệu | `packages/component/component/skeleton/index.vue` |
| 91 | LaySkeletonItem | `<lay-skeleton-item>` | Hình dạng skeleton đơn: paragraph, image, avatar... | `packages/component/component/skeletonItem/index.vue` |
| 92 | LayPopper | `<lay-popper>` | Primitive định vị floating (dùng nội bộ bởi Tooltip, Dropdown...) | `packages/component/component/popper/popper.vue` |

---

## 8. Trạng thái & Kết quả (Status)

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 93 | LayResult | `<lay-result>` | Trang kết quả thành công/thất bại với icon SVG, tiêu đề, mô tả | `packages/component/component/result/index.vue` |
| 94 | LayException | `<lay-exception>` | Trang lỗi HTTP: 401, 403, 404, 500 với ảnh minh hoạ sẵn | `packages/component/component/exception/index.vue` |

---

## 9. Bước (Steps / Wizard)

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 95 | LayStep | `<lay-step>` | Thanh bước (wizard): ngang/dọc, tuỳ chỉnh status | `packages/component/component/step/index.vue` |
| 96 | LayStepItem | `<lay-step-item>` | Bước đơn trong Step | `packages/component/component/stepItem/index.vue` |

---

## 10. Tiện ích (Utilities)

| # | Component | Tag | Mô tả | File nguồn |
|---|-----------|-----|-------|------------|
| 97 | LayAffix | `<lay-affix>` | Ghim element khi cuộn trang (sticky top/bottom) | `packages/component/component/affix/index.vue` |
| 98 | LayBackTop | `<lay-backtop>` | Nút cuộn về đầu trang, hiện khi cuộn qua ngưỡng | `packages/component/component/backTop/index.vue` |
| 99 | LayScroll | `<lay-scroll>` | Thanh cuộn tuỳ chỉnh thay thế scrollbar gốc | `packages/component/component/scroll/index.vue` |
| 100 | LayFullscreen | `<lay-fullscreen>` | Bật/tắt toàn màn hình (Fullscreen API) | `packages/component/component/fullscreen/index.vue` |
| 101 | LayTransition | `<lay-transition>` | Wrapper animation: collapse và fade | `packages/component/component/transition/index.vue` |
| 102 | LayRipple | `<lay-ripple>` | Hiệu ứng gợn sóng Material (ripple) khi click/hover | `packages/component/component/ripple/index.vue` |
| 103 | LayWatermark | `<lay-watermark>` | Watermark lặp lại trên canvas, bảo vệ bằng MutationObserver | `packages/component/component/watermark/index.vue` |
| 104 | LayNoticeBar | `<lay-notice-bar>` | Thanh thông báo chạy chữ (marquee/ticker) | `packages/component/component/noticeBar/index.vue` |

---

## Hệ thống kích cỡ chung (Size System)

Tất cả component form/input hỗ trợ prop `size` với 4 cấp:

| Size | Mô tả |
|------|-------|
| `xs` | Cực nhỏ |
| `sm` | Nhỏ |
| `md` | Trung bình (mặc định) |
| `lg` | Lớn |

Kích cỡ được **kế thừa tự động** từ `<lay-form size="lg">` xuống tất cả component con bên trong.

---

## Tính năng nổi bật theo chủ đề

### Animation & Hiệu ứng
- **LayCountUp** — Đếm số với animation easing (ví dụ: 0 → 1,234,567)
- **LayTransition** — Hiệu ứng collapse/fade cho mount/unmount
- **LayRipple** — Gợn sóng Material Design khi click
- **LayCarousel** — Slideshow với 3 kiểu animation: default, updown, fade
- **LayProgress** — Thanh tiến trình có animated và indeterminate mode
- **LayTab** — Thanh trượt active bar với transition

### Bảng dữ liệu (LayTable)
- Cột cố định trái/phải (fixed column)
- Sắp xếp đa cột (multi-sort)
- Chọn dòng đơn (radio) và đa dòng (checkbox)
- Dòng mở rộng (expandable row)
- Dữ liệu cây (tree data) với indent
- Cuộn ảo (virtual scroll) cho data lớn
- Thay đổi kích cỡ cột kéo thả (column resize)
- Xuất file Excel/CSV
- In (print)
- Toolbar mặc định (filter columns, export, print)
- Gộp ô (spanMethod)
- Ellipsis tooltip cho text dài
- Tổng dòng (totalRow)

### Form & Validate
- Validate dựa trên `async-validator`
- Layout block/inline
- Label vị trí: left/right/top
- Tooltip cho label
- Kế thừa size từ form → tất cả input con
- Required icon tuỳ chỉnh

### Layer (Modal/Dialog)
- 8 loại: dialog, page, iframe, loading, drawer, photos, notify, prompt
- Kéo di chuyển (drag)
- Thay đổi kích cỡ (resize)
- Phóng to/thu nhỏ (maxmin)
- Shade overlay tuỳ chỉnh opacity
- Animation mở/đóng (6 kiểu anim)
- Có cả **component API** (`<lay-layer>`) và **function API** (`layer.msg()`, `layer.open()`, `layer.confirm()`)

### Chọn ngày (LayDatePicker)
- 6 mode: date, datetime, year, month, time, yearmonth
- Chọn khoảng (range mode)
- Shortcuts (Hôm nay, Tuần này, Tháng này...)
- Disable ngày tuỳ chỉnh
- Format hiển thị và format giá trị riêng
- Single panel / dual panel

### Cây (LayTree / LayTreeSelect)
- Lazy load node con
- Checkbox với checkStrictly (cha-con độc lập)
- Tìm kiếm node
- Accordion mode
- Kéo thả sắp xếp
- Đường nối (show line)
- Custom icon
