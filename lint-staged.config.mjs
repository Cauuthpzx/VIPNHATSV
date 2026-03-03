export default {
  "BACKEND/src/**/*.ts": [
    "eslint --fix",
    "prettier --write",
  ],
  "FRONTEND/app/src/**/*.{ts,vue}": [
    "eslint --fix",
    "prettier --write",
  ],
};
