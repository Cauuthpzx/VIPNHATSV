若你需要查看更多详情,可前往Gitee。


2.23.x
2.23.3 2025-07-28
[修复] thẻ kiểm tra bị vô hiệu hóa属性变化未生效。详情
[修复] menu 组件 展开/收起图标位置异常。详情
2.23.2 2025-07-22
[新增] datePicker có thời gian mặc định làm cho phạm vi phạm vi trở nên dễ dàng hơn
[修复] bảng 组件 清空dataSource与selectedKeys同时进行,selectedKeys清空异常。详情
[修复] menu 组件 高度异常。详情
[修复] cây 组件 展开/收起 图标异常。详情
2.23.1 2025-07-03
[修复] bảng 组件 按需引入时, thanh công cụ mặc định 样式问题。
[修复] bảng 组件 đạo cụ.cột 为响应式变量时, cố định 列异常。详情
2.23.0 01/07/2025
[升级] @layui/json-schema-form 升级至1.0.16。
[新增] datePicker 组件 新增 default与footer 插槽。详情
[新增] Cascader 组件 新增 getSelectLabel 方法。详情
[新增] bảng 组件 新增 cột.exportCellType 用于导出 xls 自定义单元格类型。详情
[新增] bảng 组件 thanh công cụ mặc định 新增 render 属性，用于自定义渲染。详情
tab [修复] tab 组件 与 lớp 结合样式异常。详情
[修复] bảng 组件 导出数据为 Số 时,xls 单元格类型固定为数字。详情
[修复] bàn 组件 存在多个 cố định 表头,固定表头偏移异常。详情
[修复] treeSelect 组件 设置 thay thếFields.children 输入框未反填二级内容。详情

2.22.x
2.22.2 2025-04-29
[修复] bảng 组件 columns.customSlot获取不到 rowIndex/columnIndex 参数。详情
[修复] bảng 组件 TableColumn(types)中 type 存在时 key 仍为必填的问题。详情
2.22.1 2025-04-26
[新增] datePicker 组件 static(静态面板)模式。详情
[新增] bảng 组件 cột.titleSlot支持 function 类型渲染方式。详情
[修复] bảng 组件 dataSource为空,表头hộp kiểm
[修复] bảng 组件 columns.titleSlot失效。详情
[修复] bảng cột cố định có thể thay đổi kích thước dom。详情
2.22.0 11/4/2025
[新增] bảng 组件 trang 插槽,分页右侧区域。详情
[新增] table 组件 page.change 回调，在未来版本中将删除 @change事件。详情
[新增] bảng 组件 hộp kiểm 与 hộp kiểm-tất cả phát ra,用于触发点击 单行hộp kiểm 与 全选。详情
[新增] bảng 组件 thanh công cụ mặc định 可自定义配置图标(icon)。详情
[新增] bảng 组件 cột.ellipsisTooltipProps 可自定义 chú giải công cụ 样式。详情
[新增] cây 和 chọn cây 组件 dữ liệu 属性 đã kiểm tra biểu tượng khe lá trải rộng 配置项。详情
[新增] cây 和 cây-chọn 组件 thay thếField 属性 bị vô hiệu hóa đã kiểm tra lá mở rộng 配置项。详情
[新增] tree 和 tree-select 组件 cacheData 属性，支持传入节点缓存数据。详情
[新增] cây 组件 đàn accordion 属性开启手风琴模式。详情
[新增] cây 组件 LoadOnCheck 属性，在点击 hộp kiểm 时，触发懒加载。详情
[新增] cây 组件 nút-đôi 节点双击、nút-ngữ cảnhmenu 节点右键事件。详情
[修复] vấn đề về bảng 组件 多级表头与đã khắc phục được vấn đề
[修复] số đầu vào 组件自定义宽度,chỉ báo显示异常。详情
[修复] popper
[修复] descriptionsItem umd中使用labelStyle/labelClass未生效。详情
[修复] SplitPanel 组件 SplitPanelItem无法设置style/class与splitPanel可渲染非splitPanelItem组件。详情
[优化] chọn 组件当下拉弹窗隐藏,用户输入自动显示下拉弹窗。详情
[优化] tải lên 组件 slot.preview 为空时，不渲染相关元素。详情

2.21.x
2.21.2 2025-03-08
[升级] lớp 到 2.4.8 版本。
[修复] lớp 组件 nhắc nhở模式输入类型为textarea时placeholder无效。详情
[新增] tải lên 组件 新增thư mục参数，用于文件夹上传。详情
[新增] textarea 组件 新增readonly参数。详情
[新增] tableColumns 组件 sắp xếp属性支持custom参数值。详情
[新增] datePicker 组件 新增类型为datetime底部选择日期/时间,i18翻译。详情
[修复] chia Bảng điều khiển
2.21.1 11/12/2024
[修复] bảng 组件 mặc địnhMở rộng tất cả 切换异常。
[修复] bảng 组件 ô 内 tiến trình 组件无法正常加载的问题。
2.21.0 2024-12-3
[升级] lớp 到 2.4.7 版本。
[新增] lớp 新增moveEnd/resizeEnd返回值。详情
[修复] layui 2.20.0版本无法install问题。

2.20.x
2.20.0 12/11/2024
[修复] bàn 组件部分场景下底部边框不存在的问题。
[修复] lớp 组件拖拽至 iframe 时 mousemove 事件中断的问题。
[修复] timeSelect 与 Phân đoạn 组件类型未生成的问题。
[修复] thả xuống 和 chú giải công cụ 按需模式 popper 样式丢失。
[修复] người chọn ngày tháng
[修复] docs 文档中因网络协议导致的图片资源丢失。
[修复] bảng 组件多级表格头部 mở rộng 插槽错位。
[升级] lớp 到 2.4.6 版本。

2.19.x
2.19.3 12/11/2024
[升级] @layui/layer-vue 升级至2.4.5。
[修复] @layui/layer-vue closeAll关闭notify,二次打开存在异常。详情
------------------------------以下为 @layui/layui-vue 调整------------------------------
[修复] form .
[修复] bảng
[修复] bảng组件,cột存在ẩn,mở rộng插槽展开内容错位。详情
[修复] tagInput组件，初始化inputValue未反填至输入框。详情
[修复] Cascader组件,开启multiple,输入框未初始modelValue值。详情
[修复] Cascader组件,options未深度监听变化。详情
[修复] popConfirm组件，点击确认/取消按钮无法关闭弹窗。详情
[优化] datePicker组件,开启đơn giản/phạm vi后点击快捷选项无需确认。详情
[优化] timeSelect组件，补充 select.props默认值。详情
2.19.2 2024-11-04
[修复] @layui/layui-vue umd版本,存在 production 为空报错。
2.19.1 2024-11-01
[新增] form组件 新增表单校验对于asyncValidator的支持。详情
[新增] chọn 组件 新增autoFitMinWidth属性。详情
[修复] datePicker组件 ngày/phạm vi mô hìnhValue初始化下拉右侧看板日期错误。详情
[修复] table组件 开启 thanh công cụ mặc định 控制台存在警告。详情
[修复] bàn组件 树形表格无法导出trẻ em
Trang [修复]组件 开启ellipsisTooltip
[修复] tab组件 切换后tab-item中的select下拉未正常渲染。详情
2.19.0 2024-10-22
[升级] @layui/icons-vue 升级至1.1.3。
[调整] @layui/icons-vue 调整umd包全局变量名为LayuiIcons。
[升级] @layui/layer-vue 升级至2.4.4。
[调整] @layui/layer-vue 调整umd包全局变量名为LayuiLayer。
[新增] @layui/layer-vue 使用函数调用支持title/footer传入VNode形式。
[升级] @layui/json-schema-form 升级至1.0.15。
[调整] @layui/json-schema-form 调整umd包全局变量名为LayuiJsonSchemaForm。
------------------------------以下为 @layui/layui-vue 调整------------------------------
[调整] affix组件 内部props类型名称修正：AiffxProps > AffixProps。详情
[新增] 新增timeSelect(时间点选择器)组件。详情
[新增] 新增phân đoạn(分段选择器)组件。详情
[新增] datePicker组件 年份范围选择模式、允许选择任意年份。详情
[新增] datePicker组件bị vô hiệu hóa ngày
[新增] datePicker cung cấp định dạng đầu vào Bạn có thể làm được điều đó .
[新增] datePicker组件 trang năm属性 用于年份选择器每页年份的个数。详情
[新增] datePicker组件 phím tắt
[新增] tagInput组件 新增tag新增校验、tag触及最大数量事件。详情
[新增] textArea组件 新增autosize.minRow/autosize.maxRow用于设置高度。详情
[新增] tiến bộ
[修复] bảng
[修复] bảng mặc định mở rộng tất cả các bảng mặc định
[修复] bảng
[修复] tagĐầu vào là một thẻ đầu vào .
[修复] SplitPanel组件 垂直布局嵌套水平布局line方向错误。详情
[修复] mô tả组件 渲染内部mô tả-mục丢失响应式。详情
[修复] mô tả组件 存在title/extra渲染header部分。详情
[修复] qrCode组件 设置width/height未生效与图片未居中。详情
[修复] tree组件 show-line为false时展开最后一级报错。详情
[修复] băng chuyền
[修复] chú giải công cụ组件 mũi tên箭头位置异常。详情

2.18.x
2.18.3 2024-08-23
[升级] dạng lược đồ json 升级至1.0.14。
[新增] qrCode组件 支持内插图片。详情
[新增] bàn
[新增] bảng
[新增] chọn组件 新增clear、xóa thẻ phát ra 事件。详情
[修复] table组件 dấu chấm lửngTooltip只在文本超出隐藏生效。详情
[修复] select组件 多选时placeholder不可见。详情
[修复] treeSelect组件 props.data改变内部未更新。详情
[修复] radioButton组件 结合radioGroup未触发change事件。详情
2.18.2 2024-08-16
[新增] qrCode组件 添加options参数用于传入qrCode其他参数。详情
[修复] cây đã kiểm traKeys回显层级异常。详情
[修复] radioGroup/checkboxGroup组件 单向数据流，选中状态并未跟随modelValue状态。详情
2.18.1 2024-08-09
[修复] các tùy chọn của Cascader
[修复] cây đã được kiểm traKey值异常。详情
[修复] cây cối
2.18.0 02/08/2024
[升级] lớp 升级至2.4.3。
[新增] 新增mô tả(描述列表)组件。详情
[新增] 新增cascaderPanel组件 Cascader组件 新增搜索、多选、懒加载功能。详情
[新增] tự động hoàn thành组件 新增输入框input、focus、blur、clear事件。详情
[新增] bảng组件 添加expand(行展开)事件。详情
[修复] layer组件 修复umd格式下globalIndex无默认值。详情
[修复] biểu mẫu组件 取消表单submit默认行为。详情
[修复] bảng chứa nguồn dữ liệu mặc định-mở rộng tất cả là gì ?
[修复] bảng
[修复] cây đã kiểm traKeys异常。详情
[修复] avatar

