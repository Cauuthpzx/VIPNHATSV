import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PYTHON_SCRIPT = path.resolve(__dirname, "../../../scripts/solve-captcha.py");
const SOLVE_TIMEOUT_MS = 15_000;

/**
 * Solve captcha using ddddocr (Python).
 * Pipes image buffer to Python script stdin, reads result from stdout.
 */
export async function solveCaptcha(imageBuffer: Buffer): Promise<string | null> {
  return new Promise((resolve) => {
    const child = execFile(
      "python",
      [PYTHON_SCRIPT],
      { timeout: SOLVE_TIMEOUT_MS, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          logger.warn({ error: error.message, stderr: stderr?.slice(0, 200) }, "ddddocr solve failed");
          resolve(null);
          return;
        }

        const result = stdout.trim();
        if (!result || result.length < 3 || result.length > 6) {
          logger.warn({ raw: result }, "ddddocr result invalid length");
          resolve(null);
          return;
        }

        // Take first 4 chars if longer
        const cleaned = result.slice(0, 4);
        logger.debug({ result: cleaned, raw: result }, "Captcha solved (ddddocr)");
        resolve(cleaned);
      },
    );

    // Pipe image to stdin
    if (child.stdin) {
      child.stdin.write(imageBuffer);
      child.stdin.end();
    }
  });
}
