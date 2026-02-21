/**
 * Vercel Serverless Entry Point
 *
 * This file wraps the Express app for Vercel's Node.js runtime.
 * All routes (API + static dashboard assets) are handled here.
 *
 * NOTE: The dropzone session storage uses the filesystem.
 * On Vercel the filesystem is ephemeral — sessions are lost
 * between cold starts and cannot be shared across instances.
 * For persistent storage, set DROPZONE_ROOT=/tmp/dropzone or
 * migrate to an external store (S3, R2, etc.).
 */
import app from "../src/server.js";

export default app;