2.17.x
2.17.7 2024-06-27
[升级] lớp 升级至2.4.2。
[新增] cây组件 新增props：`searchNodeMethod`、emit： `check-change`、Exposes: `filter`。详情
[重构] popper组件 影响组件 `tooltip`。详情
[修复] lớp
[修复] lớp nội dung lớp
[修复] tree组件 设置replaceFields后，节点联动失效。详情
[修复] chọn cây
2.17.6 2024-06-13
[升级] lớp 升级至2.4.1。
[新增] layer组件 layer.prompt类型。详情
[修复] lớp tạo ra một khu vực rộng lớn
[修复] tree组件 check-strictly为false时checkedKeys值异常。详情
[修复] công cụ chọn ngày
[修复] huy hiệu组件 Ripple 闪动动画异常。详情
[调整] menu-item组件 删除props.to属性。详情
[调整] form组件 label-width为0时,label元素不渲染。详情
[调整] form组件 layui-form-item>khối类名调整为layui-form-item>layui-form-item-block。详情
[样式] cây组件 图标及连线样式调整(轻度调整)。详情
2.17.5 2024-06-04
[升级] lớp 升级至2.4.0。详情
[新增] layer组件 layer.min 最小化、layer.revert 复原最小/最大化。
[新增] layer组件 props.revert 内部最小/最大化生命周期。
[新增] layer组件 props.lastPosition 最小/最大化 复原位置 `true` 最后位置 `false` 初始位置。
[新增] layer组件 min Expose事件 外部最小化。
[新增] layer组件 hoàn nguyên Expose事件 外部还原最小/最大化。
[删除] lớp đạo cụ.destroy。
[调整] lớp props.restore và props.revert 代替。
[修复] datePicker组件 clear事件rang场景初始值调整为空数组。
2.17.4 2024-05-23
[升级] lớp 升级至2.3.4。
[新增] datePicker组件 新增clear事件。详情
[修复] lớp lớp
[修复] popper组件 zIndex应大于layer。详情
[修复] iconPicker đã bị vô hiệu hóa
[修复] tsconfig.json moduleResolution为bundler无法引用types。详情
[优化] form组件 整体样式优化。详情
2.17.3 2024-05-08
[修复] datePicker组件 thời gian mặc định là thời gian mặc định.
2.17.2 2024-05-06
[升级] lớp 升级至2.3.3。
[升级] dạng lược đồ json 升级至1.0.7。
[新增] cột cột bảng.customSlot属性新增function类型。详情
[新增] formItem组件 新增tips属性。详情
[新增] inputNumber组件 新增chỉ báo属性。详情
[新增] datePicker组件 新增thời gian mặc định属性。详情
[修复] layer 设置animDuration属性无效。详情
[修复] bảng
2.17.1 2024-04-23
[修复] upload组件 cut属性失效详情
2.17.0 2024-04-22
[新增] biểu mẫu组件 新增isLabelTooltip属性控制label是否超出隐藏。详情
[新增] tải lên组件 新增选择文件后"đang thay đổi"回调事件。详情
[修复] select组件 multiple场景下点击placeholder区域不触发弹窗。详情
[修复] bàn
[修复] treeSelect组件 modelValue首次赋值为0不生效。详情
[样式] datePicker组件 新增滑入border效果与表单校验失败border边框效果。详情

2.16.x
2.16.8 2024-04-12
[修复] carousel组件 新增setActive,prev,next外部暴露属性。
[修复] treeSelect组件 选中节点触发两次change事件。I9CSNH
[修复] tải lên组件 额外请求参数移至 trướcTải lên钩子之后执行。I9E4FA
[调整] JsonSchemaForm组件相关调整
2.16.7 2024-03-26
[修复] bảng组件 双击cell未冒泡到双击row事件。I9BGAP
2.16.6 2024-03-22
[新增] bảng组件 新增单元格双击事件（cell-double)。
[调整] tải lên组件 新增submit外部函数，用于用户手动上传。I99WUO
[修复] thanh trượt 精度丢失。I995I6
[修复] table组件 数据改变getCheckboxProps未重新计算。I9A9Y1
[修复] treeSelect组件 单选清空二次选择相同值未触发改变。I9A9NT
2.16.5 2024-03-18
[新增] bảng组件 标题插槽新增cột,cộtIndex参数。
[修复] bàn 组件 树形跨级展开隐藏错乱。I98Y95
[修复] tải lên 只有当开启裁剪且能够裁剪时才读取文件。I979LK
2.16.2 2024-02-29
[发布] json-schema-form 1.0.0 版本。
[新增] cây,treeSelect 组件 新增lazy,load参数，实现懒加载子节点。
[修复] layer组件 在使用mẫu
[升级] layer-vue 2.3.2 版本。
2.16.1 19/02/2024
[修复] layer.notify 组件 offset 为 rb 时，位置计算异常。
[升级] layer-vue 2.3.1 版本。
2.16.0 19/02/2024
[调整] layer.notifyy 方法为 thông báo。
[调整] lớp tùy chọn 组件 属性 loại 可选值 thông báo 为 thông báo。
[调整] col 组件所有属性可选值范围为 0 - 24。
[移除] chọn các mục 组件 属性，完全由 tùy chọn 代替。
[升级] layer-vue 2.3.0 版本。

2.15.x
2.15.2 2024-02-06
[升级] layer-vue 到 2.2.3 版本。
[修复] Icons-vue 到 1.1.1 版本。
2.15.1 2024-02-02
[新增] gắn 组件 test 用例。
[修复] cây 组件 đã kiểm traKeys值丢失。I901ZR
[修复] thanh trượt 组件 二次改变modelValue为0时，滚动条未改变。I90K5J
[修复] bảng 组件 TotalRow 合计精度问题。I90LJE
[优化] bước 组件 提升 thành phần 属性优先级,为 hàng 时 trung tâm 属性失效。
2.15.0 30/01/2024
[新增] col 组件 xsPull, smPull, mdPull, lgPull 属性。
[新增] col 组件 xsPush, smPush, mdPush, lgPush 属性。

2.14.x
2.14.3 2024-01-29
[调整] datePicker 组件 移除 popper 底部清空按钮，该操作交由 allowClear 属性。
[修复] SplitPanel 组件 修复未进行拖动元素失焦问题。I8YP2U
2.14.2 2024-01-25
[修复] inputNumber 组件 model-value 属性缺失响应式。
2.14.1 2024-01-24
[新增] công cụ chọn màu 组件 添加allowClear、simple属性控制清空与确认按钮。
[新增] số đầu vào 组件 添加độ chính xác属性，用于控制数值精度。
[新增] cây 组件 trường thay thế 属性，支持自定义字段。
[新增] cây 与 câyChọn 组件 mặc địnhMở rộng tất cả 属性，默认是否展开所有节点。
[修复] bảng 组件 biên giới异常。I8Y142
[修复] bảng 组件 cột属性内部深度监听。
[修复] công cụ chọn màu 组 modelValue为空组件内部报错。
[优化] bảng, thanh công cụ mặc định và bán kính đường viền 属性跟随主题。
[优化] công cụ chọn ngày 组件底部按钮 bán kính đường viền 跟随主题。
[优化] chú giải công cụ 组件 添加hide事件，当弹窗内容隐藏后触发。
[优化] layer 组件操作栏 icon 资源，替换为 @layui/icons-vue。
[优化] biểu tượng lớp 组件操作栏 主题跟随主题色。
[升级] @layui/layer-vue 2.2.1 版本。
2.14.0 15/01/2024
[新增] chọn 组件 tiêu đề 与 chân trang 插槽。
[修复] thẻ kiểm tra 组件 di chuột 状态边框不跟随主题色。
[优化] bàn 组件内 chuyển đài 等组件与原样式发生出入的问题。
[优化] switch 组件 size 为 lg md sm xs 时的样式尺寸。
[优化] tấm séc 组件边框颜色，角标位置。

2.13.x
2.13.4 14/01/2024
[修复] public.css 在按需模式下丢失的问题 。
2.13.3 14/01/2024
[修复] số đầu vào 组件 触摸板点击加减触发两次事件。I8VJCB
[修复] table
[修复] chọn cây 组件 搜索问题。I8ULRO
[新增] tree-select 组件 searchNodeMethod 搜索自定义过滤方法。treeSelect
[新增] mẫu 组件 nhãn文字长度溢出显示tooltip。I8UMQH
[修复] bàn 组件切换分页时自动宽度不工作的问题。
2.13.2 2024-01-06
[修复] mẫu-mục 组件 nhãn 缺省的情况下，验证异常。
2.13.1 2024-01-04
[新增] số đầu vào 组件 bước nghiêm ngặt 限制输入值只能是步长的倍数。
[修复] hình mờ 组件 index.css 按需模式丢失问题。
[优化] đầu vào 组件 mờ 与 foucs 事件参数类型为 FocusEvent。
2.13.0 2023-12-25
[新增] hình mờ 水印组件。
[新增] hình mờ nội dung 组件 属性，用于设置内容。
[新增] hình mờ 组件 elementBox 属性，用于指定父容器。
[新增] hình mờ 组件 màu 属性，用于设置水印字体颜色。
[新增] hình mờ phông chữ Kích thước 属性，用于设置水印字体大小。
[新增] hình mờ 组件 fontFamily 属性，用于设置水印字体样式。
[新增] hình mờ 组件 xoay 属性，用于设置水印角度。
[新增] hình mờ 组件 chiều cao 属性，用于设置水印高度。
[新增] hình mờ 组件 chiều rộng 属性，用于设置水印宽度。
[新增] cây-chọn 组件 tiêu đề 插槽用于自定义标题内容。

2.12.x
2.12.0 2023-11-23
[新增] lớp 组件 thay đổi kích thướcStart 属性，拉伸开始回调。
[新增] lớp 组件 thay đổi kích thước 属性，拉伸中回调。
[新增] lớp 组件 thay đổi kích thướcEnd 属性，拉伸结束回调。
[新增] dạng chế độ 组件 属性,全局设置表单项布局模式,chặn 与 nội tuyến 未可选值。
[新增] bàn 组件 trống 插槽，提供自定义空状态的能力。
[新增] bảng 组件 mô tả trống 属性，设置没有数据时的默认文本。
[修复] chọn 组件 allowClear 属性在文档缺失的问题。
[升级] lớp 组件 2.2.0 版本。

2.11.x
2.11.5 17/11/2023
[修复] avatar 组件 lớp 错误，导致内容不垂直水平居中的问题。
[修复] thanh trượt 组件 max 属性响应式特性失效的问题。
2.11.4 2023-11-09
[新增] avatar 与 avatar-list 单元测试用例。
[修复] bảng 组件 defaultToolbar 在国际化场景下不兼容的问题。
2.11.3 2023-11-04
[修复] trang 组件 skin 启用，跳转操作 "确认" 不适配国际化的问题。
[修复] người chọn ngày
[修正] biểu mẫu 组件文档 thông báo lỗi bắt buộc 属性描述错误。
2.11.2 2023-11-02
[修复] avatar 升级 2.11.0 后，加载图片失败会导致 icon 闪动和连续的请求。
2.11.1 01/11/2023
[修复] avatar 升级 2.11.0 后，加载图片失败会导致 icon 闪动和连续的请求。
2.11.0 30/10/2023
[新增] avatar 组件 hậu vệ cánh 属性，图片加载失败时的回调。
[新增] avatar 组件 kích thước tự động sửa 属性，自动调节 biểu tượng 与 phông chữ 尺寸。
[新增] avatar-list 组件 size 属性，统一 slot 内 avatar 组件 size 属性。
[新增] avatar-list 组件 bán kính 属性，统一 slot 内 avatar 组件 bán kính 属性。
[新增] huy hiệu 组件 vị trí 属性,trên cùng bên phải trên cùng bên trái dưới cùng bên phải dưới cùng bên trái 为可选值。
[新增] huy hiệu 组件 showZero 属性，当 giá trị 为 0 时是否显示。
[新增] huy hiệu 组件 max 属性，设置 giá trị 最大阈值。
[新增] huy hiệu 组件 huy hiệuPhong cách 属性，设置 huy hiệu 样式。
[新增] huy hiệu 组件 tùy chỉnh 插槽。
[新增] huy hiệu 组件 jest 用例。

