import Activity from '../../models/activityModel.js';
import User from '../../models/userModel.js';
import Payment from '../../models/paymentModel.js';
import { startOfDay, subDays, format, startOfMonth, subMonths } from 'date-fns';

export const getRecentActivities = async (req, res) => {
    try {
        const activities = await Activity.find()
            .populate('user_id', 'name')
            .sort('-createdAt')
            .limit(5)
            .lean();

        const formattedActivities = activities.map(activity => ({
            user_id: activity.user_id._id,
            activity_type: activity.activity_type,
            description: activity.description,
            timestamp: activity.createdAt
        }));

        res.status(200).json({
            status: true,
            message: "Recent activities fetched successfully",
            data: formattedActivities
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const getUserGrowthChart = async (req, res) => {
    try {
        const { time_frame } = req.body;
        let startDate;
        let dateFormat;

        switch (time_frame) {
            case 'Last 7 days':
                startDate = subDays(startOfDay(new Date()), 6);
                dateFormat = 'yyyy-MM-dd';
                break;
            case 'Last 30 days':
                startDate = subDays(startOfDay(new Date()), 29);
                dateFormat = 'yyyy-MM-dd';
                break;
            case 'Last 3 months':
                startDate = subMonths(startOfMonth(new Date()), 2);
                dateFormat = 'yyyy-MM';
                break;
            case 'Last year':
                startDate = subMonths(startOfMonth(new Date()), 11);
                dateFormat = 'yyyy-MM';
                break;
            default:
                return res.status(400).json({
                    status: false,
                    message: "Invalid time frame"
                });
        }

        const users = await User.find({
            createdAt: { $gte: startDate }
        }).lean();

        const growthData = {};
        users.forEach(user => {
            const date = format(user.createdAt, dateFormat);
            growthData[date] = (growthData[date] || 0) + 1;
        });

        const labels = Object.keys(growthData).sort();
        const userGrowth = labels.map(date => growthData[date]);

        res.status(200).json({
            status: "success",
            data: {
                labels,
                user_growth: userGrowth
            },
            message: "User growth data retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

export const getRevenueChart = async (req, res) => {
    try {
        const { time_frame } = req.body;
        let startDate;
        let dateFormat;

        switch (time_frame) {
            case 'Last 7 days':
                startDate = subDays(startOfDay(new Date()), 6);
                dateFormat = 'yyyy-MM-dd';
                break;
            case 'Last 30 days':
                startDate = subDays(startOfDay(new Date()), 29);
                dateFormat = 'yyyy-MM-dd';
                break;
            case 'Last 3 months':
                startDate = subMonths(startOfMonth(new Date()), 2);
                dateFormat = 'yyyy-MM';
                break;
            case 'Last year':
                startDate = subMonths(startOfMonth(new Date()), 11);
                dateFormat = 'yyyy-MM';
                break;
            default:
                return res.status(400).json({
                    status: false,
                    message: "Invalid time frame"
                });
        }

        const payments = await Payment.find({
            createdAt: { $gte: startDate },
            status: 'success'
        }).lean();

        const revenueData = {};
        payments.forEach(payment => {
            const date = format(payment.createdAt, dateFormat);
            revenueData[date] = (revenueData[date] || 0) + payment.amount;
        });

        const labels = Object.keys(revenueData).sort();
        const revenue = labels.map(date => revenueData[date]);

        res.status(200).json({
            status: "success",
            data: {
                labels,
                revenue
            },
            message: "Revenue data retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};