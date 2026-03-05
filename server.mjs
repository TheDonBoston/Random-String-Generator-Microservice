import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

// Config
const PORT = process.env.PORT || 3000;
const DEFAULT_LENGTH = 16;
const MAX_LENGTH = 256;

// 26 upper + 26 lower + 10 digits = 62 characters
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a cryptographically secure random alphanumeric string.
 */
function alphaNumStr(length = DEFAULT_LENGTH) {
    let result = "";

    for (let i = 0; i < length; i++) {
        const idx = crypto.randomInt(0, CHARSET.length);
        result += CHARSET[idx];
    }
    return result;
}

/**
 * POST /random-string
 * Body (optional): { "length": 16 }
 * Response: { "randomString": "...", "length": 16 }
 */

app.post("/random-string", (req, res) => {
    const rawLength = req.body?.length;
    const length = rawLength === undefined ? DEFAULT_LENGTH : rawLength;

    // Validate length
    if (!Number.isInteger(length)) {
        return res.status(400).json({
            error: { code: "BAD_REQUEST", message: "length must be an integer" },
        });
    }

    if (length <= 0) {
        return res.status(400).json({
            error: { code: "BAD_REQUEST", message: "length must be greater than 0"},
        });
    }

    if (length > MAX_LENGTH) {
        return res.status(400).json({
            error: {
                code: "BAD_REQUEST",
                message: `length must be <= ${MAX_LENGTH}`,
            },
        });
    }

    const randomString = alphaNumStr(length);

    return res.status(200).json({ randomString, length });
});

app.use((err, req, res, next) => {
  console.error("Internal error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Service encountered an internal error.",
    },
  });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Random String Generator listening on post ${PORT}...`);
});
