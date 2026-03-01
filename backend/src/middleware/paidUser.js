/**
 * Paid User Middleware
 * 
 * Restricts access to paid-only features (Creator Analytics Dashboard).
 * Checks user.accountType and subscription status.
 */

function requirePaidAccount(req, res, next) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Admin always has access
  if (user.role === 'admin') {
    return next();
  }

  // Check paid account type
  if (user.accountType !== 'paid') {
    return res.status(403).json({
      success: false,
      message: 'This feature requires a paid account. Please upgrade to access Creator Analytics.',
      code: 'UPGRADE_REQUIRED',
      upgradeUrl: '/settings?tab=subscription',
    });
  }

  // Check active subscription
  if (user.subscription && !user.subscription.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your subscription has expired. Please renew to access Creator Analytics.',
      code: 'SUBSCRIPTION_EXPIRED',
      upgradeUrl: '/settings?tab=subscription',
    });
  }

  next();
}

/**
 * Optional paid check — allows access but marks the request
 * so controllers can return limited/blurred data for free users.
 */
function optionalPaidCheck(req, res, next) {
  const user = req.user;
  req.isPaidUser = false;

  if (user) {
    if (user.role === 'admin' || user.accountType === 'paid') {
      if (!user.subscription || user.subscription.isActive) {
        req.isPaidUser = true;
      }
    }
  }

  next();
}

module.exports = { requirePaidAccount, optionalPaidCheck };
