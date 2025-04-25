import Admin from '../../models/adminModel.js';
import bcrypt from 'bcryptjs';

export const createAdmin = async (req, res) => {
  try {
    const { permissions, ...adminData } = req.body;

    const admin = await Admin.create({
      ...adminData,
      permissions: permissions || {}
    });

    res.status(201).json({
      status: true,
      message: "Admin created successfully",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error.message
    });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-password')
      .lean();

    const formattedAdmins = admins.map(admin => ({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      status: admin.status || 'active'
    }));

    res.status(200).json({
      status: true,
      admins: formattedAdmins
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id)
      .select('-password')
      .lean();

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found"
      });
    }

    res.status(200).json({
      status: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status || 'active'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "Admin updated successfully",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error.message
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "Admin deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const updateAdminStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Invalid status value"
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "Admin status updated"
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

export const assignRole = async (req, res) => {
  try {
    const { role, permissions } = req.body;

    if (!['admin', 'moderator', 'supervisor'].includes(role)) {
      return res.status(400).json({
        status: false,
        message: "Invalid role"
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      {
        role,
        ...(permissions && { permissions })
      },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "Role and permissions assigned to admin"
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};