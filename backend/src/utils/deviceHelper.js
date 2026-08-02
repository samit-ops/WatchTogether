const crypto = require('crypto');

/**
 * Extracts IP, User-Agent, Device Fingerprint and estimated City/State location from incoming HTTP request.
 */
function getClientDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ip = rawIp.split(',')[0].trim();

  // Custom location headers if provided or geo estimation defaults
  const city = req.headers['x-client-city'] || req.headers['cf-ipcity'] || 'New Delhi';
  const state = req.headers['x-client-state'] || req.headers['cf-ipregion'] || 'Delhi';
  const country = req.headers['x-client-country'] || req.headers['cf-ipcountry'] || 'India';

  // Generate lightweight MD5 fingerprint based on User-Agent
  const deviceId = crypto.createHash('md5').update(userAgent).digest('hex');

  return {
    deviceId,
    ip,
    city,
    state,
    country,
    userAgent
  };
}

/**
 * Checks whether the incoming device & location is already registered in user.knownDevices.
 */
function isKnownDeviceOrLocation(user, currentDevice) {
  if (!user.knownDevices || user.knownDevices.length === 0) {
    return false;
  }

  return user.knownDevices.some(device => {
    const isSameDevice = device.deviceId === currentDevice.deviceId;
    const isSameLocation = 
      device.city.toLowerCase() === currentDevice.city.toLowerCase() &&
      device.state.toLowerCase() === currentDevice.state.toLowerCase();
    
    return isSameDevice && isSameLocation;
  });
}

module.exports = {
  getClientDeviceInfo,
  isKnownDeviceOrLocation
};
