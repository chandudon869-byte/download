const router = require("express").Router();
const db = require("../db/pool");
const { syncAllEvents } = require("../services/syncService");

function serializeEvent(row) {
    return {
        ...row,
        shares: Number(row.shares || 0),
        issue_size: Number(row.issue_size || 0),
        confidence: Number(row.confidence || 0)
    };
}

// Get IPOs
async function getIPOs(req, res) {
    try {
        const result = await db.query(
            "SELECT * FROM upcoming_ipos WHERE UPPER(issue_type) = 'IPO' ORDER BY open_date ASC"
        );
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows.map(serializeEvent)
        });
    } catch (err) {
        console.error("❌ Error fetching IPOs:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get Dividends
async function getDividends(req, res) {
    try {
        let result = await db.query(
            "SELECT * FROM upcoming_ipos WHERE UPPER(issue_type) = 'DIVIDEND' ORDER BY updated_at DESC"
        );
        if (result.rows.length === 0) {
            result = await db.query(
                "SELECT *, type AS issue_type FROM stock_events WHERE UPPER(type) = 'DIVIDEND' ORDER BY date DESC NULLS LAST, updated_at DESC"
            );
        }
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows.map(serializeEvent)
        });
    } catch (err) {
        console.error("❌ Error fetching Dividends:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get Bonus
async function getBonus(req, res) {
    try {
        let result = await db.query(
            "SELECT * FROM upcoming_ipos WHERE UPPER(issue_type) = 'BONUS' ORDER BY updated_at DESC"
        );
        if (result.rows.length === 0) {
            result = await db.query(
                "SELECT *, type AS issue_type FROM stock_events WHERE UPPER(type) = 'BONUS' ORDER BY date DESC NULLS LAST, updated_at DESC"
            );
        }
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows.map(serializeEvent)
        });
    } catch (err) {
        console.error("❌ Error fetching Bonus:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get Right Share
async function getRightShare(req, res) {
    try {
        let result = await db.query(
            "SELECT * FROM upcoming_ipos WHERE UPPER(issue_type) = 'RIGHT_SHARE' ORDER BY updated_at DESC"
        );
        if (result.rows.length === 0) {
            result = await db.query(
                "SELECT *, type AS issue_type FROM stock_events WHERE UPPER(type) = 'RIGHT_SHARE' ORDER BY date DESC NULLS LAST, updated_at DESC"
            );
        }
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows.map(serializeEvent)
        });
    } catch (err) {
        console.error("❌ Error fetching RightShare:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get AGM
async function getAgm(req, res) {
    try {
        let result = await db.query(
            "SELECT * FROM upcoming_ipos WHERE UPPER(issue_type) = 'AGM' ORDER BY updated_at DESC"
        );
        if (result.rows.length === 0) {
            result = await db.query(
                "SELECT *, type AS issue_type FROM stock_events WHERE UPPER(type) = 'AGM' ORDER BY date DESC NULLS LAST, updated_at DESC"
            );
        }
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows.map(serializeEvent)
        });
    } catch (err) {
        console.error("Error fetching AGM:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get all events
async function getAllEvents(req, res) {
    try {
        const result = await db.query(
            "SELECT * FROM upcoming_ipos ORDER BY updated_at DESC"
        );
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows.map(serializeEvent)
        });
    } catch (err) {
        console.error("❌ Error fetching all events:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

router.get("/", getAllEvents);
router.get("/ipo", getIPOs);
router.get("/dividend", getDividends);
router.get("/bonus", getBonus);
router.get("/rights", getRightShare);
router.get("/agm", getAgm);
router.get("/upcoming", getIPOs);

// Debug endpoint - check tables exist and show raw data
router.get("/debug", async (req, res) => {
    try {
        console.log("🔍 DEBUG: Checking database...");
        
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'upcoming_ipos'
            )
        `);
        
        const tableInfo = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'upcoming_ipos'
            ORDER BY ordinal_position
        `);
        
        const countResult = await db.query("SELECT COUNT(*) as count FROM upcoming_ipos");
        const rowCount = parseInt(countResult.rows[0].count);
        
        const typeBreakdown = await db.query(
            "SELECT issue_type, COUNT(*) as count FROM upcoming_ipos GROUP BY issue_type"
        );
        
        res.json({
            success: true,
            debug: {
                table_exists: tableCheck.rows[0].exists,
                columns: tableInfo.rows,
                row_count: rowCount,
                breakdown_by_type: typeBreakdown.rows,
                message: "Database structure is OK"
            }
        });
    } catch (err) {
        console.error("❌ DEBUG Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Sync endpoint - accepts both GET and POST
router.get("/sync", syncHandler);
router.post("/sync", syncHandler);

async function syncHandler(req, res) {
    try {
        console.log("🔄 Starting sync...");
        const { fromDate, toDate } = req.query;
        const result = await syncAllEvents(fromDate, toDate);
        res.json(result);
    } catch (err) {
        console.error("❌ Error in sync:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = router;