2.10.x
2.10.3 2023-10-28
[修复] bảng 组件 TotalRow 启用后，数据超过表格既定高度，统计栏被压缩的问题。
[修复] thu gọn 组件 css 样式,bán kính đường viền 超过一定数值标题元素溢出组件的问题。
2.10.2 2023-10-25
[修复] bảng 组件 thay đổi kích thước bảng
[修复] hộp kiểm 组件 bán kính đường viền 不跟随 bán kính đường viền toàn cầu 变量的问题。
[修复] SplitPanel 组件在拖拽时选中页面文字元素的问题。
[文档] layer.md 增加 shadeStyle 属性的说明。
2.10.1 2023-10-21
[新增] layer 组件 shadeStyle 属性，设置遮盖层样式。
[修复] cây-chọn 组件 bội số 属性为 sai 时,thay đổi 事件触发两次的问题。
[修复] trang 组件 tổng số 属性为 0 时，页面显示 1 | 0 问题。
[修复] tải lên 组件取消文件选择后，內部仍出发后续解析上传的流程问题。
[修复] bảng 组件 trẻ em 属性内的子节点 TotalRow 属性不起作用的问题。
[优化] bảng 组件 TotalRow 合并行始终固定在表格最底部,不再随数据流位置而变化。
[升级] layer-vue 2.1.1 版本。
2.10.0 16/10/2023
[新增] thanh trượt 组件 giá trị mô hình 属性 mảng 类型兼容。
[新增] thanh trượt 组件 đảo ngược 属性, 实现初始值与结束值的转换。
[新增] silder 组件 tooltip-props 属性, 传入 tooltip 继承属性，自定义效果。
[新增] silder 组件 mark 属性, 设置自定义刻度。
[新增] thanh trượt 组件 định dạng-chú giải công cụ 函数，格式化 chú giải công cụ 内容。
[新增] thanh trượt 组件 is-follow-mark 属性, 设置拖拽按钮是否在自定义刻度停顿。
[新增] thanh trượt 组件 ngón tay cái 插槽,定制化拖拽按钮。
[新增] thanh trượt 组件 mark 插槽，定制化刻度渲染内容。
[新增] thanh trượt 组件 tùy chỉnh 插槽，定制化 chú giải công cụ 显示内容。
[新增] thanh trượt 组件 thay đổi 时间,按钮拖拽回调。
[新增] bảng 组件 cột 属性 bỏ quaXuất khẩu 配置，用于配置列导出忽略。
[新增] huy hiệu.md 组件 màu, gợn sóng 属性说明。
[修复] chú giải công cụ 组件 isAutoShow 属性为 true 时，包裹文本刷新时 isAutoShow 失效。
[修复] bảng 组件 cột 属性 dấu chấm lửngTooltip 配置刷新数据后失效。
[修复] bảng 组件 autoColsWidth 不兼容 số 类型字段的问题。
[修复] Cascader 组件 多次触发 thay đổi 事件的问题。
[优化] trình chọn ngày 组件, trình đơn thả xuống 顶部操作 cỡ chữ 为 12px。
[优化] tooltip.md 文档, 改善 demo 阅读门槛。

2.9.x
2.9.1 11/10/2023
[优化] lớp 组件 thay đổi kích thước 启用时，拉伸选中文字的问题。
[升级] layer-vue 到 2.1.0 版本。
2.9.0 10/10/2023
[修复] form-item 组件 prop 配置 x[0].y 格式时,form 组件 reset 方法不兼容。
[优化] form 组件 reset 方法清空未配置 prop 属性的问题。
[优化] thu gọn-item 组件 tiêu đề 属性为非必填。
[文档] 改善 Button.md 中下拉按钮案例，页面滚动下拉面板不跟随按钮的问题。

2.8.x
2.8.1 09/10/2023
[修复] lớp 组件拖拽后，全文文本无法选中的问题。
[升级] layer-vue 到 2.0.5 版本。
2.8.0 09/10/2023
[新增] lớp 组件 đầy đủ 方法，必填参数为 id，用于弹出层最大化。
[优化] lớp 组件 thay đổi kích thước 启用时，拉伸选中文字的问题。
[优化] lớp 组件 thành công 方法，加入 nextTick 优化，保证在弹层渲染后执行。
[升级] layer-vue 2.0.4 版本。

2.7.x
2.7.4 08/10/2023
[修复] trang 组件 tổng cộng 属性回显数量不正确的问题。
2.7.2 08/10/2023
[修复] công cụ chọn biểu tượng 组件按需模式部分样式丢失的问题。
[优化] trang chọn biểu tượng 组件 启用后底栏样式，下边距由 5px 调整为 10px。
2.7.1 07/10/2023
[新增] bảng 组件 trang 属性 bố cục 配置。
[新增] bảng 组件 trang 属性 ẩn trên một trang 配置。
[新增] bảng 组件 trang 属性 dấu chấm lửngTooltip 配置。
[新增] bảng 组件 trang 属性 bị vô hiệu hóa 配置。
2.7.0 30/09/2023
[新增] chọn 组件 auto-fit-width 属性, 将下拉面板宽度设置为输入框宽度。
[新增] chiều cao của bàn 属性 % 值的兼容，从而实现高度自适应。
[修复] bàn 组件 chiều cao 与 maxHeight 只作用到 cơ thể 而非整个 bàn 的问题。
[修复] lớp 组件 thiết lập lại 方法调用报错的问题。
[优化] bàn 组件 空 状态水平垂直居中位置显示。
[优化] bảng 组件 trang 属性 giới hạn 配置内容省略显示的问题。
[优化] bảng 组件 nền 背景色为 #ffffff。
[升级] layer-vue 到 2.0.2 版本。

2.6.x
2.6.4 2023-09-26
[新增] bảng 组件 dấu chấm lửngTooltipTheme 属性，自定义 dấu chấm lửngTooltip 主题，默认为 'ánh sáng'。
[修复] lớp 组件 关闭 时，未移除 minArrays 中的弹层实例。
[升级] layer-vue 到 2.0.1 版本。
2.6.3 2023-09-25
[修复] toàn cầu-màu cơ bản 设置 màu 时，在 tối 模式下失效的问题。
[修复] Global-normal-color 设置 color 时，在 dark 模式下失效的问题。
[修复] toàn cầu-ấm-màu 设置 màu 时，在 tối 模式下失效的问题。
[修复] màu nguy hiểm toàn cầu 设置 màu 时，在 tối 模式下失效的问题。
2.6.2 2023-09-25
[修复] trang 组件在按需模式下无法正常使用的问题 (由 2.6.1 产生)。
2.6.1 2023-09-24
[新增] trang 组件 dấu chấm lửngTooltip属性 开启翻页更多。
[优化] trang 组件 bố cục 属性可更换位置。
[优化] trang 组件 đơn giản 属性启用下的分页样式。
[修复] trang 组件 giới hạn 属性切换不触发 thay đổi 事件。
[测试] 完善分页组件所有属性测试用例, 测试覆盖率100%。
2.6.0 2023-09-21
[新增] datePicker 组件 max,min 属性，用于控制组件内的可选择的最大值与最小值。
[新增] trang 组件 bị vô hiệu hóa 属性，默认值为 sai, 用于分页组件禁用。
[新增] trang 组件 ẩn trên một trang 属性,tổng cộng 值超出 trang 后使用下拉展示。
[新增] bố cục trang 组件 属性，字符数组, đếm, giới hạn, tiếp theo, trang, trước, làm mới, bỏ qua 为可选值。
[修复] bảng 组件 cố định 列内容超出列宽后溢出。
[优化] bảng 组件内容换行后，biểu tượng mở rộng 不垂直居中的问题。
[优化] trang 组件 giới hạn 属性，可选属性, 默认值为 10。
[优化] trang 组件 trang 属性，调整 5 为默认值。
[优化] trang 组件 giới hạn 选择框，使用 lay-select 代替原生 chọn, 改善样式。
[优化] trang 组件 tổng cộng 值超出 trang 后，省略页码的展现形式。
[移除] trang 组件 showPage, showSkip, showCount, showLimit, showInput, showRefresh 属性。

2.5.x
2.5.0 18/09/2023
[新增] đang tải chỉ báo 组件 插槽,支持自定义加载动画。
[新增] lớp 组件 dịch chuyển tức thời 属性，用于指定弹出层挂载的 dom 节点，默认为 cơ thể。
[新增] lớp 组件 teleportDisabled 属性，用于禁用 teleport 传送门属性。
[修复] loading 组件 type 属性为 1 2 时，夜间模式不适配的问题。
[修复] lớp 组件 loại 为 3 时，仍展示标题的问题。
[文档] 新增 lớp 组件 di chuyển 回调属性说明，同于拖拽中监听。
[升级] layer-vue 2.0.0 版本。

2.4.x
2.4.1 16/09/2023
[修复] công cụ chọn ngày 组件 phạm vi 模式 cho phép rõ ràng 属性不生效的问题。
[修复] định dạng công cụ chọn ngày 组件
[调整] công cụ chọn ngày 组件 rangeSeparator 属性默认值为 "-"。
2.4.0 15/09/2023
[新增] đang tải 组件，局部加载。
[新增] loading 组件 loading 属性，控制加载状态。
[新增] loading 组件 type 属性，设置动画类型。
[新增] loading 组件 tip 属性，设置提示信息。
[新增] đang tải 组件 độ trễ 属性，设置延迟时间，单位：毫秒。
[修复] bàn 组件某些情况下,表头与列错位的问题。
[修复] đầu vào 组件 loại 属性为 số 时,cho phép rõ ràng 无效的问题。

