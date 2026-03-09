import express from "express";
import { alphaNumStr, strFromPattern } from './string_generator.mjs';

const app = express();
app.use(express.json());

// Config
const PORT = process.env.PORT || 3000;
const DEFAULT_LENGTH = 16;
const MAX_LENGTH = 256;


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

/**
 * POST /pattern-string
 * Req Body: { "pattern": "[A-Za-z0-9!@^_-]{12,16}" }
 * Res Body: { "pattern_string": "..."}
 */
app.post('/pattern-string', (req, res) => {

    const pattern = req.body?.pattern;

    if (!pattern) {        
        return res.status(400).json({
            error: { code: "BAD_REQUEST", message: "request for patterned string must include a pattern" }
        });
    }

    try {
        const pattern_string = strFromPattern(pattern)
        return res.status(200).json({ pattern_string })
    } catch (err) {
        return res.status(400).json({
            error: { code: "BAD_REQUEST", message: err.message}
        })
    }

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
    console.log(`Random String Generator listening on port ${PORT}...`);
});
