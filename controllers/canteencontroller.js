const Canteen = require('../models/Canteen');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary'); // Assuming you have a file upload utility

// Create or Update Menu
exports.createUpdateMenu = async (req, res) => {
  try {
    const { menu } = req.body;
    const userId = req.user.id;
    console.log(userId)

    // Validate input
    if (!menu || !Array.isArray(menu)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Menu data is required and should be an array' 
      });
    }

    // Check if user exists and is a canteen owner
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.role !== 'canteen') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only canteen owners can update menu' 
      });
    }

    // Validate menu items
    const isValidMenu = menu.every(item => item.item && item.price);
    if (!isValidMenu) {
      return res.status(400).json({
        success: false,
        message: 'Each menu item must have both name and price'
      });
    }

    // Find or create canteen entry
    let canteen = await Canteen.findOne({ submittedBy: userId });
    
    if (!canteen) {
      canteen = new Canteen({
        menu,
        submittedBy: userId,
        canteenName: user.canteenName || `${user.name}'s Canteen`
      });
    } else {
      canteen.menu = menu;
      canteen.updatedAt = new Date();
    }

    await canteen.save();

    res.status(200).json({
      success: true, 
      message: 'Menu updated successfully',
      data: {
        menu: canteen.menu,
        canteenName: canteen.canteenName,
        updatedAt: canteen.updatedAt
      }
    });
  } catch (error) {  
    console.error('Error updating menu:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update a specific menu item
// Update a specific menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { item, price } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!item || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Both item name and price are required'
      });
    }

    const canteen = await Canteen.findOne({ submittedBy: userId });
    if (!canteen) {
      return res.status(404).json({
        success: false,
        message: 'Canteen not found'
      });
    }

    // Find the specific menu item by its _id
    const menuItem = canteen.menu.id(itemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Update the item
    menuItem.item = item;
    menuItem.price = price;
    canteen.updatedAt = new Date();
    
    await canteen.save();

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a specific menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const canteen = await Canteen.findOne({ submittedBy: userId });
    if (!canteen) {
      return res.status(404).json({
        success: false,
        message: 'Canteen not found'
      });
    }

    // Remove the item by filtering on _id
    canteen.menu = canteen.menu.filter(item => item._id.toString() !== itemId);
    canteen.updatedAt = new Date();
    
    await canteen.save();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
exports.deleteMenu = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Canteen.deleteOne({ submittedBy: userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No menu found to delete'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



// Get Menu (for canteen owner)
exports.getMenu = async (req, res) => {
  try {
    const userId = req.user.id;
    const canteen = await Canteen.findOne({ submittedBy: userId });

    if (!canteen) {
      return res.status(404).json({
        success: false,
        message: 'No menu found for this canteen'
      });
    }

    res.status(200).json({
      success: true,
      data: canteen.menu
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Upload Bill
exports.uploadBill = async (req, res) => {
  try {
    const userId = req.user._id;
    const { file } = req; // Assuming you're using multer for file uploads

    // Check if user is a canteen owner
    const user = await User.findById(userId);
    if (user.role !== 'canteen') {
      return res.status(403).json({ success: false, message: 'Only canteen owners can upload bills' });
    }

    // Upload file to cloud storage
    const result = await uploadToCloudinary(file.path); // Implement your file upload logic

    // Find or create canteen entry
    let canteen = await Canteen.findOne({ submittedBy: userId });
    
    if (!canteen) {
      canteen = new Canteen({
        bill: result.secure_url,
        submittedBy: userId
      });
    } else {
      canteen.bill = result.secure_url;
    }

    await canteen.save();

    res.status(200).json({
      success: true,
      message: 'Bill uploaded successfully',
      data: {
        billUrl: result.secure_url
      }
    });
  } catch (error) {
    console.error('Error uploading bill:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get All Canteen Data (for admin)
exports.getAllCanteenData = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only admins can view all canteen data' });
    }

    const canteens = await Canteen.find()
      .populate('submittedBy', 'name email')
      .sort({ submissionDate: -1 });

    res.status(200).json({
      success: true,
      count: canteens.length,
      data: canteens
    });
  } catch (error) {
    console.error('Error fetching canteen data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getAllMenus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only admins can view all menus' });
    }

    const canteens = await Canteen.find({})
      .populate('submittedBy', 'name email canteenName')
      .select('menu canteenName updatedAt')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: canteens.length,
      data: canteens.map(c => ({
        canteenName: c.canteenName || 'Unnamed Canteen',
        owner: c.submittedBy ? c.submittedBy.name : 'Unknown',
        email: c.submittedBy ? c.submittedBy.email : '',
        menu: c.menu,
        lastUpdated: c.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching all menus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};