2.3.x
2.3.20 2023-09-11
[新增] layer 组件 animDuration 属性，自定义入场动画速率，默认为 0,3s。
[新增] lớp 组件 khu vực 属性 ['auto', '100px'] 格式，从而实现宽度自适应。
[升级] layer-vue 到 1.9.3 版本。
2.3.19 2023-09-07
[修复] công cụ chọn ngày 组件 showNow 必填的控制台警告。
[修复] công cụ chọn ngày 组件 phạm vi 组件样式问题。
[修复] chọn cây 组件 bội số 属性启用时, 点击节点发生控制台异常。
[修复] menu 组件第一级菜单在折叠后 to 属性失效的问题。
[修复] chọn 组件 nhiều 为 true 时 giữ chỗ 属性无效的问题。
2.3.18 2023-09-07
[优化] bảng 组件 selectedKeys, selectedKey 属性在 dataSource 变化时不再清空。
[优化] chọn 组件 thay đổi 事件, giá trị 参数增加 số 和 đối tượng 类型兼容。
[优化] chọn 组件 update:modelValue 事件, giá trị 参数增加 số 和 đối tượng 类型兼容。
2.3.17 2023-09-03
[修复] treeSelect 组件 multiple 为 true 时 placeholder 属性无效的问题。
[优化] popconfirm 组件 nội dung 插槽存在时 nội dung 为非必填。
2.3.16 2023-09-03
[优化] trống rỗng 组件采用 flex 布局，保证内容居中自适应。
[优化] đầu vào 组件 màu nền 为 #ffffff 值。
[优化] người chọn ngày
[优化] trang 组件 cập nhật:modelValue 与 thay đổi 事件的执行顺序。
2.3.15 2023-08-27
[修复] hình thức 组件 quy tắc 属性类型警告，调整 Quy tắc 为 Quy tắc 类型。
[修复] chọn 组件 v-model 为 0 时，cho phép rõ ràng 操作偏移的问题。
[修复] cây-chọn 组件 v-model 为 0 时，cho phép rõ ràng 操作偏移的问题。
[修复] thanh trượt 组件 tối đa tối thiểu 属性导致拖拽逻辑错乱的问题。
[优化] thanh trượt 组件拖拽卡顿的问题,移除节流防抖函数。
[优化] người chọn ngày tháng
2.3.14 2023-08-20
[新增] lớp 组件 di chuyển 回调函数,用于处理拖拽中的自定义逻辑。
[新增] tiêu đề lớp 组件 插槽, 自定义标题内容。I7S0DF
[修复] thanh trượt 组件在 form-item 内时，增加左侧 10px 边距。
[修复] mẫu quy tắc 组件提交验证案例中 配置错误从而导致 demo 无效的问题。I7SN5F
[修复] bảng 组件 cột 属性 dấu chấm lửngTooltip 配置，按需模式不生效的问题。I7U9WE
[升级] layer-vue 到 1.9.1 版本。
2.3.13 2023-08-10
[新增] breadcrumb 组件 biểu tượng phân cách 属性，用于设置图标分割符。
[优化] Cascader 组件选中项 bán kính đường viền 溢出 panel 的问题。
[优化] bộ chọn màu 组件在 form-item 组件 pane 模式下的样式。
[优化] bộ chọn biểu tượng 组件在 form-item 组件 pane 模式下的样式。
2.3.12 2023-08-09
[修复] tỷ lệ 组件清空操作不更新 modelValue 的问题。
[修复] thanh trượt 组件在 form-item 组件 block 模式下不垂直居中的问题。
[优化] rate 组件清空操作仅在 modelValue 大于 0 时显示。
2.3.11 2023-08-09
[修复] công cụ chọn ngày 组件 kích thước 属性缺省情况下不随 mẫu 全局配置的问题。
[优化] thanh trượt 组件在 biểu mẫu 不垂直居中的问题。
[优化] rate 组件清空操作，在 form-item 不垂直居中的问题。
[优化] đầu vào 组件 modelValue 属性，增加 null 值兼容。
2.3.10 2023-08-06
[修复] công cụ chọn ngày và datetime 模式下交互逻辑问题。
[修复] tag 组件 màu 属性，在夜间模式无法正常生效的问题。
tab [修复] tab 组件滑动逻辑没有将 tab-item 外边距计算在内的问题。
[优化] nhóm hộp kiểm 组件 cập nhật:modelValue 事件与 thay đổi 的执行顺序。
[优化] hộp kiểm 组件 update:modelValue 事件与 thay đổi 的执行顺序。
[优化] input 组件 update:modelValue 与 input 事件的执行顺序。
[优化] đầu vào 组件 đầu vào 事件的触发逻辑，拼音阶段不再触发。
[优化] textarea 组件 update:modelValue 与 input 事件的执行顺序。
[优化] textarea 组件 input 事件的触发逻辑，拼音阶段不再触发。
2.3.9 02/08/2023
[修复] dòng 组件夜间模式下的兼容性问题,无法正常显示。
[修复] 夜间模式 toàn cầu-màu cơ bản 被强制覆盖的问题。
2.3.8 30/07/2023
[新增] textarea 组件 autosize 属性，根据内容自适应高度。
[修复] autoComplete 组件 modelValue 属性选中时不更新的问题。
[文档] 补充 textarea.md 高度自适应,固定案列案例。
[文档] 修正 table.md 中 max-height 与 chiều cao 属性类型描述错误。
[文档] 补充 table.md 中 tổng hàng 行统计案例。
[优化] bước 组件 gõ 属性为 sơ cấp 时的颜色为 #16baaa。
[优化] bước 组件 loại 属性为 sơ cấp 时的颜色不跟随主题色的问题。
2.3.7 2023-07-25
[优化] lớp 组件 max min 等操作夜间模式无法分辨的问题。
[优化] layer.load(1) 资源，由 gif 升级为 svg，解决矢帧问题。
[优化] layer.load(2) 资源，由 gif 升级为 svg，解决矢帧问题。
[优化] layer.load(3) 资源，由 gif 升级为 svg，解决矢帧问题。
[升级] layer-vue 到 1.9.0 版本。
2.3.6 2023-07-25
[修复] mẫu 组件 thiết lập lại 方法无法清空数组类型数据。
2.3.5 2023-07-21
[修复] lớp 组件 chỉ mục toàn cầu 层级无法共享的问题。
[修复] mẫu 组件 model 属性为深层时，执行 reset 报错问题。
[优化] mẫu 组件 thiết lập lại 方法逻辑，重置后不再重新验证内容。
Nút [优化] 组件 đang tải 属性，为 true 时，禁止 nhấp vào 事件触发。
Nút [优化] 组件 đang tải 属性，为 true 时，保留原有文本。
Nút [优化] 组件 biểu tượng hậu tố 与 biểu tượng tiền tố 属性，增加左右边距。
[文档] 新增 bảng 组件 getCheckData 方法说明。
[文档] 明确 lớp 组件 kết thúc 与 đóng 回调属性说明。
2.3.4 14/07/2023
[修复] tag 组件 loại 属性启用时，biến thể 为 ánh sáng 失效的问题。
[优化] tag 组件 văn bản 颜色随 Css 变量自适应。
2.3.3 11/07/2023
[新增] layer 组件 titleStyle 属性，用于自定义 title 样式。
[新增] tải lên 组件 trướcTải lên 属性 Promise 返回值类型兼容。
[修复] index.umd.js 与 index.es.js 中存在 index.css 的 giải mã 问题。
[修复] tag 组件 loại 属性为 sơ cấp 时不跟随主题色的问题。
[修复] lớp 组件 bán kính đường viền 不跟随 css 变量的问题。
[修复] lớp 组件 按钮 的 bán kính đường viền 不跟随 css 变量的问题。
[优化] đã giải nénKích thước 大小，由 14,5 MB 改善到 8,5 MB。
[优化] index.umd.js có dung lượng 2,6 MB 改善到 1,1 MB。
[优化] cây 组件 OriginalTreeData 类型，移除 trường 无效属性。
[优化] cây 组件 dữ liệu 属性 OriginalTreeData[] 类型兼容。
[优化] lớp 组件消息通知 bán kính đường viền 为 2px。
[优化] lớp 组件，鼠标移入标题栏，根据 di chuyển 属性采用不同的样式。
[升级] layer-vue 到 1.8.11 版本。
2.3.2 2023-06-28
[新增] lớp 组件 btn 属性 phong cách 配置，自定义按钮 Style。
[新增] lớp 组件 btn 属性 lớp 配置，自定义按钮 Lớp。
[新增] chọn 组件 tùy chọn 属性代替 mục 属性。
[新增] cây 组件 biểu tượng nút đuôi 属性,用于设置尾节点图标,通过设置 sai 关闭。
[修复] bảng 组件 trẻ emColumnName 属性无效的问题。
[修复] nhà cung cấp cấu hình 组件 locales 属性 build 时的类型检测问题。
[优化] lớp 组件 layui-layer-btn0 元素跟随主题色。
[补充] bảng 文档 sắp xếp thay đổi 事件说明。
[补充] chọn 组件 mục 属性说明。
[过时] chọn 组件 mục 属性，但仍生效。
2.3.1 18/06/2023
[补充] dạng 组件 chiều rộng nhãn 属性遗漏。
[修正] thẻ 组件 tiêu đề 属性说明，调整为 tiêu đề 属性。
[修复] hộp kiểm 组件 kích thước 属性 da 为 mặc định 时不生效的问题。
[修复] người chọn ngày tháng
[优化] hộp kiểm 组件在 skin 为 mặc định 时在 form-item 中的居中问题。
[优化] hộp kiểm 组件 da 属性为默认值的样式，消除 nhãn 与 biểu tượng 之间的间隙。
[优化] carousel 组件 carousel-item 仅存在一个时，不再显示指示器。
[优化] bàn 组件 Dom 结构，移除无效元素。
2.3.0 12/06/2023
[新增] volar 对 radio-button 与 popconfirm 组件的支持，提供编码提示。
[新增] đầu vào 组件 nối thêm 插槽 bị vô hiệu hóa 参数，表示当前输入框的禁用状态。
[新增] đầu vào 组件 thêm vào trước 插槽 bị vô hiệu hóa 参数，表示当前输入框的禁用状态。
[修复] thanh thông báo 组件 danh sách văn bản 为空时，控制台警告的问题。
[修复] thanh thông báo 组件 danh sách văn bản 远程加载时仅展示首个文本,滚动失效的问题。
[优化] đầu vào bị vô hiệu hóa 属性启用时,禁用效果不再覆盖整个 đầu vào 输入框。
[优化] cây 组件，showLine 为 false 时，尾节点的缩进宽度与其他节点不一致的问题。
[优化] cây 组件，showLine 为 sai 时，节点在展开与收起时，图标无区别的问题。
[优化] cây 组件，showLine 为 sai 时 di chuột 状态 bán kính đường viền 跟随 css 变量。
[优化] cây 组件，移除 trang trí văn bản: gạch chân 标题样式。

2.2.x
2.2.2 09/06/2023
[修复] nhóm thẻ kiểm tra 在 nhu cầu 环境 index.css 找不到的问题。
2.2.1 08/06/2023
[新增] cây 组件 đã chọnKey 受控属性，用于设置选中节点。
[修复] thẻ kiểm tra 在 nhu cầu 环境无法正式使用的问题。
[修复] nhóm thẻ kiểm tra 在 nhu cầu 环境无法正式使用的问题。
[优化] trang 组件 showCount 属性启用时，不再显示总页码，仅显示总条数。
2.2.0 03/06/2023
[新增] bảng 组件 cột 配置 ẩn 属性，设置隐藏列，默认为 sai。
[新增] form 组件 label-wdith 属性，用于统一设置 form-item 标签宽度。
[新增] color-picker 组件 size 属性，默认值为 md, lg sm xs 为可选值。
[新增] icon-picker 组件 size 属性，默认值为 md, lg sm xs 为可选值。
[新增] mẫu 组件 kích thước 属性,加入 đầu vào 等组件兼容,全局设置表单尺寸。
[新增] form-item 组件 size 属性，默认值为 md, lg sm xs 为可选值。
[优化] Cascader 组件，统一 sm xs lg md 尺寸宽度皆为 220px。
[优化] nút radio 组件，移除 lề dưới: 5px 外边距。
Nút [优化] 组件 sm 与 xs 样式规范，高度调整为 32px 与 26px。
[优化] người chọn màu
[优化] radio 组件 size 属性，不同值下给定不同的尺寸。
[优化] chọn 组件 多选模式 在 mẫu 组件方框风格下的样式问题。
[优化] cây-chọn 组件 多选模式 在 mẫu 组件方框风格下的样式问题。
[优化] thẻ-đầu vào 组件在 mẫu 组件方框风格下的样式问题。
[优化] hộp kiểm 组件在不同尺寸下 biểu tượng 与 nhãn 的间隔问题。
[优化] chọn 组件多选模式下复选框与文本之间的间隔过大的问题。

2.1.x
2.1.4 01/06/2023
[修复] nhóm tùy chọn chọn 组件按需场景无法找到 index.less 的问题。
2.1.3 01/06/2023
[修复] tab 组件 tiêu đề 属性缺失响应式的问题。
tab [修复] biểu tượng 组件 属性缺失响应式的问题。
[修复] tab 组件 có thể đóng được 属性缺失响应式的问题。
[修复] bảng đang tải 无边距的问题,加入 phần đệm trên cùng 与 phần đệm dưới cùng 30px。
[修复] build 构建时 vue-tsc 的类型检测问题。
[文档] séc 组件 đơn 属性说明完善，并修正案例。
2.1.2 31/05/2023
[新增] tiêu đề lớp 组件 插槽,提供标题自定义的能力。
[优化] tự động điền
[优化] tự động hoàn thành 组件下拉面板滚动条样式。
[升级] layer-vue 1.8.8 版本。
2.1.1 2023-05-28
[修复] bàn
[修复] bàn
[修复] hộp kiểm 组件 skin 默认样式 nhãn 与 biểu tượng 高度不一致。
[修复] tag 组件 type 属性为 sơ cấp 时，颜色为 #16baaa。
2.1.0 18/05/2023
[新增] nhóm séc 组件 đơn 属性，用于开启单选模式，默认为 sai。
[修复] chọn cây dữ liệu 组件 属性响应式填充造成 đầu vào 无法回显的问题。

