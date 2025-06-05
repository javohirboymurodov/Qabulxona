const receptionHistoryService = require('../services/receptionHistoryService');
const { handleError } = require('../utils/helpers');

/**
 * Get reception history for a date range
 */
exports.getReceptionHistory = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                message: 'Start date and end date are required' 
            });
        }
        
        const history = await receptionHistoryService.getHistoryByDateRange(startDate, endDate);
        res.json(history);
    } catch (error) {
        next(error);
    }
};

/**
 * Get reception history for a specific date
 */
exports.getHistoryByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ 
                message: 'Date parameter is required' 
            });
        }
        
        const history = await receptionHistoryService.getHistoryByDate(date);
        res.json(history);
    } catch (error) {
        next(error);
    }
};

/**
 * Archive today's reception data
 */
exports.archiveReceptionData = async (req, res, next) => {
    try {
        const history = await receptionHistoryService.archiveToday();
        res.json({
            success: true,
            message: 'Ma\'lumotlar muvaffaqiyatli arxivlandi',
            data: history
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get archive status
 */
exports.getArchiveStatus = async (req, res, next) => {
    try {
        const status = await receptionHistoryService.getArchiveStatus();
        res.json(status);
    } catch (error) {
        next(error);
    }
};

/**
 * Force archive current reception data
 */
exports.forceArchive = async (req, res, next) => {
    try {
        await receptionHistoryService.archiveToday();
        res.json({
            success: true,
            message: 'Ma\'lumotlar muvaffaqiyatli arxivlandi'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get reception statistics
 */
exports.getReceptionStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                message: 'Start date and end date are required'
            });
        }

        const history = await receptionHistoryService.getHistoryByDateRange(startDate, endDate);
        
        const stats = {
            total: history.length,
            present: history.filter(record => record.status === 'present').length,
            absent: history.filter(record => record.status === 'absent').length
        };

        res.json(stats);
    } catch (error) {
        next(error);
    }
};
