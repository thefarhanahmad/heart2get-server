import Activity from '../../models/activityModel.js';
import User from '../../models/userModel.js';
import Payment from '../../models/paymentModel.js';
import Subscription from '../../models/subscriptionPlanModel.js';
import Admin from '../../models/adminModel.js';
import Banned from '../../models/bannedUserModel.js';
import Interest from '../../models/interestModel.js';
import { startOfDay, subDays, format, startOfMonth, subMonths } from 'date-fns';



export const getRecentActivities = async (req, res) => {
    try {
        const [users, subscriptions, admins, payments, banneds, interests] = await Promise.all([
            User.find({}, 'name createdAt').sort('-createdAt').limit(5).lean(),
            Subscription.find({})
                .populate('user', 'name')  // Ensure `user` is defined in your schema as a reference
                .sort('-createdAt')
                .limit(5)
                .lean(),
            Admin.find({}, 'name createdAt').sort('-createdAt').limit(5).lean(),
            Payment.find()
                .populate('user_id', 'name email')
                .populate('plan_id', 'name')
                .sort('-createdAt')
                .limit(5)
                .lean(),
            Banned.find({})
                .populate('user', 'name')
                .sort('-createdAt')
                .limit(5)
                .lean(),
            Interest.find({})
                .populate('fromUser toUser', 'name')
                .sort('-createdAt')
                .limit(5)
                .lean()
        ]);

        const activities = [
            ...users.map(u => ({
                activity_type: 'User',
                description: `New user registered: ${u.name}`,
                user_id: u.name,
                createdAt: u.createdAt
            })),
            ...subscriptions.map(s => ({
                activity_type: 'Subscription',
                description: `Subscription started: ${s.plan}`,
                user_id: s.user?.name || 'N/A',
                createdAt: s.createdAt
            })),
            ...admins.map(a => ({
                activity_type: 'Admin',
                description: `Admin activity by ${a.name}`,
                user_id: a.name,
                createdAt: a.createdAt
            })),
            ...payments.map(p => ({
                activity_type: 'Payment',
                description: `Payment made: $${p.amount}`,
                user_id: p.user?.name || 'N/A',
                createdAt: p.createdAt
            })),
            ...banneds.map(b => ({
                activity_type: 'Banned',
                description: `User banned for: ${b.reason}`,
                user_id: b.user?.name || 'N/A',
                createdAt: b.createdAt
            })),
            ...interests.map(i => ({
                activity_type: 'Interest',
                description: `Interest sent from ${i.fromUser?.name || 'N/A'} to ${i.toUser?.name || 'N/A'}`,
                user_id: i.fromUser?.name || 'N/A',
                createdAt: i.createdAt
            }))
        ];

        const recentActivities = activities
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        res.status(200).json({
            status: true,
            message: 'Recent activities fetched successfully',
            data: recentActivities
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
            createdAt: { $gte: startDate }
        }).lean();
        console.log("Query:", payments);
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