2.0.x
2.0.5 2023-05-22
[修复] switch 组件在 form-item 中非 pane 模式中，仍存在左边距的问题。
[修复] hộp kiểm 组件在 form-item 中非 pane 模式中,仍存在左边距的问题。
[修复] rate 组件在 form-item 中非 pane 模式中，仍存在左边距的问题。
[修复] radio 组件在 form-item 中非 pane 模式中，仍存在左边距的问题。
2.0.4 2023-05-21
[优化] checkcard 组件在 form-item 组件中贴边的问题。
[优化] switch 组件在 form-item 组件中贴边的问题。
[优化] radio 组件标签右侧内边距为 2px。
[优化] radio 组件标签颜色为 #666。
2.0.3 2023-05-20
[修复] nhóm thẻ kiểm tra 组件 modelValue 属性不是响应式的问题。
[修复] nhóm thẻ kiểm tra bị vô hiệu hóa 属性不生效的问题。
[修复] checkcard.md 案例图片资源失效的问题。
2.0.2 19/05/2023
[修复] bảng 组件 hộp kiểm 与 radio 列同时存在,getCheckData获取数据重复的问题。
[修复] bảng 组件 getCheckData 方法无法获取树表格二级以上的数据。
2.0.1 18/05/2023
[修复] Cascader 组件无法正常渲染的问题。
[优化] trình chọn biểu tượng 组件在 mục biểu mẫu 的 nội tuyến 模式中，高度与其他组件不统一的问题。
[优化] số đầu vào 组件在 mục biểu mẫu 的 nội tuyến 模式中，高度与其他组件不统一的问题。
[优化] công cụ chọn biểu tượng hoặc biểu mẫu mục
2.0.0 18/05/2023
[新增] lĩnh vực 组件 tiêu đề 插槽，支持标题自定义。
[修复] cây 组件 showCheckbox 属性启用时,tiêu đề 与 hộp kiểm 的异常间隔。
[修复] công cụ chọn biểu tượng.
[修复] chú giải công cụ 组件，面板边角不跟随主题变量的问题。
[修复] sụp đổ
[修复] thanh trượt
[调整] chú giải công cụ 组件 is-dark 属性默认值由 đúng 调整为 sai。
[主题] toàn cầu-màu chính 变量默认值由 #009688 调整为 #16baaa。
[主题] Global-checked-color 变量默认值由 #5FB878 调整为 #16b777。
[文档] nút radio 说明从 radio 文档剥离，独立为单独的菜单项。
[文档] sụp đổ 折叠面板文档更新,补充案例说明。
[文档] hình thức 表单文档更新,补充案例说明。
[升级] layer-vue 到 1.8.5 版本。
Nút chọn
[新增] nút radio 组件 tên 属性,đầu vào 原生 tên 属性。
[新增] nút radio 组件 giá trị mô hình 属性，用于设置当前选中值。
[新增] nút radio đã bị vô hiệu hóa 属性,用于设置单选按钮禁用状态。
[新增] nút radio 组件 nhãn 属性与 nhãn 插槽,用于设置单选按钮文本值。
[新增] giá trị 组件 của nút radio 属性，用于设置单选按钮绑定值。
[新增] kích thước nút radio 组件 属性,用于设置单选按钮尺寸。
[新增] nút radio 组件 thay đổi 属性，值改变时触发。
Thẻ séc
[新增] thẻ kiểm tra 组件,通过卡片的形式提供多选操作。
[新增] thẻ kiểm tra tiêu đề 组件 属性与插槽,用于设置标题。
[新增] thẻ kiểm tra 组件 mô tả 属性与插槽,用于设置描述。
[新增] thẻ kiểm tra 组件 avatar 属性与插槽,用于设置头像。
[新增] checkcard 组件 defaultĐã kiểm tra 属性，用于设置默认选中。
[新增] thẻ séc 组件 bị vô hiệu hóa 属性，用于设置禁用。
[新增] thẻ séc 组件 thêm 属性与插槽,用于设置扩展内容。
[新增] bìa thẻ 组件 属性与插槽,用于启用图片选项。
[新增] nhóm thẻ kiểm tra 组件,多选卡片组,用于配合 thẻ kiểm tra 使用。
[新增] nhóm thẻ kiểm tra 组件 bị vô hiệu hóa 属性，开启整体禁用。
[新增] nhóm thẻ kiểm tra 组件 modelValue 属性，用于设置默认选项。
[新增] nhóm thẻ kiểm tra 组件 thay đổi 事件，用于监听选项变化。
Hình thức
[新增] mẫu 组件 nhãn-vị trí 属性,设置包括的 mẫu-item 组件 nhãn 位置。
[修复] mẫu 组件 pane 属性启用时,label 属性缺省时仍显示占位元素的问题。
[修复] form 组件 pane 属性启用时,form-item 边框角度不跟随 bán kính biên giới toàn cầu 变量的问题。
[修复] chế độ 组件 biểu mẫu 属性为 nội tuyến 时，表单项仍以 khối 的形式排布。
[修复] mẫu-item 组件 bắt buộc 图标颜色不跟随 toàn cầu-nguy hiểm-màu 变量的问题。
[修复] form-item 组件中的 rate 与 switch 组件不居中的问题。
[调整] form-item 组件 require 图标和标题间距，增加适当间距。
[调整] chế độ 组件 biểu mẫu 属性为 nội tuyến 时，宽度由 190px 调整为 220px。
Chọn cây
[新增] cây-chọn 组件 tìm kiếm 属性，启用下拉树节点搜索功能。
[新增] tree-select 组件 contentStyle 属性，用于设置面板的 style 样式。
[新增] tree-select 组件 contentClass 属性，用于设置面板的 class 属性。
[修复] cây-chọn 组件 多选模式,giá trị 在 tùy chọn 中不存在时,回显 không xác định 的问题。
[修复] cây-chọn 组件 多选模式,giá trị 在 tùy chọn 中不存在时,tag 无法删除的问题。
[优化] cây-chọn 组件 bội số 属性为 true 时，值类型错误的异常提示信息。
[优化] cây chọn nội dung 组件 样式，增加最大高度，超出后滚动展示。
Bàn
[新增] bảng 组件 getCheckData 方法，用于获取选中数据，而不仅仅是选中主键。
[修复] bảng 组件 sắp xếp 字段点击排序时，其他已排序字段状态不重置的问题。
[修复] bảng 组件 sắp xếp 字段点击排序时,thay đổi sắp xếp 事件始终为 asc 与 desc 的问题。
[修复] bàn 组件 chiều cao 属性的异常警告,兼容 chuỗi 类型。
[修复] bàn
[优化] bàn 组件 cơ thể 滚动条样式，使其更贴合现今流行的审美。
[优化] bàn 组件 筛选列 下拉面板最大高度,超出后滚动展示。
[优化] bảng 组件 loading 图标不随 bảng 高度垂直居中的问题。
[调整] bảng 组件 đang tải 图标尺寸与颜色。
Lựa chọn
[新增] nhóm tùy chọn chọn 组件,为 tùy chọn chọn 提供分组。
[新增] nhóm tùy chọn chọn 组件 nhãn 属性,用于设置 tùy chọn 分组名称。
[修复] chọn 组件 多选模式,giá trị 在 tùy chọn 中不存在时,回显 không xác định 的问题。
[修复] chọn 组件 多选模式,giá trị 在 tùy chọn 中不存在时,tag 无法删除的问题。
[优化] chọn danh sách thả xuống 组件 下拉面板 cuộn 样式。
Bộ chọn ngày
[修复] người chọn ngày tháng
[修复] công cụ chọn ngày và giá trị mô hình 属性不能为 null 的问题。
[修复] date-picker 组件 model-value 属性不能在 onMounted 中赋值的问题。
[优化] công cụ chọn ngày 组件 nội dung 滚动条 Css 样式。
Xác nhận Pop
[新增] popconfirm 组件 bị vô hiệu hóa 属性，用于设置禁用状态。
[新增] popconfirm 组件 confirmText 属性，用于设置确认操作文本内容。
[新增] popconfirm 组件 cancelText 属性，用于设置取消操作文本内容。
[新增] popconfirm 组件 nội dung 属性 / 插槽,用于定义提示内容。
[新增] popconfirm 组件 btn-Align 属性,用于设置操作按钮对齐方式。
[新增] popconfirm 组件 confirm 事件，用于实现确认回调逻辑。
[新增] popconfirm 组件 cancel 事件，用于实现取消回调逻辑。
[新增] popconfirm 组件 trigger 属性, 用于设置触发方式。
[新增] popconfirm 组件 vị trí 事件，用于设置面板的显示位置。
Lớp
[新增] lớp 组件 thành công 回调函数 id 参数。
[新增] lớp 组件 kết thúc 回调函数 id 属性。
[新增] lớp 组件 đóng 回调函数 id 属性。
[新增] lớp 组件 moveStart 回调函数 id 属性。
[新增] lớp 组件 moveEnd 回调函数 id 属性。
[修复] lớp 组件 closeBtn 属性为 1 时，关闭按钮无法正常显示的问题。
[修复] lớp 组件 maxmin 属性开启时，最小化内容溢出的问题。

1.12.0
1.12.0 2023-04-25
[新增] nút radio 组件，通过按钮的形式展现单选操作, 可以与 nhóm radio 配合。
[新增] nút radio 组件 giá trị mô hình 属性，用于设置当前选中值。
[新增] nút radio 组件 tên 属性,đầu vào 原生 tên 属性。
[新增] nút radio 组件 nhãn 属性与 nhãn 插槽,用于设置单选按钮文本值。
[新增] giá trị 组件 của nút radio 属性，用于设置单选按钮绑定值。
[新增] nút radio đã bị vô hiệu hóa 属性,用于设置单选按钮禁用状态。
[新增] kích thước nút radio 组件 属性,用于设置单选按钮尺寸。
[新增] nút radio 组件 thay đổi 属性，值改变时触发。
[修复] form-item và console.log 代码。
[修复] vue-tsc 检测错误,固化 vue-tsc 版本。
[优化] từ mục 组件 nhãn 属性与 nhãn 插槽不存在时,labelWidth 不再生效。
[文档] radio.md 新增单选按钮的代码案例。
[文档] select.md là một công cụ chọn lọc.

1.11.0
1.11.4 2023-04-22
[修复] hộp kiểm 组件 nhãn 属性不启用时，biểu tượng 发生偏移的问题。
[修复] hộp kiểm 组件在 ô bảng 中默认无法居中的问题。
1.11.3 19/04/2023
[修复] @postcss/autoprefixer 产生的 Thay thế điền có sẵn để kéo dài 警告。
[优化] hộp kiểm 组件 nhãn 标签与 biểu tượng 图标不居中对齐的问题。
[优化] hộp kiểm kích thước 组件 属性启用时，不同尺寸下的 biểu tượng 大小。
[文档] thời gian chuyển tiếp 组件 属性的类型与默认值说明。
1.11.2 2023-04-15
[修复] Codeandbox 演示地址链接失效的问题。
[修复] bộ chọn màu 组件 modelValue 属性缺少响应式的问题。
[优化] công cụ chọn màu 组件 eyeDropper 属性启用时的图标，由 svg 调整为内置 iconfont 图标项。
[优化] nhập mật khẩu 组件 属性启用时的图标，由 svg 调整为内置 iconfont 图标项。
1.11.1 13/04/2023
[修复] bộ chọn biểu tượng 组件 TotalPage 出现小数的问题。
[修复] công cụ chọn biểu tượng
1.11.0 13/04/2023
[新增] bảng 组件 sắp xếp thay đổi 事件，在 cột 排序时触发。
[修复] nhà cung cấp cấu hình 组件 themeVariable 属性在夜间模式下不生效的问题。
[修复] tab 组件 tóm tắt 风格中标题颜色由 màu cơ bản 调整为 màu kiểm tra 变量。
[修复] trang 组件 chủ đề 属性缺省，主题色不跟随 nhà cung cấp cấu hình 组件配置。
[修复] công cụ chọn ngày là nhà cung cấp cấu hình và nhà cung cấp cấu hình 组件配置。
[修复] webpack 构建项目时,因为 rung cây 造成 index.css 丢失。
[升级] Icons-vue 到 1.1.0 版本。
[升级] layer-vue 到 1.8.2 版本。
biểu tượng
[新增] biểu tượng 组件 loại 属性 layui-icon-help-circle 值, HelpCircleIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-tips-fill 值, TipsFillIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-test 值, TestIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-clear 值, ClearIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-bàn phím 值, KeyboardIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-backspace 值, BackspaceIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-show 值, ShowIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-hide 值, HideIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-error 值, ErrorIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-success 值, SuccessIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-câu hỏi 值, Câu hỏiIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-lock 值, LockIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-moon 值, MoonIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-github 值, GithubIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-disabled 值,DisabledIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-gitee 值, GiteeIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-eye-vô hình 值, EyeInvisibleIcon 图标组件。
[新增] biểu tượng 组件 loại 属性 layui-icon-eye 值, EyeIcon 图标组件。
lớp
[新增] lớp 组件 trướcĐóng 回调函数，他将在关闭前触发，你可以通过 trả về sai 来阻止关闭。
[修复] lớp 组件 maxmin 属性在首次拖拽前，无法正常最小化的问题。

