toàn bộ tài liệu có sẵn trong thư mục dự án hoặc chỉ lấy tại đây 

https://www.layui-vue.com/zh-CN/guide/introduce
https://www.layui-vue.com/zh-CN/guide/getStarted
https://www.layui-vue.com/zh-CN/guide/changelog
https://www.layui-vue.com/zh-CN/guide/theme
https://www.layui-vue.com/zh-CN/guide/dark
https://www.layui-vue.com/zh-CN/components/animation
https://www.layui-vue.com/zh-CN/components/button
https://www.layui-vue.com/zh-CN/components/color
............

https://www.layui-vue.com/zh-CN/resources


PHẢI LÀ CLIENT SPA VUE3 HOÀN TOÀN.

TOÀN BỘ THAY ĐỔI, SỬA CHỮA PHẢI THỰC HIỆN TRỰC TIẾP TRONG SOURCE CODE. KHÔNG THỰC HIỆN TRÊN FILE ĐÃ BUILD.

HẠN CHẾ TỐI ĐA OVERRIDE CSS VÀ !important. FIX TRIỆT ĐỂ TRONG SOURCE GỐC CỦA COMPONENT/MODULE.


Phải tổ chức  gom lại thành  các  file tập trung sử dụng trung , không sử dụng hard code  styles inline khi có thể sử dụng các  hàm tiện ích chung , bố trí thư mục sạch sẽ gọn gàng ko trùng lặp tránh deadcode và  duplite  , hiệu năng và  ổn định cực kì quan trọng .

FastAPI Backend - Lưu ý quan trọng từ chuyên gia
🔴 Cực kì quan trọng
Architecture & Structure

Dùng layered architecture: Router → Service → Repository → Model, không để business logic trong router
Tách biệt hoàn toàn schema (Pydantic) và model (SQLAlchemy), không dùng chung
Mỗi domain/module có folder riêng: users/, bets/, transactions/...

Async & Performance

Async tất cả: async def cho mọi endpoint, dùng async driver (asyncpg, aiomysql, motor)
Không bao giờ block event loop: không dùng time.sleep(), requests (thay bằng httpx), các I/O sync
Database connection phải dùng connection pool (min/max size), không tạo connection mới mỗi request
Dùng asynccontextmanager cho DB session, không để session leak

Security

JWT: access token ngắn hạn (15-30min) + refresh token (httponly cookie), không lưu sensitive data trong payload
Validate và sanitize mọi input từ user, dùng Pydantic strict mode
Rate limiting bắt buộc cho auth endpoints (login, register, OTP)
Không log sensitive data: password, token, card number
Dùng HTTPS only, CORS config chặt chẽ (không allow_origins=["*"] trên production)

Database

Mọi mutation phải có transaction, rollback đúng chỗ
Index đúng chỗ: các cột thường query (user_id, status, created_at)
Tránh N+1 query: dùng selectinload, joinedload khi cần relation
Không raw query nếu có thể, nếu raw thì parameterized query (chống SQL injection)

Error Handling

Custom exception handler toàn cục, trả về format lỗi nhất quán
Không để lộ stack trace ra response trên production
Phân biệt rõ 400 (client error) vs 500 (server error)


🟡 Quan trọng
API Design

Versioning ngay từ đầu: /api/v1/...
Response schema nhất quán: { success, data, message, code }
Dùng HTTP method đúng nghĩa: GET/POST/PUT/PATCH/DELETE
Pagination bắt buộc cho list endpoint (limit/offset hoặc cursor)

Dependency Injection

Tận dụng Depends() để inject: DB session, current user, permissions
Tạo permission decorator/dependency cho role-based access (admin, agent, user)
Không hardcode business rule trong route, đưa vào service layer

Background Tasks

Dùng Celery + Redis cho heavy tasks (report, email, notification), không dùng BackgroundTasks của FastAPI cho critical jobs
Queue task thay vì xử lý sync khi response không cần kết quả ngay

Caching

Cache với Redis cho: config hệ thống, dữ liệu ít thay đổi, session
Set TTL phù hợp, có chiến lược invalidate cache rõ ràng

Logging & Monitoring

Structured logging (JSON format), có request_id theo dõi từng request
Log đủ level: DEBUG (dev), INFO (normal flow), WARNING (bất thường), ERROR (exception)
Middleware log: method, path, status code, response time mỗi request
Tích hợp Sentry hoặc tương đương cho error tracking production

Testing

Unit test cho service layer (mock DB)
Integration test cho API endpoint dùng TestClient + test DB riêng
Coverage tối thiểu 70% cho critical path (auth, payment, bet)

Deployment

Dùng Gunicorn + Uvicorn workers (không chạy uvicorn đơn độc production)
Environment config qua .env + pydantic-settings, không hardcode
Health check endpoint /health và /ready
Graceful shutdown: không kill giữa chừng request đang xử lý

Migration

Dùng Alembic, không tự tay sửa DB schema trực tiếp
Mỗi migration có upgrade và downgrade
Không xóa column ngay, deprecate trước rồi xóa sau vài version


🟢 Nên làm

OpenAPI docs (/docs) chỉ bật ở dev/staging, tắt production hoặc password-protect
Dùng response_model cho mọi endpoint để filter output
Đặt timeout cho external API calls
Gzip response cho payload lớn (GZipMiddleware)
Chuẩn hóa datetime: UTC lưu DB, convert timezone ở client