export default {
  "BACKEND/src/**/*.ts": [
    "node ./node_modules/eslint/bin/eslint.js --fix",
    "node ./node_modules/prettier/bin/prettier.cjs --write",
  ],
  "FRONTEND/app/src/**/*.{ts,vue}": [
    "node ./node_modules/eslint/bin/eslint.js --fix",
    "node ./node_modules/prettier/bin/prettier.cjs --write",
  ],
};