1.10.0
1.10.1 08/04/2023
[修复] mẫu 组件 mô hình 属性中对象字段为 0 时，总是验证为空的问题。
[修复] mẫu-item 组件 prop 属性无法深度取值的问题。
[优化] mẫu-item 组件 prop 属性，区分深层与浅层取值的逻辑。
1.10.0 06/04/2023
[新增] mẫu 组件 pane 属性，开启表单面板风格。
[修复] công cụ chọn ngày 组件 phạm vi 启用时，因 biên giới 属性而造成的高度不严格问题。
[修复] chuyển giao 组件处于 tìm kiếm 状态时，未被过滤选中的数据会被移回左侧的问题。
[优化] es 产物 giải mã 没有被 Cây rung chuyển, 从而造成应用构建产物体积过大的问题。
[文档] nút.md 页面更新 thả xuống + nút + nhóm nút 实现的案例。
[文档] menu.md 页面更新 thụt lề 属性描述错误。
[升级] layer-vue 到 1.8.0 版本。
lớp
[新增] layer 组件 moveOut 属性，默认只能在窗口内拖拽，如果你想让拖到窗外，那么设定 true 即可。
[新增] lớp 组件 moveEnd 回调函数，默认不会触发，如果你需要，设定 moveEnd: function(){} 即可。
[新增] lớp 组件 moveStart 回调函数，默认不会触发，如果你需要，设定 moveStart: function(){} 即可。
[优化] biểu tượng lớp 组件 属性为 1 2 3 4 5 6 7 时的图标集合。

1.9.x
1.9.8 30/03/2023
[新增] tải lên 组件 onProgress 属性，上传过程回调，本质为 xhr.upload.onprogress 回调函数。
[优化] bảng 组件 autoColsWidth 属性，支持树表的列宽计算。
1.9.7 2023-03-29
[新增] bảng 组件 autoColsWidth 属性，列宽自动计算，最大程度利用空间，默认为 false。
[新增] bộ chọn ngày 组件 phạm vi 属性为 đúng 且 loại 属性为 thời gian 的时间范围选择面板。
[新增] layui-vue 安装的 tùy chọn 选项 zIndex 配置,用于设置 lớp 的 z-index 起始值。
[修复] thả xuống, chọn, chọn ngày bị vô hiệu hóa 属性，修改值报错。
[修复] datepicker 组件 range 启用时，内容没有沾满实际宽度，从而导致诡异的后边距。
[优化] bảng 组件 mặc định-mở rộng-tất cả 属性，使其具备响应式的能力。
1.9.6 2023-03-24
[新增] volar 的自动提示功能提供支持。
[优化] menu phụ 组件 id 属性为非必填,常用于静态展示,不需要 id 属性完成联动的场景。
[优化] menu-item 组件 id 属性为非必填,常用于静态展示,不需要 id 属性来完成联动的场景。
[优化] bảng 组件 selectedKeys 与 ExpandKeys 属性，由 Recordable[] 修改为 string[] 类型。
1.9.5 2023-03-22
[修复] cây-chọn 组件 modelValue / v-model 属性为空，input 组件回显不更新的问题。
[修复] tự động hoàn thành kích thước 组件
[修复] tree-select 组件 multiple 属性启用时,v-model / modelValue 不支持 null 值的问题。
[修复] chọn 组件 nhiều 属性启用时, v-model / modelValue 不支持 null 值的问题。
1.9.4 2023-03-22
[新增] bảng 组件 thay đổi kích thước 属性,用于开启列宽拉伸,cột 存在同名属性,可用于开启某一列宽拉伸。
[新增] tự động hoàn thành kích thước 组件 属性,用于设置 đầu vào 输入框尺寸。
[新增] tải lên 组件 trước khi tải lên 属性,用于设置上传前回调,参数为 file | tập tin[],通过返回 sai 来阻止上传。
[优化] bảng 组件 tiêu đề 样式，移除定位属性，避免与 lớp 不必要的层级冲突。
[修复] người chọn ngày
1.9.3 17/03/2023
[新增] bảng 组件 bán kính đường viền bảng Css3 变量。
[新增] dropdown 组件 dropdown-content-border-radius Css3 变量。
[优化] tự động hoàn thành 组件 đã chọn 样式，输入内容与提示内容相匹配时，使用次色标注。
[优化] danh sách thả xuống bán kính biên giới toàn cầu 变量对 组件下拉面板的样式影响。
[优化] bán kính biên giới toàn cầu 变量对 bảng 组件样式影响。
[优化] bảng 组件 trang 分页栏样式，修改 chọn 高度为 26px。
1.9.2 13/03/2023
[新增] tự động hoàn thành 组件，带提示的文本输入框，用于辅助输入。#I6JSOA
[新增] trang 组件 showPage 属性开启时, 显示首页直达功能，从而改善易用性。#I69ZW6
[优化] trang 组件 giới hạn 所依赖的原生 chọn 高度, 使其与其他元素保持一致。
tự động hoàn thành
[新增] tự động hoàn thành tên 组件 属性, nhập 原生 tên 属性。
[新增] tự động hoàn thành 组件 cho phép rõ ràng 属性, 用于开启清空操作。
[新增] tự động hoàn thành 组件 bị vô hiệu hóa 属性, 用于设置输入框禁用状态。
[新增] autocomplete 组件 placeholder 属性, 用于设置输入框提示信息。
[新增] tự động hoàn thành 组件 tìm nạpSuggestions 属性, 输入时的回调方法,用于查询建议列表。
[新增] tự động hoàn thành 组件 nội dungStyle 属性, 继承至 thả xuống 组件，用于设置下拉面板的 phong cách 属性。
[新增] tự động hoàn thành nội dung 组件Class 属性, 继承至 thả xuống 组件，用于设置下拉面板的 lớp 属性。
[新增] tự động hoàn thành 组件 autoFitWidth 属性, 继承至 thả xuống 组件, 继承至 thả xuống Bạn có thể làm được điều đó.
1.9.1 09/03/2023
[新增] trang 组件 showPage 属性开启时, 显示最后一页直达功能，从而改善易用性。#I69ZW6
[修复] bảng 组件 cột 中 loại 属性为 số 的列，不会被导出的问题。#I6KXVD
[修复] bảng 组件导出功能,如果匹配不到字段不创建列结构,导致 excel 整体错位的问题。#I6KXVD
[修复] bảng 组件 cột 中包含 trẻ em 属性的 cột 设置 cố định 属性不生效的问题。#I6L4AY
[优化] bảng 组件 cột 中 gõ 属性为 hộp kiểm 或 radio 的列，不再被导出。#I6KXVD
1.9.0 05/03/2023
[新增] đầu vào 组件 tiêu điểm 与 mờ 方法, 通过方法调用促使 đầu vào 获取焦点。
[新增] vùng văn bản 组件 tiêu điểm 与 làm mờ 方法, 通过方法调用促使 vùng văn bản 获取焦点。
[新增] các loại 目录 thành phần.d.ts 声明文件, web-types.json, attribute.json và tags.json 配置文件。
[优化] tải lên 组件 cutOptions.layerOption.area 属性, 默认值由 ["640px","640px"] 修改为 "auto"。
[优化] chọn 组件 nhiều 属性为 true 时, 传递非 mảng 类型数据时的异常信息。
[重要] tải lên 组件 nhiều 为 sai 时, 上传时 file[0] 字段修改为 file 字段。破坏性
lớp
[新增] lớp chân trang 组件 插槽, 自定义底部内容, 用于完成高度自定义的操作栏。
[新增] lớp 组件 btn 数组内对象的 bị vô hiệu hóa 属性, nút 用于设置 的禁用状态。
[新增] lớp 组件 offset 属性 `tl` `tr` `bl` `br` 可选值, 在 ngăn kéo 模式时, 首个字母决定动画方向。
[修复] lớp 组件 offset 属性为 `t` `l` `b` `r`, 并且宽高不是 100% 时, 位置不居中的问题。
[修复] layer 组件 title 属性作为 ref 响应值时, 内容高度不随之动态计算,而导致内容超出窗体本身尺寸。
[修复] lớp 组件 loại 属性为 4 或 `ngăn kéo` 并且 offset 属性缺省的情况下弹窗居中显示的问题。
[修复] lớp 组件 z-index 属性不为空时, 在操作弹窗时会被置顶逻辑覆盖的问题, 优化为 z-index存在值时, 禁用置顶。
[修复] lớp 组件 offset 属性的单位为 % 时, 实际位置会减去弹窗宽高/2长度的问题。
[优化] lớp 组件 loại 属性为 thông báo 或 4 类型的样式, 关闭按钮的位置, 标题与内容间距,边框颜色与阴影等。
[优化] lớp 组件 khu vực 属性高度自适应, 并兼容一下三种高度自适应写法 khu vực: "300px" || ["300px", "tự động"] || ["300px"]。
[优化] lớp 组件 loại 属性为 ảnh 时, 标题闪烁的问题, 调整为淡入淡出。
[优化] lớp nội dung 组件 高度自适应逻辑, 由 js 计算调整为 flex 响应式布局。
[升级] layer-vue 到 1.6.0 版本。

