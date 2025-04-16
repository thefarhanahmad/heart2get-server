import Report from '../../models/reportModel.js';
import User from '../../models/userModel.js';

export const getAllReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const per_page = parseInt(req.query.per_page) || 10;
        const skip = (page - 1) * per_page;

        const totalReports = await Report.countDocuments();
        const totalPages = Math.ceil(totalReports / per_page);

        const reports = await Report.find()
            .populate('reported_user', 'name email')
            .populate('reported_by', 'name')
            .sort('-createdAt')
            .skip(skip)
            .limit(per_page)
            .lean();

        const formattedReports = reports.map(report => ({
            id: report._id,
            reportedUser: {
                id: report.reported_user._id,
                name: report.reported_user.name
            },
            reason: report.reason,
            reportedBy: {
                id: report.reported_by._id,
                name: report.reported_by.name
            },
            status: report.status,
            admin_action: report.admin_action,
            created_at: report.createdAt
        }));

        res.status(200).json({
            status: true,
            data: {
                current_page: page,
                total_pages: totalPages,
                total_reports: totalReports,
                reports: formattedReports
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const getBannedUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const per_page = parseInt(req.query.per_page) || 10;
        const skip = (page - 1) * per_page;

        const totalBannedUsers = await User.countDocuments({ status: 'banned' });
        const totalPages = Math.ceil(totalBannedUsers / per_page);

        const bannedUsers = await User.find({ status: 'banned' })
            .select('name email mobile status report createdAt')
            .skip(skip)
            .limit(per_page)
            .lean();

        const formattedUsers = bannedUsers.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            status: user.status,
            banned_reason: user.report?.reports[user.report.reports.length - 1]?.reason || 'Not specified',
            banned_at: user.report?.reports[user.report.reports.length - 1]?.created_at || user.updatedAt
        }));

        res.status(200).json({
            status: true,
            data: {
                current_page: page,
                total_pages: totalPages,
                total_banned_users: totalBannedUsers,
                banned_users: formattedUsers
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const banUser = async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.params.user_id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        user.status = 'banned';
        if (!user.report) {
            user.report = {
                reported_count: 1,
                reports: []
            };
        }

        user.report.reports.push({
            reason,
            created_at: new Date()
        });

        await user.save();

        res.status(200).json({
            status: true,
            message: "User banned successfully",
            user: {
                id: user._id,
                status: user.status,
                banned_reason: reason
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }


};


export const updateReportStatus = async (req, res) => {
    try {
        const { action } = req.body;
        const reportId = req.params.reportId;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                status: false,
                message: "Invalid action. Must be either 'approve' or 'reject'"
            });
        }

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({
                status: false,
                message: "Report not found"
            });
        }

        report.status = action === 'approve' ? 'resolved' : 'dismissed';
        report.admin_action = action === 'approve' ? 'warning' : 'none';
        await report.save();

        // If approved, update user's report count and status if necessary
        if (action === 'approve') {
            const user = await User.findById(report.reported_user);
            if (user) {
                if (!user.report) {
                    user.report = {
                        reported_count: 0,
                        reports: []
                    };
                }
                user.report.reported_count += 1;
                user.report.reports.push({
                    reason: report.reason,
                    created_at: new Date()
                });

                // If user has been reported multiple times, consider banning
                if (user.report.reported_count >= 3) {
                    user.status = 'banned';
                }

                await user.save();
            }
        }

        res.status(200).json({
            status: true,
            message: "Report status updated successfully",
            report: {
                id: report._id,
                status: report.status,
                admin_action: report.admin_action
            }
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};