1.8.x
1.8.10 2023-02-19
[修复] lớp 与 thả xuống 的层级错误, 无法在 lớp 中正常显示的问题。
1.8.9 19/02/2023
[修复] lớp 组件在创建多个时, z-index 层级无法自增的问题。
[修复] tải lên 组件裁剪后的文件固定为 image/png 类型, 与裁剪前不一致的问题。
[优化] Huy hiệu 公共工具打包到 目录的问题, 在 es 模式时 huy hiệu 组件被其他组件导入的问题。
[优化] tải lên 组件 cut-options 属性, 修复其响应式特性失效的问题。
[优化] lớp 组件在点击标题时, 置于所有已存在的弹出层最顶部。
[优化] 移除 vue/reactivity 在源码中的使用, 从而改善打包。
[升级] @vueuse/core 到 9.12.0 版本。
[升级] layer-vue 到 1.4.9 版本。
1.8.8 17/02/2023
[修复] lớp 组件 z-index 缺少响应式特性的问题。
[修复] page 组件 showPage 为 true 时, 上下页操作处于禁用状态的问题。
[升级] layer-vue 1.4.8 版本。
1.8.7 2023-02-06
[新增] cây 组件 mở rộngKeys 属性, 用于设置展开节点
[新增] Cascader 组件 ChangeOnSelect 属性，用于开启选择即改变功能。
[新增] textarea 组件 autosize 属性, 根据内容宽度自适应默认高度。
[新增] textarea 组件 rols 属性, 原生属性。
[新增] textarea 组件 cols 属性, 原生属性。
[修复] vùng văn bản 组件 chiều rộng 和 chiều cao 样式不生效的问题。
1.8.6 2023-02-03
[新增] bảng 组件列插槽 hàng cột hàngChỉ mục cộtChỉ số 参数。
[修复] tải lên 组件 trước 事件重复回调的问题。
[修复] tải lên 组件 layerOption 设置后，默认配置失效的问题。
[过时] bảng 组件列插槽 dữ liệu 参数。
1.8.5 2023-01-24
[修复] tải lên 组件 cutOption 配置中 copperOption 属性不生效的问题。
[修复] form-item 组件在 unmount 卸载时，不会在 form 中注销，导致不正确的验证逻辑。
[修复] bảng 组件 cột 多级表头 trẻ em 配置启用时，尾节点的右边框不显示。
1.8.4 11/01/2023
[新增] bảng 组件 customSlot 插槽 cột 参数，用于获取当前渲染的列信息。
[修复] tree-select 组件 v-model 属性设置 null 与 không xác định 时，trình giữ chỗ 不生效。
[修复] select 组件 v-model 属性设置 null 与 không xác định 时，giữ chỗ 不生效。
[修复] bảng 组件 cột 属性配置 trẻ em 插槽不生效的问题。
1.8.3 2023-01-06
[修复] chọn cây
[修复] chọn cây kiểm tra 组件 Nghiêm ngặt 属性为 sai 时，删除父节点子节点不删除的问题。
[修复] công cụ chọn ngày 组件范围选择, gõ 属性为 năm tháng 时右下角仍展示具体日期的问题。
[修复] đầu vào kiểu 组件 属性 bán kính đường viền 设置过大导致的边角缺失。
[修复] đầu vào 组件 loại 属性为 số 时显示原生加减操作的问题。
[文档] 主题配置 "重置配置" 功能实现。
1.8.2 2022-12-29
[修复] select 组件多选模式 giữ chỗ 在有选中值时仍显示的问题。
[修复] tree-select 组件多选模式 giữ chỗ 在有选中值时仍显示的问题。
[修复] cây-chọn 组件多选模式点击 + - 号仍触发 thay đổi 事件的问题。
1.8.1 2022-12-29
[修复] huy hiệu 组件 màu 属性失效的问题。
[修复] mã vạch 组件属性缺少响应式的能力。
[修复] treeSelect 多选模式 值 无法删除的问题。
[修复] treeSelect 多选模式 thay đổi 事件多次触发的问题。
[修复] qrcode 组件 nềnColor 属性必填警告。
[修复] qrcode 组件属性缺少响应式的能力。
[修复] qrcode 组件 chiều rộng 属性必填警告。
[修复] qrcode 组件 màu 属性必填警告。
1.8.0 2022-12-29
Chọn cây
[新增] cây-chọn 组件 v-model 属性，用于设置当前选择值。
[新增] chọn cây dữ liệu 组件 属性，用于设置树数据。
[新增] chọn cây 组件 bội số 属性，用于设置开启多选模式。
[新增] cây-chọn 组件 cho phép rõ ràng 属性，用于开启清空操作。
[新增] chọn cây bị vô hiệu hóa 属性，用于禁用选择。
[新增] tree-select 组件 placeholder 属性，用于设置提示信息。
[新增] cây-chọn 组件 kiểm traNghiêm ngặt 属性，用于禁用复选框的级联逻辑。
[新增] chọn cây 组件 thu gọnTagsTooltip 属性，用于开启多选值折叠显示。
[新增] tree-select 组件 minCollapsedNum 属性，用于设置超过指定标签数量后开启折叠。
[新增] tree-select 组件 size 属性，用于设置组件尺寸。
Mã QR
[新增] qrcode 组件 văn bản 属性，用于设置二维码实际值。
[新增] qrcode 组件 màu 属性，用于设置二维码前景色。
[新增] qrcode 组件 màu nền 属性，用于设置二维码背景色。
[新增] qrcode 组件 chiều rộng 属性，用于设置二维码宽度。
Mã vạch
[新增] mã vạch 组件 giá trị 属性，用于设置条形码实际值。
[新增] mã vạch 组件 màu dòng 属性，用于设置条形码颜色。
[新增] mã vạch 组件 chiều rộng 属性，用于设置条形码每条之间的宽度。
[新增] mã vạch 组件 chiều cao 属性，用于设置条形码高度。
[新增] mã vạch 组件 lề 属性，用于设置条形码周边空白间距。
[新增] mã vạch 组件 displayValue 属性，用于设置显示条形码实际值。
[新增] mã vạch 组件 văn bản 属性，用于覆盖默认的文本信息。
[新增] mã vạch 组件 nền 属性，用于设置条形码背景色。
[新增] định dạng mã vạch 组件 属性，用于设置条形码类型。
其他
[新增] mục menu 组件 to 属性,路由目标地址,设置该属性后,开启 router 模式。
[修复] bảng 组件 cột 配置值变动时，旧的 cột 配置未被清空的问题。
[修复] Cascader 组件 v-model 属性不为空时，初始化触发 thay đổi 回调的问题。
[修复] Cascader 组件 v-model 属性值更新时，回显失效的问题。
[修复] huy hiệu chủ đề 组件 属性未设置时, 水波纹效果不生效。
[修复] lớp chọn biểu tượng 的件 的错误命名。
[优化] đầu vào cho phép rõ ràng
[优化] vùng văn bản cho phép rõ ràng
[优化] chọn 组件 cho phép rõ ràng 属性，默认不显示清空按钮，鼠标移入后展示。
[优化] công cụ chọn biểu tượng 组件 cho phép xóa
[优化] bảng 组件 cột 配置 loại 为 số 类型时，起始坐标结合分页数据。

1.7.x
1.7.13 2022-12-18
[修复] chọn phong cách 组件多选模式设置 属性 chiều rộng 宽度失效问题。
[修复] chuyển giao phương thức tìm kiếm 设置后默认检索逻辑仍生效的问题。
[修复] chuyển 组件 chiều rộng 属性受 flex 影响宽度不稳定的问题。
tab [修复] tab
[优化] chuyển 组件 tìm kiếm 属性开启时，拼字阶段仍触发搜索的问题。
[优化] bộ định tuyến 路由拦截添加 nprogress 加载过渡动画。
1.7.12 2022-12-15
[新增] chuyển 组件 leftTitle 插槽, 自定义左侧标题。
[新增] chuyển 组件 rightTitle 插槽, 自定义右侧标题。
[新增] chuyển 组件 phương thức tìm kiếm 方法，自定义搜索逻辑。
[新增] tag-input 组件 nối thêm 插槽, 用于前缀自定义内容。
[新增] tag-input 组件 thêm vào trước 插槽, 用于后缀自定义内容。
[新增] chọn 组件 nối thêm 插槽, 用于前缀自定义内容。
[新增] chọn 组件 thêm vào trước 插槽,用于后缀自定义内容。
[新增] Split-panel-item 组件 không gian 属性百分比数值支持。
[修复] công cụ chọn biểu tượng 组件按需加载 lay-icon 无法解析的警告。
[修复] chuyển 组件 dataSource 配置不存在 title 属性时产生异常。
[修复] bảng 组件 cột 属性动态修改后表格不刷新的响应式问题。
1.7.11 2022-12-05
tab [新增] 组件鼠标滚动功能, 兼容移动端 chạm vào 事件。
[新增] textarea 组件 autosize 属性, 根据内容自适应大小。
[新增] công cụ chọn biểu tượng 组件 cho phép rõ ràng 属性, 开启清空操作。
nút [修复] 组件 夜间模式 下, 普通按钮边框高亮与背景色不一致的问题。
[修复] Cascader 组件 v-model 属性不为空时, 无法正常回显。
[修复] select 组件 muilpart 为 true 时候 placeholder 属性无效。
[修复] page-header 组件 backIcon 插槽 html 中使用无效。
[优化] hộp kiểm 组件 默认主题 下, 勾选框多余的左边框。
[优化] công cụ chọn biểu tượng 组件 下拉 图标, 在打开关闭时赋予不同的状态。
[优化] table 组件 .layui-table-total 背景色 đã sửa 字段不生效的问题。
[优化] lớp 组件 thành công 回调执行时机。
1.7.10 2022-11-30
[修复] chọn phương pháp tìm kiếm 组件 属性, 自定义搜索逻辑不生效。
[优化] chọn 组件文档, 简化使用案例。
1.7.9 2022-11-22
[新增] chọn phương pháp tìm kiếm 组件 属性, 允许自定义搜索逻辑。
[修复] tag 组件 max-width 属性, 内容超出后 `...` 省略符缺失。
[修复] bảng 组件 cột 属性 căn chỉnh 配置失效, 该问题仅存在 1.7.8 版本。
[修复] chọn 组件 build 后, 选中内容无法正确回显。
[修复] tab 组件 build 后, tab-item 无法正确显示, 在嵌套 v-for 时。
[修复] bảng 组件 thanh công cụ mặc định 在配置数组时, 未按顺序渲染。
1.7.8 19/11/2022
[新增] tải lên 组件 auto 属性, 是否自动上传配置。
[修复] bảng 组件 dấu chấm lửngTooltip 属性不生效。
[优化] backtop 组件部分浏览器版本无法正常返回顶部。
[优化] công cụ chọn ngày 组件 btn 操作 bán kính đường viền 样式细节。
[优化] tag-input 组件 maxWidth 属性默认为 100%。
[优化] tag-input 组件 tagWidth 超出 input 宽度时自动省略文本。
[优化] bảng 组件 thanh công cụ mặc định 属性支持 Array 类型, 举例：['print']。
[优化] chọn danh sách thả xuống 组件 关闭时统一清空 tìm kiếm 内容。
1.7.7 11/11/2022
[新增] tải lên văn bản 组件 属性, 设置上传描述。
[新增] tải lên 组件 dragText 属性, 设置拖拽面板提示信息。
[修复] tùy chọn chọn 组件 mặc định 插槽内容为多层元素时, 使用 nhãn 属性值作为回显。
[修复] bước đầu vào số 组件 设置为小数时精度丢失的问题。
[修复] chú giải công cụ 组件临近屏幕边界, 三角位置显示错误。
[优化] tùy chọn chọn 组件 多选 模式只能点击复选框的问题。
[优化] chọn 组件 tìm kiếm 事件在拼字时触发的问题。
[优化] chọn 组件 thay đổi 事件触发时机不恰当的问题。
1.7.6 09/11/2022
[新增] tiêu đề trang 组件 biểu tượng quay lại 插槽, 自定义返回图标。
[新增] tiêu đề trang 组件 biểu tượng phía sau 属性, 自定义返回图标。
[修复] bước đầu vào số 组件 设置为小数时精度丢失的问题。
[修复] datePicker 组件 年选择器 清空后再点击确定回显错误。
[修复] chọn 组件 单选模式 与 多选模式 清空操作样式不统一的问题。
[修复] chọn 组件 单选模式 与 多选模式 下拉宽度不一致的问题。
[修复] chọn 组件 多选模式 @search 事件不生效的问题。
[优化] chọn 组件 nhãn 属性不兼容 số 类型。
[优化] tùy chọn chọn 组件 nhãn 属性为 null 时, 单选不展示。
[优化] select-option 组件 label 属性为 null 时, 搜索报错。
[优化] datePicker 组件 新增change,blur,foucs事件。
1.7.5 2022-11-06
[修复] chọn 组件单选模式验证失败后边框无变化的问题。
[修复] chú giải công cụ 组件临近屏幕边界, 三角位置显示错误。
[修复] tải lên 组件开启 cut 裁剪属性, 取消上传仍会弹出裁剪界面。
[修复] tải lên 组件开启 cut 裁剪属性, 多次上传同文件, 非首次都不会弹出裁剪框。
[优化] sụp đổ 组件 sụp đổTransition 属性开启时, 为下拉图标增加转场动画。
1.7.4 04/11/2022
Nút [新增] 按钮 hoạt động 效果。
[新增] đầu vào 组件 max 与 min 属性, 用于控制 số 类型下手动输入值的范围。
[修复] textarea 组件边框 di chuột 状态颜色和其它 form 系列组件不一样的问题。
[修复] thẻ đầu vào
[修复] tải lên 组件多次上传同一文件时，除了第一次都无法正常触发到@Before和@done 事件。
[修复] chọn 组件 slot 无法正常解决注释的问题。
[修复] tab 组件 slot 无法正常解决注释与 v-if 的问题。
[修复] chọn 单选模式和多选模式, 鼠标悬停时边框颜色不一样的问题。
[修复] vùng văn bản 双向绑定在拼字时触发更新的问题。
[修复] số đầu vào 组件 đầu vào bị vô hiệu hóa 属性开启时，点击减号无效。
[修复] số đầu vào tối thiểu và tối đa 属性在手动输入值的场景下无效。
Nút [修复] bị vô hiệu hóa 属性无效。
[修复] nhóm nút 组件, 个别类型无法正常显示分割线。
[修复] chọn 组件禁用后 仍能清空的问题。
[修复] số đầu vào 组件无法手动输入负数的问题。
[修复] số đầu vào
[修复] số đầu vào
[修复] textarea 和 select 验证失败后边框颜色没有变成红色。
1.7.3 2022-10-27
[修复] bảng 组件 滚动条 拖拽时 tiêu đề 产生错位。
[修复] lớp thông báo 类型 css 丢失的问题。
[优化] lớp 组件 thông báo 类型 lớp 命名规范。
[升级] layer-vue 1.4.7 版本。
1.7.2 2022-10-26
[优化] đầu vào bị vô hiệu hóa 属性禁用效果。
[优化] vùng văn bản bị vô hiệu hóa 属性禁用效果。
[优化] switch 组件 bị vô hiệu hóa 属性禁用效果。
[优化] chọn 组件 bị vô hiệu hóa 属性禁用效果。
[优化] tag-input 组件 bị vô hiệu hóa 属性禁用效果。
[优化] công cụ chọn màu bị vô hiệu hóa 属性禁用效果。
[优化] Cascader 组件 bị vô hiệu hóa 属性禁用效果。
[优化] trình chọn biểu tượng bị vô hiệu hóa 属性禁用效果。
1.7.1 2022-10-26
[新增] bộ chọn ngày 组件 giữ chỗ 属性 mảng 类型兼容。
[修复] công cụ chọn ngày 组件 phạm vi 属性为 true 时的 国际化 翻译失效。
[修复] công cụ chọn ngày 组件 phạm vi 属性为 true 时的 lay-dropdown 无法解析警告。
[修复] tải lên 组件 裁剪 案例不生效问题, 前提需要 hình ảnh chấp nhậnMime 为 值。
[优化] tải lên 组件 i18n 国际化支持。
1.7.0 2022-10-24
[新增] chọn 组件 nội dungClass 属性, 用于自定义内容区域 lớp 属性。
[新增] chọn 组件 contentStyle 属性, 用于自定义内容区域 phong cách 属性。
[新增] trình chọn biểu tượng 组件 bị vô hiệu hóa 属性, 禁用颜色选择。
[新增] icon-picker 组件 contentClass 属性, 用于自定义内容区域 lớp 属性。
[新增] công cụ chọn biểu tượng 组件 contentStyle 属性, 用于自定义内容区域 phong cách 属性。
[新增] bộ chọn màu 组件 bị vô hiệu hóa 属性, 禁用图标选择。
[新增] color-picker 组件 contentClass 属性, 用于自定义内容区域 lớp 属性。
[新增] bộ chọn màu 组件 nội dungStyle 属性, 用于自定义内容区域 phong cách 属性。
[新增] Cascader 组件 bị vô hiệu hóa 属性, 禁用数据选择。
[新增] Cascader 组件 contentClass 属性, 用于自定义内容区域 lớp 属性。
[新增] Cascader 组件 contentStyle 属性, 用于自定义内容区域 phong cách 属性。
[新增] công cụ chọn ngày 组件 nội dungClass 属性, 用于自定义内容区域 lớp 属性。
[新增] công cụ chọn ngày 组件 contentStyle 属性, 用于自定义内容区域 phong cách 属性。
[修复] bộ chọn ngày 组件 loại 属性为 ngày 值, phạm vi 属性为 đúng 时, 结束月份出现 13 月的问题。
[修复] không gian 组件 kích thước 属性使用内置 chuỗi ['md','sm'] 不生效的问题。
[修复] bảng 组件 nguồn dữ liệu 为空, 表头超出宽度无法滚动的问题。
[修复] trang 组件 trang 属性起始页计算逻辑, 在接近尾页时 trang 页码不对应的问题。
[修复] chọn 组件 nhiều 与 bị vô hiệu hóa 属性同时为 true 时, 禁用效果失效。
[删除] select 组件 show-empty 属性, 由用户自定义 select-option 代替。
[删除] chọn 组件 tin nhắn trống 属性, 由用户自定义 chọn tùy chọn 代替。
[删除] select 组件 placeholder, searchPlaceholder 属性默认值, 由使用者提供。
[优化] chọn 组件 bị vô hiệu hóa 属性效果, di chuột 状态显示禁用光标, 并保持 biên giới 颜色不变。
[优化] đầu vào 组件 bị vô hiệu hóa 属性效果, di chuột 状态保持 viền 颜色不变。
[优化] switch 组件 bị vô hiệu hóa 属性效果, 光标移入圆形白色按钮不显示禁用光标。
[优化] tag-input 组件 bị vô hiệu hóa 属性效果, 与其他组件保持相同设计规范。
[优化] công cụ chọn ngày, trống, trang 组件支持 i18n 国际化。

1.6.x
1.6.9 18/10/2022
[修复] chọn tùy chọn 组件内部维护 时导致的内存溢出问题。
[修复] chọn 组件单选模式 showSearch 属性开启时, 输入框循环重置的问题。
[修复] tải lên 组件 drag 为 true 时, 获取拖拽文件 files 集合失败, 无法正常上传。
[优化] lớp 组件 id 属性, 当值相同时仅保留最新的弹出层实例。
[升级] layer-vue 1.4.6 版本。
1.6.8 14/10/2022
[修复] tải lên 组件 kéo 为 sai 时的 RemoveEventListener 警告。
[修复] tải lên 组件销毁 Drap Drapenter Dragover 事件未注销。
1.6.7 13/10/2022
[修复] menu 组件 ident 属性带来的 bản đánh máy 警告。
[修复] tansfer 组件 nguồn dữ liệu 属性缺少响应式的特性。
[修复] tải lên 组件 drag 属性开启后, 拖拽上传无效的问题。
[优化] switch 组件 on-switch-text 和 un-switch-text 属性, 为描述提供适当边距。
[优化] nhà cung cấp cấu hình 组件 dark-partial 属性默认值, 降低整体饱和度。
1.6.6 11/10/2022
[新增] menu 组件 ident 属性, 用于开启目录缩进与缩进尺寸。
[新增] bảng 组件 cột 配置 phương pháp tổng hàng 属性, 用于自定义列统计逻辑。
[修复] bảng 组件 cột 配置 cố định 属性, 特殊情况下的列空白问题。
[修复] talle 组件 hàng bảng 行 algin 等属性, 不跟随 cột 列配置的问题。
[修复] bảng 组件 hàng bảng 行 cố định 属性不生效的问题。
1.6.5 11/10/2022
[新增] datePicker 组件 gõ 属性为 ngày 与 datetime 时, 支持时间戳传入。
[修复] datePicker 组件 type 属性为 dateTime 时 同时选择日期与时间不生效问题。
[修复] datepicker 组件 loại 属性为 miệng 时, v-model 为 số 类型时, 月份选择显示NaN。
[修复] cây 组件 đã kiểm traKeys 属性赋值默认子集全部选中的问题。
[修复] lớp 组件在高版本 google 中的 event.path 警告信息。
[修复] tùy chọn chọn 组件 mặc định 插槽不可用的问题。
1.6.4 09/10/2022
[修复] đài phát thanh 组件 giá trị 属性不兼容 số 类型而导致类型警告。
[修复] bảng 组件 .layui-table-body 增加过渡动画后, 修改 chiều cao 样式, 导致 tiêu đề 错位。
[修复] select-option 组件在伴随 v-if 指令时导致无法正常渲染。
1.6.3 08/10/2022
[修复] chọn tùy chọn 组件 子组件 di chuột 样式缺失。
[修复] chọn tùy chọn 组件下拉图标在选择 后状态不重置的问题。
[修复] chọn 组件多选模式, 选项无法手动删除的问题。
[修复] lớp 组件 kết thúc 回调函数多次触发的问题。
1.6.2 07/10/2022
[修复] tải lên kích thước 组件 属性提示信息单位换算错误。
[修复] cây 组件 checkStrictly 属性为 true 时, 初始数据仍关联选择。
[修复] công cụ chọn biểu tượng 组件 v-model 缺失响应式特性。
[修复] tùy chọn chọn 组件 di chuột 状态的选择样式。
[升级] 升级 vue 3.2.40 与 Typescript 4.8.4。
1.6.1 06/10/2022
[修复] lớp 组件 v-model 默认为 true 时弹出层不显示的问题。
[修复] lớp 组件 thành công 回调函数属性默认显示时不触发的问题。
[修复] lớp tin nhắn 组件 调用 chiều cao nội dung 内容高度计算不正确。
[修复] lớp 组件 btn 与 đóng 操作抖动的问题。
[升级] layer-vue 1.4.3 版本。
1.6.0 04/10/2022
[新增] cây 组件 checkNghiêm ngặt 属性, 开启复选框时解除父子联动关系, 默认为 sai。
[修复] cây 组件 tựa đề 自定义标题插槽, 不生效的问题。
[修复] cây 组件 nút 配置 bị vô hiệu hóa 启用时, @node-click 事件仍触发的问题。
[修复] chọn 组件 nhiều 开启时, 值不存在时导致控制台异常。
[修复] dòng thời gian 组件 tiêu đề 属性必填警告。
[修复] Cascader 组件 trigger 属性必填警告。
[修复] tùy chọn chọn 组件 giá trị 属性 số 类型值警告。
[修复] hộp kiểm 组件 giá trị 属性 số 类型值警告。
[修复] hộp kiểm 组件 nhãn 属性与 mặc định 插槽不设置, layui-checkbox-label 元素仍存在的问题。
[修复] cây 组件 show-checkbox 为 true 时, 复选框与标题间距过宽的问题。
[修复] cây 组件 nút 配置 bị vô hiệu hóa 启用时, 仍会因为父子关联选择。
[修复] bảng 组件 thụt lềKích thước 属性, 在加载远程数据时不生效的问题。
[调整] công cụ chọn ngày 组件 laydate-range-hover 前景色与背景色。

1.5.x
1.5.1 30/09/2022
[新增] avatar 组件 mặc định 插槽, 支持文本头像, 用于复杂场景。
[新增] avatar 组件 icon 属性, 用于展示 iconfont 头像, 默认值为 `layui-icon-username`。
[修复] chọn 组件 nhiều 为 đúng 且 showSearch 为 đúng 时光标为输入, 否则为小手指。
[修复] chọn 组件 slot 延时渲染, 选中项 nhãn 不更新的问题。
1.5.0 2022-09-29
[新增] đầu vào thẻ 标签输入框组件, 用于录入事物的属性与纬度。
[新增] bảng 组件 tiêu đề 插槽, 用于在工具栏与表格之间插入元素。
[新增] tabitem 组件 biểu tượng 属性, 提供 tiêu đề 属性前置 biểu tượng 设置。
[新增] select 组件 searchPlaceholder 属性, 自定义搜索提示信息。
[新增] chọn 组件 minCollapsedNum 属性, 多选模式选中项超过多少时折叠。
[新增] chọn 组件 thu gọnTagsTooltip 属性, 多选模式下是否悬浮显示折叠的选中项。
[修复] Cascader 外部清空 modelValue, 选中项仍不清楚的问题。
[修复] tolltip 组件 nội dung 变化时, 位置无法自动计算调整的问题。
[修复] breadcrumb-item 组件无法正确传递 attrs, 导致 @click 等自定义事件失效。
[修复] bố cục 组件仅引入了 footer 作为内容元素时, layui-layout-vertical 样式不生效, 导致布局错误。
[修复] chọn 组件 bội số 属性为 true 时, 删除选项时清空筛选条件的问题。
[修复] chọn 组件多选模式下提示信息错误, 将 "请选择" 调整为 "请输入"。
[修复] chọn bảng 组件与 组件组合使用时, 下拉内容被遮盖。
[修复] chọn lớp 组件位于 底部时, 点击时出现滚动条。
[修复] chọn 组件外部修改 modelValue 值时, tùy chọn 不选中的问题。
[修复] công cụ chọn biểu tượng 组件 hiển thị tìm kiếm 属性开启时, 搜索不生效的问题。
[修复] thanh thông báo 组件切换页面后, NodeJS.Timeout 定时器不清除的问题。
[优化] trang 组件 giới hạn 逻辑, 切换 giới hạn后,如果页数大于当前页,保持当前页码不变,否则使用最大页码。
[优化] hậu tố đầu vào 组件 插槽与 allow-clear 启用时的显示顺序, clear > hậu tố。
[优化] tag 组件 chiều cao nền biên giới 等, 使其更贴合 layui 的设计规范。
[优化] nhập 组件 hậu tố tiền tố mật khẩu rõ ràng 左右布局, 由 15px 调整至 10px。
[优化] đầu vào 组件 tiền tố 与 tiền tố-icon 存在时, 取消左侧边距缩进。
[删除] chọn 组件 tạo 属性 与 tạo 事件。
